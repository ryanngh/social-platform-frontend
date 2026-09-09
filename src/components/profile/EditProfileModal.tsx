import { useState, useRef } from 'react';
import { X, Camera, MapPin, Link2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../../services/userService';
import type { User, ProfileUpdateRequest } from '../../types';
import { getAvatarUrl, getBannerUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updatedUser: User) => void;
}

export const EditProfileModal = ({ isOpen, onClose, user, onSave }: EditProfileModalProps) => {
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

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    if (type === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
    } else {
      setBannerFile(file);
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
    setIsLoading(true);

    try {
      if (avatarFile) {
        await userService.uploadAvatar(avatarFile);
      }
      if (bannerFile) {
        await userService.uploadBanner(bannerFile);
      }

      const updateData: ProfileUpdateRequest = {
        firstName,
        lastName,
        username,
        bio,
        location,
        websiteUrl,
      };

      const finalUser = await userService.updateProfile(updateData);
      
      onSave(finalUser);
      toast.success('Hồ sơ đã được cập nhật thành công!');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Không thể cập nhật hồ sơ. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      aria-labelledby="modal-profile-title"
      aria-modal="true"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E2EC] bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="p-1.5 text-gray-500 hover:text-[#1A1C1E] hover:bg-[#EDEDF8] rounded-full transition-colors cursor-pointer"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-[#1A1C1E]" id="modal-profile-title">
              Chỉnh sửa trang cá nhân
            </h2>
          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading}
            className="px-4 py-1.5 bg-[#004AC6] hover:bg-[#002970] text-white text-xs font-semibold rounded-full shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            type="button"
          >
            {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Cover / Banner Upload Area */}
          <div className="relative">
            <div className="h-28 w-full bg-gradient-to-r from-[#DFE6F5] via-[#E8EDFB] to-[#F1F3FB] rounded-xl relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#003594_1px,transparent_1px)] [background-size:16px_16px]"></div>
              {bannerPreview && (
                <img src={bannerPreview} alt="Cover preview" className="absolute inset-0 w-full h-full object-cover z-0" />
              )}
              <button
                onClick={() => bannerInputRef.current?.click()}
                className="relative z-10 px-3 py-1.5 bg-slate-900/60 hover:bg-slate-900/80 text-white rounded-full text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm transition cursor-pointer"
                type="button"
              >
                <Camera className="w-4 h-4" />
                <span>Thay đổi ảnh bìa</span>
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
                  className="w-20 h-20 rounded-full border-4 border-white object-cover shadow bg-white"
                  src={avatarPreview || DEFAULT_AVATAR_FALLBACK}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
                  }}
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label="Đổi ảnh đại diện"
                  className="absolute inset-0 m-1 rounded-full bg-slate-900/50 hover:bg-slate-900/70 text-white flex flex-col items-center justify-center transition opacity-90 hover:opacity-100 cursor-pointer"
                  type="button"
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-medium leading-tight mt-0.5">Đổi ảnh</span>
                </button>
              </div>
              <span className="text-[11px] text-[#535F70] pb-2">Kích thước đề xuất: 400x400px JPG/PNG</span>
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
                <label className="block text-xs font-semibold text-[#1A1C1E]">Họ (Last Name)</label>
                <input
                  className="w-full px-3.5 py-2 text-xs text-[#1A1C1E] bg-[#F9F9FB] border border-[#E2E2EC] rounded-lg focus:bg-white focus:ring-2 focus:ring-[#004AC6] focus:border-[#004AC6] transition outline-none"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1A1C1E]">Tên (First Name)</label>
                <input
                  className="w-full px-3.5 py-2 text-xs text-[#1A1C1E] bg-[#F9F9FB] border border-[#E2E2EC] rounded-lg focus:bg-white focus:ring-2 focus:ring-[#004AC6] focus:border-[#004AC6] transition outline-none"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            </div>

            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1A1C1E]">Tên người dùng</label>
              <div className="relative">
                <input
                  className="w-full px-3.5 py-2 text-xs text-[#1A1C1E] bg-[#F9F9FB] border border-[#E2E2EC] rounded-lg focus:bg-white focus:ring-2 focus:ring-[#004AC6] focus:border-[#004AC6] transition outline-none"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Bio Field with counter */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-[#1A1C1E]">Tiểu sử (Bio)</label>
                <span className="text-[11px] text-[#535F70]">{bio.length}/160</span>
              </div>
              <textarea
                className="w-full px-3.5 py-2 text-xs text-[#1A1C1E] bg-[#F9F9FB] border border-[#E2E2EC] rounded-lg focus:bg-white focus:ring-2 focus:ring-[#004AC6] focus:border-[#004AC6] transition outline-none leading-relaxed"
                rows={3}
                maxLength={160}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* Location & Website 2-Column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1A1C1E]">Vị trí</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#535F70]" />
                  <input
                    className="w-full pl-9 pr-3 py-2 text-xs text-[#1A1C1E] bg-[#F9F9FB] border border-[#E2E2EC] rounded-lg focus:bg-white focus:ring-2 focus:ring-[#004AC6] focus:border-[#004AC6] transition outline-none"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1A1C1E]">Liên kết website</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#535F70]" />
                  <input
                    className="w-full pl-9 pr-3 py-2 text-xs text-[#1A1C1E] bg-[#F9F9FB] border border-[#E2E2EC] rounded-lg focus:bg-white focus:ring-2 focus:ring-[#004AC6] focus:border-[#004AC6] transition outline-none"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Interests Field */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-[#1A1C1E]">
                Sở thích &amp; Chuyên môn (Interests)
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {interests.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[#F3F3FD] border border-[#E2E2EC] rounded-full text-[#1A1C1E] font-medium"
                  >
                    {tag}
                    <button
                      onClick={() => removeInterest(tag)}
                      aria-label={`Xoá ${tag}`}
                      className="text-[#535F70] hover:text-red-500 flex items-center cursor-pointer ml-0.5"
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {isAddingInterest ? (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Nhập sở thích..."
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
                      className="px-2.5 py-1 text-xs bg-white border border-[#004AC6] rounded-full outline-none w-28"
                    />
                    <button
                      onClick={addInterest}
                      className="text-xs bg-[#004AC6] text-white px-2 py-1 rounded-full cursor-pointer"
                      type="button"
                    >
                      Thêm
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingInterest(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#004AC6] hover:bg-[#EFF4FF] border border-dashed border-[#004AC6]/40 rounded-full font-medium transition cursor-pointer"
                    type="button"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Thêm sở thích</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#E2E2EC] bg-white sticky bottom-0 z-20">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E2E2EC] rounded-full text-xs font-semibold text-[#1A1C1E] hover:bg-[#EDEDF8] transition cursor-pointer"
            type="button"
          >
            Hủy
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading}
            className="px-5 py-2 bg-[#004AC6] hover:bg-[#002970] text-white text-xs font-semibold rounded-full shadow transition cursor-pointer disabled:opacity-50"
            type="button"
          >
            {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
