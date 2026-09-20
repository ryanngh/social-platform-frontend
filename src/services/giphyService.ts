export interface GiphyGifItem {
  id: string;
  title: string;
  previewUrl: string;
  url: string;
  width: number;
  height: number;
}

export interface GiphyResponse {
  gifs: GiphyGifItem[];
  totalCount: number;
  hasMore: boolean;
}

interface RawGiphyItem {
  id: string;
  title: string;
  images?: {
    fixed_height?: { url: string; width: string; height: string };
    fixed_height_small?: { url: string; width: string; height: string };
    fixed_width?: { url: string; width: string; height: string };
    downsized_medium?: { url: string };
    original?: { url: string; width: string; height: string };
  };
}

const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

// Fallback to configured key or provided beta key
const getApiKey = (): string => {
  return (
    import.meta.env.VITE_GIPHY_API_KEY ||
    'ynrwsLdxVBdtT8SpPOuQjyynwM3rIvhP'
  );
};

const mapRawGif = (item: RawGiphyItem): GiphyGifItem => {
  const preview =
    item.images?.fixed_height?.url ||
    item.images?.fixed_height_small?.url ||
    item.images?.fixed_width?.url ||
    item.images?.original?.url ||
    '';

  const full =
    item.images?.original?.url ||
    item.images?.downsized_medium?.url ||
    preview;

  return {
    id: item.id,
    title: item.title?.trim() || 'GIF',
    previewUrl: preview,
    url: full,
    width: Number(item.images?.fixed_height?.width) || 200,
    height: Number(item.images?.fixed_height?.height) || 200,
  };
};

export const giphyService = {
  /**
   * Lấy danh sách GIF thịnh hành (Trending)
   */
  async getTrending(offset = 0, limit = 20): Promise<GiphyResponse> {
    const apiKey = getApiKey();
    const url = `${GIPHY_BASE_URL}/trending?api_key=${apiKey}&limit=${limit}&offset=${offset}&rating=g`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GIPHY API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawGifs: RawGiphyItem[] = data.data || [];
    const totalCount: number = data.pagination?.total_count || 0;

    const gifs = rawGifs
      .map(mapRawGif)
      .filter((gif) => Boolean(gif.url && gif.previewUrl));

    return {
      gifs,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  },

  /**
   * Tìm kiếm GIF theo từ khóa
   */
  async search(query: string, offset = 0, limit = 20): Promise<GiphyResponse> {
    const trimmed = query.trim();
    if (!trimmed) {
      return this.getTrending(offset, limit);
    }

    const apiKey = getApiKey();
    const url = `${GIPHY_BASE_URL}/search?api_key=${apiKey}&q=${encodeURIComponent(
      trimmed
    )}&limit=${limit}&offset=${offset}&rating=g&lang=vi`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GIPHY API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawGifs: RawGiphyItem[] = data.data || [];
    const totalCount: number = data.pagination?.total_count || 0;

    const gifs = rawGifs
      .map(mapRawGif)
      .filter((gif) => Boolean(gif.url && gif.previewUrl));

    return {
      gifs,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  },
};
