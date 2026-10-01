/**
 * Utility for handling MinIO storage URLs and media assets
 */
import defaultAvatar from '../assets/default-avatar.png';

const resolveMinioBase = (): string => {
  const envVal = import.meta.env.VITE_MINIO_URL;
  if (!envVal || envVal.includes('host.docker.internal')) {
    return '/social-media';
  }
  const clean = envVal.replace(/\/+$/, '');
  return clean.endsWith('/social-media') ? clean : `${clean}/social-media`;
};

export const MINIO_URL = `${resolveMinioBase()}/`;

export const DEFAULT_AVATAR_FALLBACK = defaultAvatar || '/default-avatar.png';

/**
 * Resolves a media path (avatar, banner, post media) to an accessible URL.
 */
export const getMediaUrl = (path?: string | null, fallbackUrl: string = ''): string => {
  if (!path || !path.trim()) return fallbackUrl;
  if (path.startsWith('data:') || path.startsWith('blob:')) return path;

  let clean = path.trim().replace(/^https?:\/\/(host\.docker\.internal|localhost|minio):9000\/?/, '');
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;

  clean = clean.replace(/^\/+/, '').replace(/^social-media\/?/, '');
  return `${resolveMinioBase()}/${clean}`;
};

/**
 * Resolves avatar URL with default fallback
 */
export const getAvatarUrl = (path?: string | null): string => {
  return getMediaUrl(path, DEFAULT_AVATAR_FALLBACK);
};

/**
 * Resolves banner URL
 */
export const getBannerUrl = (path?: string | null): string => {
  return getMediaUrl(path, '');
};

/**
 * Checks if a media item is a video by type or URL extension
 */
export const isVideoMedia = (mediaUrl?: string | null, mediaType?: string | null): boolean => {
  if (mediaType?.toUpperCase() === 'VIDEO') return true;
  if (!mediaUrl) return false;
  const cleanUrl = mediaUrl.split('?')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.ogg') ||
    cleanUrl.endsWith('.mkv')
  );
};
