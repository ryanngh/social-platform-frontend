import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Globe, 
  Sun, 
  Moon, 
  RotateCw, 
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel';
import { EmailVerificationStep } from '../components/auth/EmailVerificationStep';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export const SignInPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State to handle unverified account during login
  const [showVerification, setShowVerification] = useState(false);
  const [unverifiedUserData, setUnverifiedUserData] = useState<{
    email: string;
    fullName?: string;
    username?: string;
  } | null>(null);

  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isVi = language === 'vi';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error(isVi ? 'Vui lòng nhập đầy đủ thông tin đăng nhập' : 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await login({ identifier: identifier.trim(), password });

      // Check verification status from profile
      try {
        const profile = await userService.getMyProfile();
        if (profile && profile.isVerified === false) {
          let userEmail = identifier.includes('@') ? identifier.trim() : '';
          try {
            const account = await authService.getAccountInfo();
            if (account?.email) {
              userEmail = account.email;
            }
          } catch {
            // fallback
          }

          setUnverifiedUserData({
            email: userEmail || (profile.email || identifier.trim()),
            fullName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
            username: profile.username,
          });
          setShowVerification(true);
          toast(
            isVi
              ? 'Tài khoản chưa được kích hoạt. Vui lòng xác thực mã OTP.'
              : 'Account not yet verified. Please enter the OTP code.',
            { icon: 'ℹ️' }
          );
          return;
        }
      } catch {
        // If profile fetch fails, continue to feed
      }

      toast.success(isVi ? 'Đăng nhập thành công!' : 'Successfully signed in!');
      navigate('/feed');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(
        msg ||
          (isVi
            ? 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.'
            : 'Failed to sign in. Please check your credentials.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#EEF2F6] dark:bg-[#0B0F19] flex flex-col items-center justify-center p-3 sm:p-6 lg:p-10 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] transition-colors duration-200">
      {/* Top Bar with Language Selector & Theme Toggle */}
      <div className="w-full max-w-[1240px] flex justify-between items-center mb-4 sm:mb-6 px-1">
        <Link to="/feed" className="flex items-center gap-2">
          <span className="text-2xl font-black text-[#004AC6] dark:text-[#38BDF8] tracking-tight">
            RySocial
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#94A3B8] hidden sm:block">
            {t('auth.dontHaveAccount')}{' '}
            <Link
              to="/signup"
              className="font-bold text-[#004AC6] dark:text-[#38BDF8] hover:underline"
            >
              {t('auth.signUpFree')}
            </Link>
          </p>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-[#1F2937] text-gray-500 dark:text-[#94A3B8] hover:text-gray-900 dark:hover:text-[#F5F5F5] shadow-2xs transition cursor-pointer"
            title={resolvedTheme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-[#1F2937] px-2.5 py-1 rounded-full text-xs shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-gray-400 dark:text-[#94A3B8]" />
            <button
              type="button"
              onClick={() => setLanguage('vi')}
              className={clsx(
                'px-2 py-0.5 rounded-full font-medium transition cursor-pointer',
                language === 'vi'
                  ? 'bg-blue-50 dark:bg-[#004AC6]/20 text-[#004AC6] dark:text-[#38BDF8] font-bold'
                  : 'text-gray-500 dark:text-[#94A3B8] hover:text-gray-900 dark:hover:text-[#F5F5F5]'
              )}
            >
              VI
            </button>
            <span className="text-gray-300 dark:text-[#374151]">|</span>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={clsx(
                'px-2 py-0.5 rounded-full font-medium transition cursor-pointer',
                language === 'en'
                  ? 'bg-blue-50 dark:bg-[#004AC6]/20 text-[#004AC6] dark:text-[#38BDF8] font-bold'
                  : 'text-gray-500 dark:text-[#94A3B8] hover:text-gray-900 dark:hover:text-[#F5F5F5]'
              )}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Main Split-Screen Authentication Shell */}
      <div className="bg-white dark:bg-[#111827] max-w-[1240px] w-full min-h-0 lg:min-h-[760px] rounded-3xl shadow-sm border border-gray-100 dark:border-[#1F2937] flex flex-col lg:flex-row overflow-hidden transition-colors">
        
        {/* Left Hero & Identity Panel */}
        <AuthHeroPanel mode="signin" />

        {/* Right Functional Stage Panel */}
        <div className="w-full lg:w-7/12 p-5 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-center">
          <div className="max-w-[420px] w-full mx-auto flex-1 flex flex-col justify-center">
            
            {showVerification && unverifiedUserData ? (
              /* Inline Step 3 Verification if user is unverified at sign in */
              <EmailVerificationStep
                email={unverifiedUserData.email}
                fullName={unverifiedUserData.fullName}
                username={unverifiedUserData.username}
                isSignUpFlow={false}
                onResetAccount={() => {
                  setShowVerification(false);
                  setUnverifiedUserData(null);
                }}
                onSuccessRedirect="/feed"
              />
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] mb-1.5 tracking-tight">
                    {t('auth.signInTitle')}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-[#94A3B8]">
                    {t('auth.signInSubtitle')}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-[#E2E8F0]">
                      {t('auth.emailOrUsername')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400 dark:text-[#94A3B8]" />
                      </div>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="block w-full pl-10 pr-3 h-11 text-sm rounded-xl border border-gray-200 dark:border-[#374151] bg-white dark:bg-[#1E293B]/60 text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#64748B] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20 focus:border-[#004AC6] dark:focus:border-[#38BDF8] outline-none transition-colors"
                        placeholder={t('auth.emailOrUsernamePlaceholder')}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-[#E2E8F0]">
                      {t('auth.password')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400 dark:text-[#94A3B8]" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 h-11 text-sm rounded-xl border border-gray-200 dark:border-[#374151] bg-white dark:bg-[#1E293B]/60 text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#64748B] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20 focus:border-[#004AC6] dark:focus:border-[#38BDF8] outline-none transition-colors"
                        placeholder={t('auth.passwordPlaceholder')}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 dark:text-[#94A3B8] hover:text-gray-600 dark:hover:text-[#F5F5F5] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 pb-1">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 rounded-md border-gray-300 dark:border-[#374151] text-[#004AC6] dark:text-[#38BDF8] focus:ring-[#004AC6] dark:bg-[#1E293B] cursor-pointer"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-2 block text-xs text-gray-600 dark:text-[#94A3B8] cursor-pointer select-none"
                      >
                        {t('auth.rememberMe')}
                      </label>
                    </div>
                    <div className="text-xs">
                      <a
                        href="#"
                        className="font-semibold text-[#004AC6] dark:text-[#38BDF8] hover:underline"
                      >
                        {t('auth.forgotPassword')}
                      </a>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={clsx(
                      'w-full flex justify-center py-2 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#004AC6] hover:bg-[#003da6] active:bg-[#003185] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] h-11 items-center transition-all gap-2 cursor-pointer',
                      isLoading && 'opacity-75 cursor-not-allowed'
                    )}
                  >
                    {isLoading ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>{t('auth.signingIn')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('auth.signIn')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100 dark:border-[#1F2937]" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white dark:bg-[#111827] text-gray-400 dark:text-[#64748B]">
                        {isVi ? 'hoặc tiếp tục với' : 'or continue with'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center py-2 px-4 border border-gray-200 dark:border-[#374151] rounded-xl shadow-2xs bg-white dark:bg-[#1E293B]/40 text-xs font-semibold text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-50 dark:hover:bg-[#1E293B] h-10 items-center cursor-pointer transition-colors gap-2"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      Google
                    </button>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center py-2 px-4 border border-gray-200 dark:border-[#374151] rounded-xl shadow-2xs bg-white dark:bg-[#1E293B]/40 text-xs font-semibold text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-50 dark:hover:bg-[#1E293B] h-10 items-center cursor-pointer transition-colors gap-2"
                    >
                      <svg className="w-4 h-4 fill-current text-gray-900 dark:text-white" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.67-.82 1.12-1.96.99-3.1-.97.04-2.14.65-2.83 1.46-.61.7-.1.14 1.84-.99 3.03 1.08.08 2.18-.57 2.83-1.39z" />
                      </svg>
                      Apple
                    </button>
                  </div>
                </div>

                <p className="mt-6 text-center text-xs text-gray-500 dark:text-[#94A3B8]">
                  {t('auth.dontHaveAccount')}{' '}
                  <Link
                    to="/signup"
                    className="font-bold text-[#004AC6] dark:text-[#38BDF8] hover:underline"
                  >
                    {t('auth.signUpFree')}
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
