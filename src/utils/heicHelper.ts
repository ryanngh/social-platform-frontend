import heic2any from 'heic2any';

/**
 * Kiểm tra file có phải định dạng HEIC/HEIF không (dựa trên MIME type hoặc phần mở rộng đuôi file).
 */
export function isHeicFile(file: File | Blob, fileName?: string): boolean {
  const name = (file instanceof File ? file.name : fileName) || '';
  const type = (file.type || '').toLowerCase();
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    type === 'image/heic-sequence' ||
    type === 'image/heif-sequence' ||
    /\.(heic|heif)$/i.test(name)
  );
}

/**
 * Kiểm tra file có phải là file media (Ảnh, Video hoặc HEIC) được hỗ trợ.
 */
export function isMediaFile(file: File): boolean {
  return (
    file.type.startsWith('image/') ||
    file.type.startsWith('video/') ||
    isHeicFile(file)
  );
}

/**
 * Chuyển đổi file HEIC/HEIF sang JPEG chất lượng cao để hiển thị mượt mà trên tất cả trình duyệt.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    // Chuẩn bị blob với mime type image/heic chuẩn xác để heic2any giải mã mượt mà
    const blobToConvert = file.slice(0, file.size, 'image/heic');

    // Hỗ trợ cả default export lẫn named export từ Vite/bundler/browser environment
    const convertFn = (
      typeof heic2any === 'function'
        ? heic2any
        : (heic2any as unknown as { default?: typeof heic2any })?.default || heic2any
    ) as typeof heic2any;

    const convertedBlob = await convertFn({
      blob: blobToConvert,
      toType: 'image/jpeg',
      quality: 0.92,
    });

    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg') || `${file.name}.jpg`;

    return new File([blob], newFileName, {
      type: 'image/jpeg',
      lastModified: file.lastModified || Date.now(),
    });
  } catch (err) {
    console.warn('HEIC to JPEG conversion encountered issue, setting explicit image/heic MIME type:', err);
    // Nếu chuyển đổi trên client thất bại (vd: HEIC nâng cao), chuẩn hóa type là image/heic thay vì rỗng
    return new File([file], file.name, {
      type: 'image/heic',
      lastModified: file.lastModified || Date.now(),
    });
  }
}

/**
 * Đảm bảo toàn bộ danh sách file được chuyển đổi sang định dạng tương thích (HEIC -> JPEG).
 */
export async function ensureCompatibleMediaFiles(files: File[]): Promise<File[]> {
  return Promise.all(
    files.map((file) => (isHeicFile(file) ? convertHeicToJpeg(file) : Promise.resolve(file)))
  );
}

