import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Users, MessageCircle, Rocket, Globe, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export const SignInPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error(language === 'vi' ? 'Vui lòng nhập đầy đủ thông tin' : 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await login({ identifier, password });
      toast.success(language === 'vi' ? 'Đăng nhập thành công!' : 'Successfully logged in!');
      navigate('/feed');
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || (language === 'vi' ? 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.' : 'Failed to sign in. Please check your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] dark:bg-[#000000] flex flex-col items-center justify-center p-4 transition-colors duration-200">
      {/* Top Bar with Language Selector & Theme Toggle */}
      <div className="w-full max-w-[1200px] flex justify-end items-center gap-2 mb-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded-full bg-white dark:bg-[#121212] border border-gray-200/80 dark:border-[#262626] text-gray-500 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5] shadow-xs transition cursor-pointer"
          title={resolvedTheme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        <div className="flex items-center gap-1.5 bg-white dark:bg-[#121212] border border-gray-200/80 dark:border-[#262626] px-2.5 py-1 rounded-full text-xs shadow-xs">
          <Globe className="w-3.5 h-3.5 text-gray-500 dark:text-[#A8A8A8]" />
          <button
            type="button"
            onClick={() => setLanguage('vi')}
            className={clsx(
              'px-2 py-0.5 rounded-full font-medium transition cursor-pointer',
              language === 'vi' ? 'bg-[#EFF6FF] dark:bg-[#0095F6]/15 text-[#004AC6] dark:text-[#3897F0] font-bold' : 'text-gray-500 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5]'
            )}
          >
            VI
          </button>
          <span className="text-gray-300 dark:text-[#525252]">|</span>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={clsx(
              'px-2 py-0.5 rounded-full font-medium transition cursor-pointer',
              language === 'en' ? 'bg-[#EFF6FF] dark:bg-[#0095F6]/15 text-[#004AC6] dark:text-[#3897F0] font-bold' : 'text-gray-500 dark:text-[#A8A8A8] hover:text-gray-900 dark:hover:text-[#F5F5F5]'
            )}
          >
            EN
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#121212] max-w-[1140px] w-full min-h-[720px] rounded-3xl shadow-sm border border-gray-100 dark:border-[#262626] flex flex-col lg:flex-row overflow-hidden transition-colors">
        
        {/* Left Panel */}
        <div className="w-full lg:w-1/2 bg-[#FAFAFC] dark:bg-[#0A0A0A] p-8 lg:p-12 flex flex-col justify-between border-r border-gray-100 dark:border-[#262626]">
          <div>
            <h1 className="text-2xl font-black text-[#004AC6] dark:text-[#0095F6] mb-3 tracking-tight">RySocial</h1>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#F5F5F5] leading-tight mb-6">
              {t('auth.connectWithCommunity')}
            </h2>
            
            {/* Illustration Placeholder */}
            <div className="w-full h-[220px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] dark:from-[#1A1A1A] dark:to-[#121212] rounded-2xl mb-8 flex items-center justify-center relative overflow-hidden border border-gray-100 dark:border-[#262626]">
              <span className="text-[#004AC6] dark:text-[#0095F6] font-semibold text-sm">RySocial Community</span>
            </div>

            {/* Feature Bullets */}
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-[#0095F6]/15 text-[#004AC6] dark:text-[#0095F6] flex items-center justify-center shrink-0">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E5E5E5]">{t('auth.featureConnect')}</h3>
                  <p className="text-xs text-gray-500 dark:text-[#A8A8A8] mt-0.5">{t('auth.featureConnectDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-[#0095F6]/15 text-[#004AC6] dark:text-[#0095F6] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E5E5E5]">{t('auth.featureShare')}</h3>
                  <p className="text-xs text-gray-500 dark:text-[#A8A8A8] mt-0.5">{t('auth.featureShareDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-[#0095F6]/15 text-[#004AC6] dark:text-[#0095F6] flex items-center justify-center shrink-0">
                  <Rocket className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-[#E5E5E5]">{t('auth.featureDiscover')}</h3>
                  <p className="text-xs text-gray-500 dark:text-[#A8A8A8] mt-0.5">{t('auth.featureDiscoverDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 xl:p-14 flex flex-col justify-center">
          <div className="max-w-[380px] w-full mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] mb-1.5">{t('auth.signInTitle')}</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8]">{t('auth.signInSubtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">{t('auth.emailOrUsername')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4.5 w-4.5 text-gray-400 dark:text-[#737373]" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full pl-10 pr-3 h-11 text-sm rounded-xl border border-gray-200 dark:border-[#363636] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] placeholder-gray-400 dark:placeholder-[#737373] text-gray-900 dark:text-[#F5F5F5] bg-white dark:bg-[#1A1A1A] outline-none transition-colors"
                    placeholder={t('auth.emailOrUsernamePlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">{t('auth.password')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-gray-400 dark:text-[#737373]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 h-11 text-sm rounded-xl border border-gray-200 dark:border-[#363636] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] placeholder-gray-400 dark:placeholder-[#737373] text-gray-900 dark:text-[#F5F5F5] bg-white dark:bg-[#1A1A1A] outline-none transition-colors"
                    placeholder={t('auth.passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 dark:text-[#737373] hover:text-gray-600 dark:hover:text-[#F5F5F5] focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 pb-1">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded-md border-gray-300 dark:border-[#363636] text-[#004AC6] dark:text-blue-500 focus:ring-[#004AC6] dark:bg-[#1A1A1A] cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-600 dark:text-[#A8A8A8] cursor-pointer">
                    {t('auth.rememberMe')}
                  </label>
                </div>
                <div className="text-xs">
                  <a href="#" className="font-semibold text-[#004AC6] dark:text-[#0095F6] hover:underline">
                    {t('auth.forgotPassword')}
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={clsx(
                  "w-full flex justify-center py-2 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#004AC6] hover:bg-[#003da3] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] h-11 items-center transition-colors cursor-pointer",
                  isLoading && "opacity-75 cursor-not-allowed"
                )}
              >
                {isLoading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100 dark:border-[#262626]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white dark:bg-[#121212] text-gray-400 dark:text-[#737373]">
                    {language === 'vi' ? 'hoặc tiếp tục với' : 'or continue with'}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button type="button" className="w-full inline-flex justify-center py-2 px-4 border border-gray-200 dark:border-[#363636] rounded-xl shadow-2xs bg-white dark:bg-[#1A1A1A] text-xs font-semibold text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#262626] h-10 items-center cursor-pointer transition-colors">
                  Google
                </button>
                <button type="button" className="w-full inline-flex justify-center py-2 px-4 border border-gray-200 dark:border-[#363636] rounded-xl shadow-2xs bg-white dark:bg-[#1A1A1A] text-xs font-semibold text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#262626] h-10 items-center cursor-pointer transition-colors">
                  Apple
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500 dark:text-[#A8A8A8]">
              {t('auth.dontHaveAccount')}{' '}
              <Link to="/signup" className="font-semibold text-[#004AC6] dark:text-[#0095F6] hover:underline">
                {t('auth.signUpFree')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
