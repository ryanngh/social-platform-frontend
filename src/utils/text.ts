/**
 * Utilities for text processing, hashtags and mentions
 */

/**
 * Trích xuất danh sách hashtag từ chuỗi văn bản (ví dụ: '#test #chill' -> ['test', 'chill'])
 */
export function extractHashtags(content: string): string[] {
  if (!content) return [];
  const matches = content.match(/#[\w\p{L}_-]+/gu) || [];
  return Array.from(new Set(matches.map((tag) => tag.replace(/^#/, ''))));
}

/**
 * Loại bỏ các hashtag ra khỏi nội dung hiển thị của bài viết để không bị trùng lặp
 * với danh sách thẻ hashtag bên dưới.
 *
 * Ví dụ:
 * - "Hôm nay vui vẻ #chill #summer" -> "Hôm nay vui vẻ"
 * - "#Test" -> "" (nếu chỉ có hashtag thì trả về chuỗi rỗng để component ẩn thẻ <p>)
 */
export function getContentWithoutHashtags(content: string): string {
  if (!content) return '';
  return content
    .replace(/#[\w\p{L}_-]+/gu, '')
    .replace(/[ \t]+$/gm, '') // Bỏ khoảng trắng thừa cuối dòng
    .replace(/\n{3,}/g, '\n\n') // Tránh các dòng trống liên tiếp
    .trim();
}
