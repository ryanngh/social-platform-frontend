import { useState, useCallback, useEffect } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  User, 
  Image as ImageIcon,
  Loader2 
} from 'lucide-react';
import { getCroppedImg } from '../../utils/cropImage';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  cropType: 'avatar' | 'banner';
  onClose: () => void;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
}

export const ImageCropModal = ({
  isOpen,
  imageSrc,
  cropType,
  onClose,
  onCropComplete,
}: ImageCropModalProps) => {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Aspect ratio and shape configurations
  const isAvatar = cropType === 'avatar';
  const aspect = isAvatar ? 1 / 1 : 3 / 1;
  const cropShape = isAvatar ? 'round' : 'rect';

  // Reset controls when a new image is provided or modal opens
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
      setIsProcessing(false);
    }
  }, [isOpen, imageSrc]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  const onCropChange = (location: Point) => {
    setCrop(location);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const onCropCompleteCallback = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(currentCroppedAreaPixels);
  }, []);

  const onMediaLoaded = (mediaSize: { width: number; height: number; naturalWidth: number; naturalHeight: number }) => {
    const w = mediaSize.naturalWidth || mediaSize.width || 100;
    const h = mediaSize.naturalHeight || mediaSize.height || 100;
    if (isAvatar) {
      const size = Math.min(w, h);
      setCroppedAreaPixels({
        x: Math.round((w - size) / 2),
        y: Math.round((h - size) / 2),
        width: Math.round(size),
        height: Math.round(size),
      });
    } else {
      let cropW = w;
      let cropH = Math.round(w / 3);
      if (cropH > h) {
        cropH = h;
        cropW = Math.round(h * 3);
      }
      setCroppedAreaPixels({
        x: Math.round((w - cropW) / 2),
        y: Math.round((h - cropH) / 2),
        width: Math.round(cropW),
        height: Math.round(cropH),
      });
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleApplyCrop = async () => {
    if (!imageSrc) {
      toast.error(isVi ? 'Không tìm thấy hình ảnh hợp lệ!' : 'No valid image found!');
      return;
    }

    try {
      setIsProcessing(true);
      const fileName = isAvatar ? 'avatar-cropped.jpg' : 'banner-cropped.jpg';
      // If croppedAreaPixels is not yet set by drag event, fallback to default 100% bounds
      const cropArea = croppedAreaPixels || {
        x: 0,
        y: 0,
        width: isAvatar ? 500 : 1500,
        height: 500,
      };

      const croppedFile = await getCroppedImg(
        imageSrc,
        cropArea,
        rotation,
        fileName
      );

      const previewUrl = URL.createObjectURL(croppedFile);
      onCropComplete(croppedFile, previewUrl);
      onClose();
    } catch (error) {
      console.error('Crop error:', error);
      toast.error(isVi ? 'Đã xảy ra lỗi khi cắt ảnh. Vui lòng thử lại!' : 'Error cropping image. Please try again!');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  const modalTitle = isAvatar
    ? (isVi ? 'Chỉnh sửa ảnh đại diện' : 'Crop Profile Picture')
    : (isVi ? 'Chỉnh sửa ảnh bìa' : 'Crop Cover Photo');

  const modalDescription = isAvatar
    ? (isVi ? 'Kéo và phóng to để điều chỉnh khuôn mặt vào giữa khung tròn' : 'Drag and zoom to frame your face inside the circle')
    : (isVi ? 'Kéo và phóng to để chọn vùng ảnh bìa chuẩn tỷ lệ 3:1' : 'Drag and zoom to adjust your cover banner (3:1 ratio)');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2C2C2C] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 dark:border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#004AC6] dark:text-[#0095F6] flex items-center justify-center shrink-0">
              {isAvatar ? <User className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="crop-modal-title" className="text-base font-bold text-gray-900 dark:text-[#F5F5F5] leading-tight">
                {modalTitle}
              </h2>
              <p className="text-xs text-gray-500 dark:text-[#A8A8A8] leading-normal hidden sm:block">
                {modalDescription}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            aria-label={isVi ? 'Đóng' : 'Close'}
            className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full transition cursor-pointer disabled:opacity-50"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Body */}
        <div className="relative w-full h-[320px] sm:h-[380px] bg-neutral-950 dark:bg-black overflow-hidden select-none">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={true}
            zoomWithScroll={true}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            onMediaLoaded={onMediaLoaded}
            style={{
              containerStyle: {
                position: 'relative',
                width: '100%',
                height: '100%',
                backgroundColor: '#09090b',
              },
            }}
          />
        </div>

        {/* Controls Toolbar */}
        <div className="px-5 sm:px-6 py-4 bg-gray-50/70 dark:bg-[#1F1F1F]/70 border-t border-gray-100 dark:border-[#262626] space-y-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
              className="p-1.5 text-gray-500 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5] transition cursor-pointer"
              title={isVi ? 'Thu nhỏ' : 'Zoom out'}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              aria-label={isVi ? 'Độ phóng to' : 'Zoom level'}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 bg-gray-200 dark:bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#004AC6] dark:accent-[#0095F6]"
            />
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
              className="p-1.5 text-gray-500 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5] transition cursor-pointer"
              title={isVi ? 'Phóng to' : 'Zoom in'}
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold tabular-nums text-gray-600 dark:text-[#A8A8A8] w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Quick Actions (Rotate & Reset) */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#363636] bg-white dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#282828] text-xs font-medium text-gray-700 dark:text-[#E5E5E5] transition cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-gray-500 dark:text-[#A8A8A8]" />
                <span>{isVi ? 'Xoay 90°' : 'Rotate 90°'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#363636] bg-white dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#282828] text-xs font-medium text-gray-700 dark:text-[#E5E5E5] transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500 dark:text-[#A8A8A8]" />
                <span>{isVi ? 'Đặt lại' : 'Reset'}</span>
              </button>
            </div>

            <div className="text-[11px] text-gray-400 dark:text-[#888888] italic">
              {isAvatar 
                ? (isVi ? 'Tỷ lệ: 1:1 (Tròn)' : 'Ratio: 1:1 (Circle)')
                : (isVi ? 'Tỷ lệ: 3:1 (Bìa)' : 'Ratio: 3:1 (Cover)')}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-4 sm:px-6 py-3.5 sm:py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4 border-t border-gray-100 dark:border-[#262626] bg-white dark:bg-[#181818]">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="h-10 sm:h-9 px-4 min-h-[44px] sm:min-h-0 border border-gray-200 dark:border-[#363636] rounded-xl text-xs sm:text-sm font-semibold text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#262626] transition cursor-pointer disabled:opacity-50"
          >
            {isVi ? 'Hủy' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing}
            className="h-10 sm:h-9 px-5 min-h-[44px] sm:min-h-0 bg-[#004AC6] hover:bg-[#002970] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isVi ? 'Đang xử lý...' : 'Processing...'}</span>
              </>
            ) : (
              <span>{isVi ? 'Áp dụng' : 'Apply'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
