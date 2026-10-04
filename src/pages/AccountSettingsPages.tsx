import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Mail, 
  Shield, 
  ShieldAlert, 
  LogOut, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  MessageSquare, 
  Repeat2, 
  Image as ImageIcon, 
  Heart, 
  FileText, 
  KeyRound,
  Check,
  RotateCw,
  Trash2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { userService } from '../services/userService';
import { 
  accountSecurity, 
  securityError, 
  type SecurityPurpose, 
  type ProfilePrivacy, 
  type RecoverySession 
} from '../services/accountSecurity';
import OtpActionDialog from '../components/auth/OtpActionDialog';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function SettingsNav({ activeTab }: { activeTab: 'account' | 'privacy' }) {
  const { language } = useLanguage();
  const isVi = language === 'vi';

  return (
    <div className="mb-5 space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight">
          {activeTab === 'account' 
            ? (isVi ? 'Cài đặt tài khoản' : 'Account Settings') 
            : (isVi ? 'Quyền riêng tư hồ sơ' : 'Profile Privacy')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] mt-1 leading-relaxed">
          {activeTab === 'account'
            ? (isVi ? 'Quản lý thông tin đăng nhập, bảo mật và trạng thái tài khoản.' : 'Manage your login credentials, security, and account status.')
            : (isVi ? 'Tùy chỉnh ai có thể duyệt xem từng mục trên trang cá nhân của bạn.' : 'Control who can browse each section on your public profile.')}
        </p>
      </div>

      {/* Segmented Navigation Tab Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl border border-gray-200/70 dark:border-[#2A2A2A]">
        <Link
          to="/settings/account"
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer',
            activeTab === 'account'
              ? 'bg-white dark:bg-[#262626] text-[#004AC6] dark:text-[#0095F6] shadow-2xs font-bold'
              : 'text-gray-600 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <User className="w-4 h-4" />
          <span>{isVi ? 'Tài khoản' : 'Account'}</span>
        </Link>
        <Link
          to="/settings/privacy"
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer',
            activeTab === 'privacy'
              ? 'bg-white dark:bg-[#262626] text-[#004AC6] dark:text-[#0095F6] shadow-2xs font-bold'
              : 'text-gray-600 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Shield className="w-4 h-4" />
          <span>{isVi ? 'Quyền riêng tư' : 'Privacy'}</span>
        </Link>
      </div>
    </div>
  );
}

export function AccountSettingsPage() {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [account, setAccount] = useState<{ email: string; status: string }>();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [oldToken, setOldToken] = useState('');

  // Pending OTP modal
  const [pending, setPending] = useState<{ purpose: SecurityPurpose; payload: Record<string, unknown> }>();

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAccountDetails();
      setAccount(data);
      setError('');
    } catch (e) {
      setError(securityError(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const finish = async (token: string) => {
    if (!pending) return;
    if (pending.purpose === 'CHANGE_EMAIL') {
      setOldToken(token);
      setPending({ purpose: 'VERIFY_NEW_EMAIL', payload: { email: email.trim().toLowerCase() } });
      return;
    }
    if (pending.purpose === 'VERIFY_NEW_EMAIL') {
      await accountSecurity.email(email, oldToken, token);
      toast.success(isVi ? 'Đổi email thành công!' : 'Email updated successfully!');
    } else if (pending.purpose === 'CHANGE_PASSWORD') {
      await accountSecurity.password(password, token);
      toast.success(isVi ? 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.' : 'Password changed! Please sign in again.');
    } else {
      await accountSecurity.action(pending.purpose, token);
      toast.success(isVi ? 'Thao tác hoàn tất!' : 'Action completed!');
    }
    setPending(undefined);
    await logout();
    navigate('/signin', { replace: true });
  };

  return (
    <div className="space-y-5 pb-8">
      <SettingsNav activeTab="account" />

      {error && (
        <div role="alert" className="p-4 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/20 flex items-center justify-between gap-3 text-xs sm:text-sm text-red-600 dark:text-red-400">
          <p>{error}</p>
          <button
            onClick={() => { setError(''); void load(); }}
            className="px-3 py-1 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition cursor-pointer shrink-0"
          >
            {isVi ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-8 text-center shadow-2xs space-y-3">
          <RotateCw className="w-6 h-6 animate-spin mx-auto text-[#004AC6] dark:text-[#0095F6]" />
          <p className="text-xs text-gray-400 dark:text-[#737373]">{isVi ? 'Đang tải thông tin tài khoản…' : 'Loading account details…'}</p>
        </div>
      ) : account && (
        <>
          {/* 1. Account Info Overview Card */}
          <section className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-[#222222]">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#004AC6] dark:text-[#0095F6] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-[#F5F5F5]">
                  {isVi ? 'Thông tin tài khoản' : 'Account Details'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-[#737373]">
                  {isVi ? 'Địa chỉ email và trạng thái hồ sơ' : 'Email address and profile status'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200/70 dark:border-[#2A2A2A] space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#A8A8A8]">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-[#F5F5F5] truncate">
                  {account.email}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200/70 dark:border-[#2A2A2A] space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#A8A8A8]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isVi ? 'Trạng thái' : 'Status'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-[#F5F5F5]">
                    {account.status === 'ACTIVE' 
                      ? (isVi ? 'Đang hoạt động' : 'Active') 
                      : account.status}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Change Password Card */}
          <section className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-[#222222]">
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-[#F5F5F5]">
                  {isVi ? 'Đổi mật khẩu' : 'Change Password'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-[#737373]">
                  {isVi ? 'Yêu cầu xác thực qua mã OTP gửi về email' : 'Requires verification via OTP code sent to your email'}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPending({ purpose: 'CHANGE_PASSWORD', payload: { password } });
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-[#D4D4D4]">
                  {isVi ? 'Mật khẩu mới' : 'New password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isVi ? 'Tối thiểu 8 ký tự' : 'Minimum 8 characters'}
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-[#333333] bg-gray-50/50 dark:bg-[#1A1A1A] text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 focus:bg-white dark:focus:bg-[#121212] focus:border-[#004AC6] dark:focus:border-[#0095F6] focus:ring-1 focus:ring-[#004AC6] dark:focus:ring-[#0095F6] outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={password.length < 8}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#004AC6] hover:bg-[#003da6] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] transition shadow-xs cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shield className="w-4 h-4" />
                <span>{isVi ? 'Đổi mật khẩu qua OTP' : 'Verify & change password'}</span>
              </button>
            </form>
          </section>

          {/* 3. Change Email Card */}
          <section className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-[#222222]">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#004AC6] dark:text-[#0095F6] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-[#F5F5F5]">
                  {isVi ? 'Đổi địa chỉ email' : 'Change Email Address'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-[#737373]">
                  {isVi ? 'Cần xác minh cả email hiện tại và email mới' : 'Requires verification of both current and new email'}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setOldToken('');
                setPending({ purpose: 'CHANGE_EMAIL', payload: { email: email.trim().toLowerCase() } });
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-[#D4D4D4]">
                  {isVi ? 'Địa chỉ email mới' : 'New email address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="new.email@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-[#333333] bg-gray-50/50 dark:bg-[#1A1A1A] text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 focus:bg-white dark:focus:bg-[#121212] focus:border-[#004AC6] dark:focus:border-[#0095F6] focus:ring-1 focus:ring-[#004AC6] dark:focus:ring-[#0095F6] outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-[#737373]">
                  {isVi 
                    ? 'Hệ thống sẽ gửi mã OTP đến email hiện tại trước, sau đó xác minh email mới.' 
                    : 'A verification code will be sent to your current email first, then to the new email.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={!email || email.trim() === account.email}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#004AC6] hover:bg-[#003da6] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] transition shadow-xs cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shield className="w-4 h-4" />
                <span>{isVi ? 'Đổi email' : 'Change email'}</span>
              </button>
            </form>
          </section>

          {/* 4. Account Management & Security (Danger Zone) */}
          <section className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-[#222222]">
              <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-[#F5F5F5]">
                  {isVi ? 'Quản lý tài khoản & bảo mật' : 'Account Management & Security'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-[#737373]">
                  {isVi ? 'Các tùy chọn đăng xuất, vô hiệu hóa và xóa tài khoản' : 'Sign out, deactivation, and permanent deletion'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Deactivate Option */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200/70 dark:border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-[#F5F5F5]">
                    {isVi ? 'Vô hiệu hóa tài khoản' : 'Deactivate account'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-[#A8A8A8] max-w-md">
                    {isVi
                      ? 'Vô hiệu hóa sẽ ẩn tài khoản của bạn cho đến khi bạn chủ động khôi phục bằng mã OTP.'
                      : 'Deactivation hides your profile until you explicitly restore it using an OTP.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPending({ purpose: 'DEACTIVATE', payload: {} })}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 dark:border-[#383838] hover:bg-gray-200 dark:hover:bg-[#262626] text-gray-800 dark:text-[#E5E5E5] transition cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  {isVi ? 'Vô hiệu hóa' : 'Deactivate'}
                </button>
              </div>

              {/* Sign out all devices */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200/70 dark:border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-[#F5F5F5]">
                    {isVi ? 'Đăng xuất khỏi mọi thiết bị' : 'Sign out all devices'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-[#A8A8A8] max-w-md">
                    {isVi
                      ? 'Đăng xuất ngay lập tức khỏi tất cả trình duyệt và ứng dụng đang sử dụng tài khoản.'
                      : 'Immediately terminate all active sessions across all devices.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPending({ purpose: 'LOGOUT_ALL', payload: {} })}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 dark:border-[#383838] hover:bg-gray-200 dark:hover:bg-[#262626] text-gray-800 dark:text-[#E5E5E5] transition cursor-pointer shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Đăng xuất mọi nơi' : 'Sign out all'}</span>
                </button>
              </div>

              {/* Delete Account (Danger) */}
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                    <h3 className="text-xs sm:text-sm font-bold">
                      {isVi ? 'Yêu cầu xóa tài khoản' : 'Request account deletion'}
                    </h3>
                  </div>
                  <p className="text-xs text-rose-700/80 dark:text-rose-300/80 max-w-md">
                    {isVi
                      ? 'Tài khoản sẽ ẩn ngay. Bạn có 30 ngày để khôi phục; sau đó dữ liệu cá nhân bị xóa vĩnh viễn.'
                      : 'Account is hidden immediately. You have 30 days to restore; after that data is permanently erased.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPending({ purpose: 'DELETE_ACCOUNT', payload: {} })}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs cursor-pointer shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isVi ? 'Xóa tài khoản' : 'Delete account'}</span>
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {pending && (
        <OtpActionDialog
          key={pending.purpose}
          {...pending}
          onComplete={finish}
          onClose={() => setPending(undefined)}
        />
      )}
    </div>
  );
}

const defaultPrivacy: ProfilePrivacy = {
  posts: 'PUBLIC',
  replies: 'PUBLIC',
  reposts: 'PUBLIC',
  media: 'PUBLIC',
  likes: 'PUBLIC',
};

export function PrivacySettingsPage() {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { user, refreshUser } = useAuth();

  const [privacy, setPrivacy] = useState<ProfilePrivacy>({
    ...defaultPrivacy,
    ...user?.profilePrivacy,
  });
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const tabsConfig: Array<{
    key: keyof ProfilePrivacy;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      key: 'posts',
      title: isVi ? 'Bài viết' : 'Posts',
      description: isVi ? 'Ai có thể xem danh sách bài viết trên trang cá nhân của bạn' : 'Who can view your posts on your profile',
      icon: FileText,
    },
    {
      key: 'replies',
      title: isVi ? 'Bình luận và phản hồi' : 'Replies',
      description: isVi ? 'Ai có thể xem các phản hồi và bình luận của bạn trên các bài viết' : 'Who can view comments and replies you have posted',
      icon: MessageSquare,
    },
    {
      key: 'reposts',
      title: isVi ? 'Đăng lại' : 'Reposts',
      description: isVi ? 'Ai có thể xem các bài viết bạn đã chia sẻ lại' : 'Who can view posts you have reposted',
      icon: Repeat2,
    },
    {
      key: 'media',
      title: isVi ? 'Ảnh và video' : 'Media',
      description: isVi ? 'Ai có thể duyệt thư viện hình ảnh và video trên hồ sơ của bạn' : 'Who can browse photos and videos on your profile',
      icon: ImageIcon,
    },
    {
      key: 'likes',
      title: isVi ? 'Bài đã thích' : 'Likes',
      description: isVi ? 'Ai có thể xem danh sách các bài viết mà bạn đã thích' : 'Who can see the posts you have liked',
      icon: Heart,
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <SettingsNav activeTab="privacy" />

      <section className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-[#222222]">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#004AC6] dark:text-[#0095F6] flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-[#F5F5F5]">
              {isVi ? 'Quyền riêng tư từng mục hồ sơ' : 'Profile Tab Privacy'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-[#737373]">
              {isVi 
                ? 'Chọn phạm vi đối tượng được duyệt từng tab trên trang cá nhân của bạn' 
                : 'Choose who can browse each individual tab on your profile'}
            </p>
          </div>
        </div>

        {/* Informative Callout */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          <p>
            {isVi
              ? '💡 Lưu ý: Cài đặt này áp dụng cho danh sách hiển thị trên hồ sơ cá nhân. Quyền xem nội dung bài viết gốc của tác giả vẫn được áp dụng độc lập.'
              : '💡 Note: These settings apply to tab visibility on your profile. Original post privacy rules still apply independently.'}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPending(true);
          }}
          className="space-y-4"
        >
          <div className="divide-y divide-gray-100 dark:divide-[#222222]">
            {tabsConfig.map(({ key, title, description, icon: Icon }) => (
              <div
                key={key}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-[#1E1E1E] text-gray-600 dark:text-[#A8A8A8] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-[#F5F5F5]">
                      {title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-400 dark:text-[#737373] leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="sm:self-auto self-end shrink-0">
                  <select
                    value={privacy[key]}
                    onChange={(e) => {
                      setSaved(false);
                      setPrivacy({ ...privacy, [key]: e.target.value as any });
                    }}
                    className="h-10 px-3.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 dark:border-[#363636] bg-gray-50 dark:bg-[#1A1A1A] text-gray-800 dark:text-[#F5F5F5] focus:bg-white dark:focus:bg-[#121212] focus:border-[#004AC6] dark:focus:border-[#0095F6] outline-none transition cursor-pointer"
                  >
                    <option value="PUBLIC">🌍 {isVi ? 'Công khai' : 'Public'}</option>
                    <option value="MUTUAL">👥 {isVi ? 'Người theo dõi lẫn nhau' : 'Mutual followers'}</option>
                    <option value="PRIVATE">🔒 {isVi ? 'Chỉ mình tôi' : 'Only me'}</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-[#222222] flex items-center justify-between gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#004AC6] hover:bg-[#003da6] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] transition shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>{isVi ? 'Xác nhận và lưu qua OTP' : 'Verify & save changes'}</span>
            </button>

            {saved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-fadeIn">
                <Check className="w-4 h-4" />
                <span>{isVi ? 'Đã lưu quyền riêng tư thành công!' : 'Privacy settings saved!'}</span>
              </span>
            )}
          </div>
        </form>
      </section>

      {pending && (
        <OtpActionDialog
          purpose="PROFILE_PRIVACY"
          payload={{ privacy }}
          onClose={() => setPending(false)}
          onComplete={async (token) => {
            await accountSecurity.privacy(privacy, token);
            await refreshUser();
            setPending(false);
            setSaved(true);
            toast.success(isVi ? 'Đã lưu quyền riêng tư thành công!' : 'Privacy settings updated successfully!');
          }}
        />
      )}
    </div>
  );
}

export { ForgotPasswordPage } from './ForgotPasswordPage';

export function AccountRecoveryPage() {
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();

  const [pending, setPending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [session] = useState<RecoverySession | null>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('accountRecovery') || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const deadline = session?.deletionScheduledAt ? Date.parse(session.deletionScheduledAt) : null;
  const remaining = deadline ? Math.max(0, deadline - now) : null;

  return (
    <div className="min-h-screen bg-[#FAFAFB] dark:bg-[#000000] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#004AC6] dark:text-[#0095F6] flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5]">
            {isVi ? 'Khôi phục tài khoản' : 'Restore Account'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8]">
            {session?.status === 'PENDING_DELETION'
              ? (isVi ? 'Tài khoản đang chờ xóa và có thể khôi phục trong thời hạn 30 ngày.' : 'Account is pending deletion and can be restored within 30 days.')
              : (isVi ? 'Tài khoản đang bị vô hiệu hóa. Đăng nhập không tự kích hoạt lại tài khoản.' : 'Account is deactivated. Signing in does not automatically restore it.')}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200/70 dark:border-[#2A2A2A] space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-500 dark:text-[#A8A8A8]">{isVi ? 'Trạng thái' : 'Status'}:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              {session?.status === 'PENDING_DELETION'
                ? (isVi ? 'Đang chờ xóa' : 'Pending deletion')
                : (isVi ? 'Đã vô hiệu hóa' : 'Deactivated')}
            </span>
          </div>

          {remaining !== null && (
            <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-gray-200/50 dark:border-[#262626]">
              <span className="text-gray-500 dark:text-[#A8A8A8]">{isVi ? 'Thời gian còn lại' : 'Time remaining'}:</span>
              <span className="font-mono font-bold text-[#004AC6] dark:text-[#0095F6]">
                {Math.floor(remaining / 86400000)}d {Math.floor(remaining / 3600000) % 24}h {Math.floor(remaining / 60000) % 60}m
              </span>
            </div>
          )}
        </div>

        {session && remaining !== 0 ? (
          <button
            type="button"
            onClick={() => setPending(true)}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#004AC6] hover:bg-[#003da6] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>{isVi ? 'Khôi phục tài khoản qua OTP' : 'Restore account with OTP'}</span>
          </button>
        ) : (
          <p className="text-center text-xs text-rose-500">
            {isVi ? 'Phiên khôi phục đã hết hạn. Vui lòng đăng nhập lại.' : 'Recovery session expired. Please sign in again.'}
          </p>
        )}

        <div className="text-center pt-2">
          <Link
            to="/signin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-[#A8A8A8] hover:text-[#004AC6] dark:hover:text-[#0095F6] transition"
          >
            <span>{isVi ? 'Quay lại đăng nhập' : 'Back to sign in'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pending && session && (
          <OtpActionDialog
            purpose="RESTORE_ACCOUNT"
            payload={{}}
            recoveryToken={session.recoveryToken}
            onClose={() => setPending(false)}
            onComplete={async (token) => {
              await accountSecurity.action('RESTORE_ACCOUNT', token, session.recoveryToken);
              sessionStorage.removeItem('accountRecovery');
              toast.success(isVi ? 'Khôi phục tài khoản thành công!' : 'Account restored successfully!');
              navigate('/signin', { replace: true });
            }}
          />
        )}
      </div>
    </div>
  );
}
