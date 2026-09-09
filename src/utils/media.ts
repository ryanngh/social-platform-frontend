/**
 * Utility for handling MinIO storage URLs and media assets
 */
import defaultAvatar from '../assets/default-avatar.png';

export const MINIO_URL = (import.meta.env.VITE_MINIO_URL || 'http://localhost:9000/social-media/').replace(/\/+$/, '') + '/';

export const DEFAULT_AVATAR_FALLBACK = defaultAvatar || '/default-avatar.png';

/**
 * Resolves a media path (avatar, banner, post media) to an absolute URL.
 * - If path is already http://, https://, blob:, or data:, returns it as is.
 * - If path is relative (e.g. 'avatars/uuid/file.jpg'), prefixes with MINIO_URL.
 * - If path is null or empty, returns fallbackUrl.
 */
export const getMediaUrl = (path?: string | null, fallbackUrl: string = ''): string => {
  if (!path || !path.trim()) {
    return fallbackUrl;
  }
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  const cleanBase = MINIO_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${cleanBase}/${cleanPath}`;
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
