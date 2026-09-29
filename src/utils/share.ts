import toast from 'react-hot-toast';
import { postService } from '../services/postService';
import type { PostShareResponse } from '../types';

export interface HandleCopyLinkOptions {
  onShareCountUpdated?: (newCount: number) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Thao tác sao chép văn bản vào Clipboard với cơ chế fallback cho trình duyệt cũ hoặc non-https
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Hàm xử lý khi người dùng bấm vào tùy chọn "Sao chép liên kết" (Copy Link):
 * 1. Copy link `${window.location.origin}/posts/${postId}` vào clipboard và hiển thị Toast thành công.
 * 2. Gọi ngầm API: POST /posts/{postId}/shares (kèm Bearer Token).
 * 3. Nếu response trả về `counted === true`, cập nhật state `shareCount` của bài viết.
 * 4. Nếu response trả về `counted === false` (do cooldown), giữ nguyên UI không báo lỗi.
 * 5. Bọc API call trong try...catch để nếu request thất bại thì vẫn không ảnh hưởng việc copy link của user.
 */
export async function handleCopyAndSharePost(
  postId: string,
  options?: HandleCopyLinkOptions
): Promise<PostShareResponse | null> {
  // 1. Thao tác Copy vào Clipboard thiết bị
  const postUrl = `${window.location.origin}/posts/${postId}`;

  try {
    const success = await copyToClipboard(postUrl);
    if (!success) {
      throw new Error('Copy command failed');
    }
    // Luôn hiển thị Toast thông báo copy thành công ngay lập tức
    toast.success(options?.successMessage || 'Đã sao chép liên kết vào bộ nhớ tạm!');
  } catch (err) {
    console.error('Error copying post link:', err);
    toast.error(options?.errorMessage || 'Không thể sao chép liên kết!');
    return null;
  }

  // 2. Gọi API ghi nhận lượt Share (Chạy ngầm trong background)
  try {
    const response = await postService.sharePost(postId);

    // Nếu lượt share hợp lệ, cập nhật lại số shareCount trên UI
    if (response.counted && typeof response.shareCount === 'number') {
      options?.onShareCountUpdated?.(response.shareCount);
    }
    return response;
  } catch (error) {
    // Lỗi mạng hoặc 500 thì nuốt lỗi ngầm (silent fail),
    // không làm gián đoạn trải nghiệm copy của người dùng
    console.warn('Lỗi ghi nhận lượt share:', error);
    return null;
  }
}
