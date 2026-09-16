import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Users, MessageCircle, Rocket, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export const SignInPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
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
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col items-center justify-center p-4">
      {/* Top Bar with Language Selector */}
      <div className="w-full max-w-[1200px] flex justify-end mb-3">
        <div className="flex items-center gap-1.5 bg-white border border-gray-200/80 px-2.5 py-1 rounded-full text-xs shadow-xs">
          <Globe className="w-3.5 h-3.5 text-gray-500" />
          <button
            type="button"
            onClick={() => setLanguage('vi')}
            className={clsx(
              'px-2 py-0.5 rounded-full font-medium transition cursor-pointer',
              language === 'vi' ? 'bg-[#EFF6FF] text-[#004AC6] font-bold' : 'text-gray-500 hover:text-gray-900'
            )}
          >
            VI
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={clsx(
              'px-2 py-0.5 rounded-full font-medium transition cursor-pointer',
              language === 'en' ? 'bg-[#EFF6FF] text-[#004AC6] font-bold' : 'text-gray-500 hover:text-gray-900'
            )}
          >
            EN
          </button>
        </div>
      </div>

      <div className="bg-white max-w-[1200px] w-full min-h-[890px] rounded-[24px] shadow-sm border border-gray-100 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Panel */}
        <div className="w-full lg:w-1/2 bg-[#FAFAFC] p-8 lg:p-12 flex flex-col justify-between border-r border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-[#004AC6] mb-4 tracking-tight">RySocial</h1>
            <h2 className="text-4xl font-bold text-[#1F2937] leading-tight mb-8">
              {t('auth.connectWithCommunity')}
            </h2>
            
            {/* Illustration Placeholder */}
            <div className="w-full h-[300px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] rounded-2xl mb-12 flex items-center justify-center relative overflow-hidden">
              <span className="text-[#004AC6] font-medium">RySocial Community</span>
            </div>

            {/* Feature Bullets */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[rgba(0,74,198,0.10)] text-[#004AC6] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[#1F2937] mb-1">{t('auth.featureConnect')}</h3>
                  <p className="text-[13px] text-[#4B5563]">{t('auth.featureConnectDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[rgba(0,74,198,0.10)] text-[#004AC6] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[#1F2937] mb-1">{t('auth.featureShare')}</h3>
                  <p className="text-[13px] text-[#4B5563]">{t('auth.featureShareDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[rgba(0,74,198,0.10)] text-[#004AC6] flex items-center justify-center shrink-0">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[#1F2937] mb-1">{t('auth.featureDiscover')}</h3>
                  <p className="text-[13px] text-[#4B5563]">{t('auth.featureDiscoverDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 xl:p-20 flex flex-col justify-center">
          <div className="max-w-[400px] w-full mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-[#1F2937] mb-2">{t('auth.signInTitle')}</h2>
              <p className="text-[#4B5563]">{t('auth.signInSubtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#1F2937]">{t('auth.emailOrUsername')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="block w-full pl-10 pr-3 h-[46px] text-sm rounded-[8px] border-gray-200 focus:ring-1 focus:ring-[#004AC6] focus:border-[#004AC6] placeholder-gray-400 text-gray-900 bg-white outline-none"
                    placeholder={t('auth.emailOrUsernamePlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-[#1F2937]">{t('auth.password')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 h-[46px] text-sm rounded-[8px] border-gray-200 focus:ring-1 focus:ring-[#004AC6] focus:border-[#004AC6] placeholder-gray-400 text-gray-900 bg-white outline-none"
                    placeholder={t('auth.passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 mb-6">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#004AC6] focus:ring-[#004AC6]"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-[#4B5563]">
                    {t('auth.rememberMe')}
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-semibold text-[#004AC6] hover:text-[#003da3]">
                    {t('auth.forgotPassword')}
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={clsx(
                  "w-full flex justify-center py-2 px-4 border border-transparent rounded-[8px] shadow-sm text-sm font-semibold text-white bg-[#004AC6] hover:bg-[#003da3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004AC6] h-[42px] items-center transition-colors duration-200 cursor-pointer",
                  isLoading && "opacity-75 cursor-not-allowed"
                )}
              >
                {isLoading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    {language === 'vi' ? 'hoặc tiếp tục với' : 'or continue with'}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" className="w-full inline-flex justify-center py-2 px-4 border border-gray-200 rounded-[8px] shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 h-[42px] items-center cursor-pointer">
                  Google
                </button>
                <button type="button" className="w-full inline-flex justify-center py-2 px-4 border border-gray-200 rounded-[8px] shadow-sm bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 h-[42px] items-center cursor-pointer">
                  Apple
                </button>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-[#4B5563]">
              {t('auth.dontHaveAccount')}{' '}
              <Link to="/signup" className="font-semibold text-[#004AC6] hover:text-[#003da3]">
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
