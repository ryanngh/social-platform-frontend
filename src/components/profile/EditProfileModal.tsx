import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, MapPin, Link2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../../services/userService';
import type { User, ProfileUpdateRequest } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarUrl, getBannerUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import ImageCropModal from '../common/ImageCropModal';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updatedUser: User) => void;
}

export const EditProfileModal = ({ isOpen, onClose, user, onSave }: EditProfileModalProps) => {
  const { t, language } = useLanguage();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [websiteUrl, setWebsiteUrl] = useState(user.websiteUrl || '');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterestInput, setNewInterestInput] = useState('');
  const [isAddingInterest, setIsAddingInterest] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatarUrl ? getAvatarUrl(user.avatarUrl) : null
  );
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    user.bannerUrl ? getBannerUrl(user.bannerUrl) : null
  );

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [cropModalState, setCropModalState] = useState<{
    isOpen: boolean;
    imageSrc: string | null;
    cropType: 'avatar' | 'banner';
  }>({
    isOpen: false,
    imageSrc: null,
    cropType: 'avatar',
  });

  const prevIsOpenRef = useRef(false);

  // Sync state ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setWebsiteUrl(user.websiteUrl || '');
      setAvatarFile(null);
      setBannerFile(null);
      setAvatarPreview(user.avatarUrl ? getAvatarUrl(user.avatarUrl) : null);
      setBannerPreview(user.bannerUrl ? getBannerUrl(user.bannerUrl) : null);
      setIsAddingInterest(false);
      setNewInterestInput('');
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, user]);

  const isFormChanged =
    firstName.trim() !== (user.firstName || '').trim() ||
    lastName.trim() !== (user.lastName || '').trim() ||
    username.trim() !== (user.username || '').trim() ||
    bio.trim() !== (user.bio || '').trim() ||
    location.trim() !== (user.location || '').trim() ||
    websiteUrl.trim() !== (user.websiteUrl || '').trim() ||
    avatarFile !== null ||
    bannerFile !== null;

  const isSaveDisabled = isLoading || !isFormChanged || !username.trim();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value so user can select the same file again if desired
    e.target.value = '';

    const previewUrl = URL.createObjectURL(file);
    setCropModalState({
      isOpen: true,
      imageSrc: previewUrl,
      cropType: type,
    });
  };

  const handleCropComplete = (croppedFile: File, previewUrl: string) => {
    if (cropModalState.cropType === 'avatar') {
      setAvatarFile(croppedFile);
      setAvatarPreview(previewUrl);
    } else {
      setBannerFile(croppedFile);
      setBannerPreview(previewUrl);
    }
  };

  const removeInterest = (tag: string) => {
    setInterests(interests.filter((i) => i !== tag));
  };

  const addInterest = () => {
    if (newInterestInput.trim() && !interests.includes(newInterestInput.trim())) {
      setInterests([...interests, newInterestInput.trim()]);
      setNewInterestInput('');
      setIsAddingInterest(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaveDisabled) return;
    setIsLoading(true);

    try {
      let uploadedAvatarUser: User | null = null;
      let uploadedBannerUser: User | null = null;

      if (avatarFile) {
        uploadedAvatarUser = await userService.uploadAvatar(avatarFile);
      }
      if (bannerFile) {
        uploadedBannerUser = await userService.uploadBanner(bannerFile);
      }

      const updateData: ProfileUpdateRequest = {
        firstName,
        lastName,
        username,
        bio,
        location,
        websiteUrl,
        avatarUrl: uploadedAvatarUser?.avatarUrl || user.avatarUrl,
        bannerUrl: uploadedBannerUser?.bannerUrl || user.bannerUrl,
      };

      const finalUser = await userService.updateProfile(updateData);
      await refreshUser();
      
      onSave(finalUser);
      toast.success(t('profile.updateSuccess'));
      onClose();

      if (finalUser.username && finalUser.username !== user.username) {
        navigate(`/${finalUser.username}`, { replace: true });
      }
    } catch (error) {
      console.error(error);
      toast.error(language === 'vi' ? 'Không thể cập nhật hồ sơ. Vui lòng thử lại!' : 'Could not update profile. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div
      aria-labelledby="modal-profile-title"
      aria-modal="true"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fadeIn"
      role="dialog"
    >
      <div className="bg-white dark:bg-[#121212] rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-xl w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col border-t sm:border border-gray-100 dark:border-[#262626] overflow-hidden pb-safe sm:pb-0">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] sm:pt-4 border-b border-gray-100 dark:border-[#262626] bg-white dark:bg-[#121212] sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              aria-label={t('common.close')}
              className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full transition-colors cursor-pointer"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-gray-900 dark:text-[#F5F5F5]" id="modal-profile-title">
              {t('profile.editModalTitle')}
            </h2>
          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={isSaveDisabled}
            className="h-10 sm:h-9 px-4 min-h-[40px] bg-[#004AC6] hover:bg-[#002970] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            type="button"
          >
            {isLoading ? t('profile.saving') : t('profile.saveChanges')}
          </button>

        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5 custom-scrollbar pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
          {/* Cover / Banner Upload Area */}
          <div className="relative">
            <div className="h-32 w-full bg-gradient-to-r from-[#DFE6F5] via-[#E8EDFB] to-[#F1F3FB] dark:from-[#1A1A1A] dark:via-[#222222]/80 dark:to-[#121212] rounded-2xl relative overflow-hidden flex items-center justify-center border border-gray-100 dark:border-[#262626]">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#003594_1px,transparent_1px)] [background-size:16px_16px]"></div>
              {bannerPreview && (
                <img src={bannerPreview} alt="Cover preview" className="absolute inset-0 w-full h-full object-cover z-0" />
              )}
              <button
                onClick={() => bannerInputRef.current?.click()}
                className="relative z-10 px-3.5 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs transition cursor-pointer"
                type="button"
              >
                <Camera className="w-4 h-4" />
                <span>{language === 'vi' ? 'Thay đổi ảnh bìa' : 'Change cover'}</span>
              </button>
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'banner')}
            />

            {/* Avatar Upload Area */}
            <div className="relative -mt-10 ml-4 flex items-end justify-between">
              <div className="relative group">
                <img
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full border-4 border-white dark:border-[#121212] object-cover shadow-md bg-white dark:bg-[#121212]"
                  src={avatarPreview || DEFAULT_AVATAR_FALLBACK}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
                  }}
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label={language === 'vi' ? 'Đổi ảnh đại diện' : 'Change avatar'}
                  className="absolute inset-0 m-1 rounded-full bg-black/50 hover:bg-black/70 text-white flex flex-col items-center justify-center transition opacity-90 hover:opacity-100 cursor-pointer"
                  type="button"
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-semibold leading-tight mt-0.5">
                    {language === 'vi' ? 'Đổi ảnh' : 'Change'}
                  </span>
                </button>
              </div>
              <span className="text-[11px] text-gray-500 dark:text-[#A8A8A8] pb-2">
                {language === 'vi' ? 'Kích thước đề xuất: 400x400px JPG/PNG' : 'Recommended: 400x400px JPG/PNG'}
              </span>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'avatar')}
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-1">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                  {language === 'vi' ? 'Họ' : 'Last name'}
                </label>
                <input
                  className="w-full px-3.5 h-10 text-xs sm:text-sm text-gray-900 dark:text-[#F5F5F5] bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#363636] rounded-xl focus:bg-white dark:focus:bg-[#000000] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] transition outline-none"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                  {language === 'vi' ? 'Tên' : 'First name'}
                </label>
                <input
                  className="w-full px-3.5 h-10 text-xs sm:text-sm text-gray-900 dark:text-[#F5F5F5] bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#363636] rounded-xl focus:bg-white dark:focus:bg-[#000000] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] transition outline-none"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            </div>

            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                {language === 'vi' ? 'Tên người dùng' : 'Username'}
              </label>
              <div className="relative">
                <input
                  className="w-full px-3.5 h-10 text-xs sm:text-sm text-gray-900 dark:text-[#F5F5F5] bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#363636] rounded-xl focus:bg-white dark:focus:bg-[#000000] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] transition outline-none"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Bio Field with counter */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                  {language === 'vi' ? 'Tiểu sử' : 'Bio'}
                </label>
                <span className="text-[11px] text-gray-400 dark:text-[#A8A8A8] tabular-nums">{bio.length}/160</span>
              </div>
              <textarea
                className="w-full p-3 text-xs sm:text-sm text-gray-900 dark:text-[#F5F5F5] bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#363636] rounded-xl focus:bg-white dark:focus:bg-[#000000] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] transition outline-none leading-relaxed resize-none"
                rows={3}
                maxLength={160}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* Location & Website 2-Column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                  {language === 'vi' ? 'Vị trí' : 'Location'}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 dark:text-[#A8A8A8]" />
                  <input
                    className="w-full pl-10 pr-3.5 h-10 text-xs sm:text-sm text-gray-900 dark:text-[#F5F5F5] bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#363636] rounded-xl focus:bg-white dark:focus:bg-[#000000] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] transition outline-none"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                  {language === 'vi' ? 'Liên kết website' : 'Website'}
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 dark:text-[#A8A8A8]" />
                  <input
                    className="w-full pl-10 pr-3.5 h-10 text-xs sm:text-sm text-gray-900 dark:text-[#F5F5F5] bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#363636] rounded-xl focus:bg-white dark:focus:bg-[#000000] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] transition outline-none"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Interests Field */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                {language === 'vi' ? 'Sở thích & Chuyên môn' : 'Interests & Specialties'}
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {interests.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#363636] rounded-full text-gray-800 dark:text-[#E5E5E5] font-medium"
                  >
                    {tag}
                    <button
                      onClick={() => removeInterest(tag)}
                      aria-label={`Xoá ${tag}`}
                      className="text-gray-400 dark:text-[#A8A8A8] hover:text-red-500 dark:hover:text-red-400 flex items-center cursor-pointer ml-0.5"
                      type="button"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}

                {isAddingInterest ? (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      placeholder={language === 'vi' ? 'Nhập sở thích...' : 'Enter interest...'}
                      value={newInterestInput}
                      onChange={(e) => setNewInterestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addInterest();
                        } else if (e.key === 'Escape') {
                          setIsAddingInterest(false);
                        }
                      }}
                      className="px-3 py-1 text-xs bg-white dark:bg-[#121212] border border-[#004AC6] dark:border-[#0095F6] text-gray-900 dark:text-[#F5F5F5] rounded-full outline-none w-32"
                    />
                    <button
                      onClick={addInterest}
                      className="text-xs font-semibold bg-[#004AC6] dark:bg-[#0095F6] text-white px-2.5 py-1 rounded-full cursor-pointer"
                      type="button"
                    >
                      {language === 'vi' ? 'Thêm' : 'Add'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingInterest(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs text-[#004AC6] dark:text-[#0095F6] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-dashed border-[#004AC6]/40 dark:border-[#0095F6]/40 rounded-full font-semibold transition cursor-pointer"
                    type="button"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? '+ Thêm sở thích' : '+ Add interest'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 dark:border-[#262626] bg-white dark:bg-[#121212] sticky bottom-0 z-20">
          <button
            onClick={onClose}
            className="h-9 px-4 border border-gray-200 dark:border-[#363636] rounded-xl text-xs sm:text-sm font-semibold text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#262626] transition cursor-pointer"
            type="button"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={isSaveDisabled}
            className="h-9 px-5 bg-[#004AC6] hover:bg-[#002970] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            type="button"
          >
            {isLoading ? t('profile.saving') : t('profile.saveChanges')}
          </button>

        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalState.isOpen}
        imageSrc={cropModalState.imageSrc}
        cropType={cropModalState.cropType}
        onClose={() => setCropModalState((prev) => ({ ...prev, isOpen: false }))}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default EditProfileModal;
