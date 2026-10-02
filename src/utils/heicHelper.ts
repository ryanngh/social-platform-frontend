import decode from 'heic-decode';
import heic2any from 'heic2any';
import toast from 'react-hot-toast';

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
 * Phương pháp 1: Giải mã HEIC/HEIF bằng heic-decode (libheif WASM chính thức).
 * Hỗ trợ các profile màu mới nhất trên iPhone (iOS 16, 17, 18).
 */
async function decodeViaLibheif(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { width, height, data } = await decode({ buffer });
  if (!width || !height || !data) {
    throw new Error('libheif returned empty image data');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  const imgData = ctx.createImageData(width, height);
  imgData.data.set(new Uint8ClampedArray(data));
  ctx.putImageData(imgData, 0, 0);

  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob failed to produce JPEG'));
        }
      },
      'image/jpeg',
      0.92
    );
  });

  const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg') || `${file.name}.jpg`;
  return new File([jpegBlob], newFileName, {
    type: 'image/jpeg',
    lastModified: file.lastModified || Date.now(),
  });
}

/**
 * Phương pháp 2: Fallback bằng heic2any
 */
async function decodeViaHeic2any(file: File): Promise<File> {
  const blobToConvert = file.slice(0, file.size, 'image/heic');
  const convertFn = (
    typeof heic2any === 'function'
      ? heic2any
      : (heic2any as unknown as { default?: typeof heic2any })?.default || heic2any
  ) as typeof heic2any;

  const convertedBlob = await convertFn({
    blob: blobToConvert,
    toType: 'image/jpeg',
    quality: 0.92,
    multiple: false,
  });

  const resultBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
  const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg') || `${file.name}.jpg`;

  return new File([resultBlob], newFileName, {
    type: 'image/jpeg',
    lastModified: file.lastModified || Date.now(),
  });
}

/**
 * Chuyển đổi file HEIC/HEIF sang JPEG chất lượng cao để hiển thị mượt mà trên tất cả trình duyệt.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  // 1. Thử giải mã bằng heic-decode (libheif-js WASM - nhanh, chính xác và hỗ trợ ảnh Apple mới nhất)
  try {
    return await decodeViaLibheif(file);
  } catch (err1) {
    console.warn('heic-decode failed, trying fallback heic2any:', err1);
  }

  // 2. Thử fallback bằng heic2any
  try {
    return await decodeViaHeic2any(file);
  } catch (err2) {
    console.error('All HEIC decoders failed:', err2);
    toast.error(`Không thể xử lý ảnh ${file.name}. Vui lòng thử chọn ảnh định dạng JPG/PNG.`);
    throw err2;
  }
}

/**
 * Đảm bảo toàn bộ danh sách file được chuyển đổi sang định dạng tương thích (HEIC -> JPEG).
 */
export async function ensureCompatibleMediaFiles(files: File[]): Promise<File[]> {
  const results: File[] = [];
  for (const file of files) {
    if (isHeicFile(file)) {
      try {
        const converted = await convertHeicToJpeg(file);
        results.push(converted);
      } catch {
        // File lỗi sẽ bị bỏ qua và có toast báo lỗi cho người dùng
      }
    } else {
      results.push(file);
    }
  }
  return results;
}
