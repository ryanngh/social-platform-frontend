import type { Area } from 'react-easy-crop';

/**
 * Creates an Image element from a source URL.
 * Safely handles CORS: Only attaches crossOrigin for remote http/https URLs,
 * preventing CORS taint or rejection on blob: and data: URLs.
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (error) => {
      console.error('Failed to load image in createImage:', url, error);
      reject(new Error('Failed to load image for cropping'));
    };
    // Only set crossOrigin for remote HTTP/HTTPS URLs (never for blob: or data: URLs)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      image.crossOrigin = 'anonymous';
    }
    image.src = url;
  });

/**
 * Converts degree to radian
 */
export const getRadianAngle = (degreeValue: number): number => {
  return (degreeValue * Math.PI) / 180;
};

/**
 * Returns the new bounding area of a rotated rectangle
 */
export const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

/**
 * Crops and rotates an image given pixelCrop coordinates from react-easy-crop.
 * Returns a File ready for upload, with full fallback for blob conversion.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  fileName = 'cropped-image.jpg'
): Promise<File> {
  const image = await createImage(imageSrc);

  const imgWidth = image.naturalWidth || image.width || 100;
  const imgHeight = image.naturalHeight || image.height || 100;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    imgWidth,
    imgHeight,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = Math.max(1, Math.round(bBoxWidth));
  canvas.height = Math.max(1, Math.round(bBoxHeight));

  // Translate canvas context to a central point to allow rotating around the center
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotRad);
  ctx.translate(-imgWidth / 2, -imgHeight / 2);

  // Draw rotated image with smoothing enabled
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0);

  // Cropped canvas
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Canvas 2D context for cropped area is not available');
  }

  const cropX = Math.max(0, Math.round(pixelCrop.x));
  const cropY = Math.max(0, Math.round(pixelCrop.y));
  const cropWidth = Math.max(1, Math.round(pixelCrop.width));
  const cropHeight = Math.max(1, Math.round(pixelCrop.height));

  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;

  croppedCtx.imageSmoothingEnabled = true;
  croppedCtx.imageSmoothingQuality = 'high';

  // Draw the cropped image onto the new canvas
  croppedCtx.drawImage(
    canvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  // Convert cropped canvas to File (with toDataURL fallback)
  return new Promise<File>((resolve, reject) => {
    if (croppedCanvas.toBlob) {
      croppedCanvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], fileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(file);
          } else {
            // Fallback via dataURL
            try {
              const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.92);
              const byteString = atob(dataUrl.split(',')[1]);
              const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              const blobFallback = new Blob([ab], { type: mimeString });
              const file = new File([blobFallback], fileName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(file);
            } catch (err) {
              console.error('DataURL fallback error:', err);
              reject(new Error('Canvas blob conversion failed'));
            }
          }
        },
        'image/jpeg',
        0.92
      );
    } else {
      try {
        const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.92);
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const file = new File([blob], fileName, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(file);
      } catch (err) {
        console.error('DataURL fallback error:', err);
        reject(new Error('Canvas toDataURL conversion failed'));
      }
    }
  });
}
