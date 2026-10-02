export interface LinkPreviewMetadata {
  url: string;
  domain: string;
  siteName: string;
  title: string;
  description: string;
  imageUrl?: string;
  favicon?: string;
  isInternal?: boolean;
}

// Regex to detect URLs in plain text (http, https, or bare domains like www.rysocial.app or rysocial.app)
export const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"{}|\\^`[\]]+|(?:[a-zA-Z0-9-]+\.)+(?:com|app|io|org|net|dev|vn|edu|gov)(?:\/[^\s<>"{}|\\^`[\]]*)?/gi;

/**
 * Extracts the first valid URL from a text string.
 */
export function extractFirstUrl(text?: string | null): string | null {
  if (!text) return null;
  const matches = text.match(URL_REGEX);
  if (!matches || matches.length === 0) return null;
  let rawUrl = matches[0];
  // Strip trailing punctuation like . , ) ! ?
  rawUrl = rawUrl.replace(/[.,)!?]+$/, '');
  return rawUrl;
}

/**
 * Normalizes a URL to ensure it has a proper protocol.
 */
export function normalizeUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
}

/**
 * Extracts hostname from URL for display.
 */
export function getDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(normalizeUrl(url));
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
  }
}

/**
 * Resolves high quality preview metadata for known domains, with special detail for RySocial.
 */
export function getLinkPreviewMetadata(rawUrl: string, language: string = 'vi'): LinkPreviewMetadata {
  const fullUrl = normalizeUrl(rawUrl);
  const domain = getDomainFromUrl(rawUrl).toLowerCase();
  const isVi = language === 'vi';

  // 1. RySocial (Official platform URLs)
  if (domain.includes('rysocial') || domain.includes('localhost') || domain === '127.0.0.1') {
    return {
      url: fullUrl,
      domain: 'www.rysocial.app',
      siteName: 'RySocial',
      title: isVi
        ? 'RySocial · Connect · Share · Be You'
        : 'RySocial · Connect · Share · Be You',
      description: isVi
        ? 'Nơi những khoảnh khắc đẹp được kết nối, lan tỏa và trở nên ý nghĩa hơn.'
        : 'Where beautiful moments are connected, shared, and made meaningful.',
      imageUrl: '/rysocial-og-banner.png',
      favicon: '/logo.svg',
      isInternal: true,
    };
  }

  // 2. GitHub
  if (domain.includes('github.com')) {
    return {
      url: fullUrl,
      domain: 'GitHub',
      siteName: 'GitHub',
      title: 'GitHub · Change is constant. GitHub keeps you ahead.',
      description:
        'Join the world\'s most widely adopted, AI-powered developer platform where millions of developers, businesses, and the largest open source community build software that advances humanity.',
      imageUrl: '/rysocial-og-banner.svg',
      favicon: 'https://github.githubassets.com/favicons/favicon.svg',
    };
  }

  // 3. YouTube
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
    return {
      url: fullUrl,
      domain: 'YouTube',
      siteName: 'YouTube',
      title: isVi ? 'YouTube · Xem và chia sẻ video trực tuyến' : 'YouTube · Watch, Listen, and Stream Videos',
      description: isVi
        ? 'Thưởng thức các video và bản nhạc bạn yêu thích, tải nội dung gốc lên và chia sẻ với bạn bè, gia đình và toàn thế giới.'
        : 'Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube.',
      imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&auto=format&fit=crop&q=80',
      favicon: 'https://www.youtube.com/s/desktop/favicon.ico',
    };
  }

  // 4. Default / Generic Web Link Preview
  const displayDomain = domain.charAt(0).toUpperCase() + domain.slice(1);
  return {
    url: fullUrl,
    domain: domain,
    siteName: displayDomain,
    title: `${displayDomain} · ${isVi ? 'Xem thông tin chi tiết trên trang web' : 'Explore and connect on the web'}`,
    description: isVi
      ? `Khám phá nội dung, cập nhật mới nhất và thông tin hữu ích từ ${domain}. Nhấp để xem chi tiết.`
      : `Discover content, latest updates, and official information from ${domain}. Click to view details.`,
    imageUrl: '/rysocial-og-banner.svg',
    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  };
}
