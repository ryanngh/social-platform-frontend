import type { User, UserSummary } from '../types';

/**
 * Returns the profile URL for a given user or username.
 * Supports clean root URLs (domain/:username or domain/:id) like modern social platforms.
 * 
 * @param userOrUsername User object, UserSummary, username string, or id string
 * @returns Clean profile URL string (e.g. '/zuck' or '/feed' if invalid)
 */
export function getProfileUrl(
  userOrUsername?: { username?: string; id?: string | number } | User | UserSummary | string | null
): string {
  if (!userOrUsername) return '/feed';

  if (typeof userOrUsername === 'string') {
    const trimmed = userOrUsername.trim().replace(/^@+/, '');
    return trimmed ? `/${trimmed}` : '/feed';
  }

  const identifier =
    userOrUsername.username?.trim().replace(/^@+/, '') ||
    (userOrUsername.id !== undefined && userOrUsername.id !== null ? String(userOrUsername.id) : undefined);
  return identifier ? `/${identifier}` : '/feed';
}
