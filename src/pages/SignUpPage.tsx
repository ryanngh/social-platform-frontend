import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, Users, MessageCircle, AtSign, Globe, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export const SignUpPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { resolvedTheme, toggleTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const { register } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.email || !formData.phoneNumber || !formData.firstName || !formData.lastName || !formData.username) {
        toast.error(language === 'vi' ? 'Vui lòng điền đầy đủ các thông tin' : 'Please fill in all fields');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error(language === 'vi' ? 'Mật khẩu xác nhận không khớp' : 'Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      toast.error(language === 'vi' ? 'Mật khẩu phải chứa ít nhất 8 ký tự' : 'Password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      await register({
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        password: formData.password
      });
      setStep(3); // Success step
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || (language === 'vi' ? 'Đăng ký tài khoản thất bại. Vui lòng thử lại.' : 'Failed to create account. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] dark:bg-[#000000] flex flex-col items-center justify-center p-4 transition-colors duration-200">
      {/* Top Bar with Language Selector & Theme Toggle */}
      <div className="w-full max-w-[1240px] flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#004AC6] dark:text-[#0095F6] tracking-tight">RySocial</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-[#4B5563] dark:text-[#A8A8A8] hidden sm:block">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/signin" className="font-semibold text-[#004AC6] dark:text-[#0095F6] hover:text-[#003da3] dark:hover:text-[#3897F0]">
              {t('auth.signIn')}
            </Link>
          </p>

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
      </div>

      <div className="bg-white dark:bg-[#121212] max-w-[1140px] w-full min-h-[720px] rounded-3xl shadow-sm border border-gray-100 dark:border-[#262626] flex flex-col lg:flex-row overflow-hidden transition-colors">
        
        {/* Left Panel */}
        <div className="w-full lg:w-5/12 bg-[#FAFAFC] dark:bg-[#0A0A0A] p-8 lg:p-12 flex flex-col justify-between border-r border-gray-100 dark:border-[#262626]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#F5F5F5] leading-tight mb-6">
              {language === 'vi' ? 'Tham gia RySocial ngay hôm nay! 🚀' : 'Join RySocial today! 🚀'}
            </h2>
            
            {/* Illustration Placeholder */}
            <div className="w-full h-[200px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] dark:from-[#1A1A1A] dark:to-[#121212] rounded-2xl mb-8 flex items-center justify-center border border-gray-100 dark:border-[#262626]">
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
            </div>
          </div>
          
          <div className="mt-8 text-xs text-gray-400 dark:text-[#737373] flex gap-4">
            <a href="#" className="hover:text-gray-900 dark:hover:text-[#F5F5F5] transition-colors">{language === 'vi' ? 'Chính sách riêng tư' : 'Privacy Policy'}</a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-[#F5F5F5] transition-colors">{language === 'vi' ? 'Điều khoản dịch vụ' : 'Terms of Service'}</a>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-7/12 p-8 lg:p-12 xl:p-14 flex flex-col justify-center">
          <div className="max-w-[460px] w-full mx-auto flex-1 flex flex-col">
            
            {/* Steps Progress */}
            {step < 3 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] mb-1.5">{t('auth.signUpTitle')}</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] mb-6">
                  {language === 'vi'
                    ? `Bước ${step} / 2 — ${step === 1 ? 'Thông tin cơ bản' : 'Hồ sơ & Bảo mật'}`
                    : `Step ${step} of 2 — ${step === 1 ? 'Basic information' : 'Profile & Security'}`}
                </p>
                
                <div className="flex items-center gap-2">
                  <div className={clsx("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors", step >= 1 ? "bg-[#004AC6] dark:bg-[#0095F6] text-white" : "bg-gray-100 dark:bg-[#1A1A1A] text-gray-400 dark:text-[#737373]")}>1</div>
                  <div className={clsx("h-[2px] flex-1 transition-colors", step >= 2 ? "bg-[#004AC6] dark:bg-[#0095F6]" : "bg-gray-200 dark:bg-[#1A1A1A]")}></div>
                  <div className={clsx("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors", step >= 2 ? "bg-[#004AC6] dark:bg-[#0095F6] text-white" : "bg-gray-100 dark:bg-[#1A1A1A] text-gray-400 dark:text-[#737373]")}>2</div>
                  <div className={clsx("h-[2px] flex-1 transition-colors", step >= 3 ? "bg-[#004AC6] dark:bg-[#0095F6]" : "bg-gray-200 dark:bg-[#1A1A1A]")}></div>
                  <div className={clsx("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors", step >= 3 ? "bg-[#004AC6] dark:bg-[#0095F6] text-white" : "bg-gray-100 dark:bg-[#1A1A1A] text-gray-400 dark:text-[#737373]")}>3</div>
                </div>
              </div>
            )}

            {/* Form */}
            {step < 3 ? (
              <form onSubmit={handleNextStep} className="space-y-4 flex-1 flex flex-col">
                {step === 1 && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                          {language === 'vi' ? 'Tên' : 'First name'}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User className="h-4.5 w-4.5 text-gray-400 dark:text-[#737373]" />
                          </div>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="block w-full pl-10 pr-3 h-11 text-sm rounded-xl border border-gray-200 dark:border-[#363636] bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] outline-none transition-colors"
                            placeholder={language === 'vi' ? 'Văn' : 'John'}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                          {language === 'vi' ? 'Họ' : 'Last name'}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User className="h-4.5 w-4.5 text-gray-400 dark:text-[#737373]" />
                          </div>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="block w-full pl-10 pr-3 h-11 text-sm rounded-xl border border-gray-200 dark:border-[#363636] bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] outline-none transition-colors"
                            placeholder={language === 'vi' ? 'Nguyễn' : 'Doe'}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                        {language === 'vi' ? 'Tên người dùng (Username)' : 'Username'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <AtSign className="h-4.5 w-4.5 text-gray-400 dark:text-[#737373]" />
                        </div>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 h-11 text-sm rounded-xl border border-gray-200 dark:border-[#363636] bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] outline-none transition-colors"
                          placeholder="johndoe123"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                        {language === 'vi' ? 'Địa chỉ Email' : 'Email address'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail className="h-4.5 w-4.5 text-gray-400 dark:text-[#737373]" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 h-11 text-sm rounded-xl border border-gray-200 dark:border-[#363636] bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] outline-none transition-colors"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                        {language === 'vi' ? 'Số điện thoại' : 'Phone number'}
                      </label>
                      <div className="relative flex rounded-xl">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                          <Phone className="h-4.5 w-4.5 text-gray-400 dark:text-[#737373]" />
                        </div>
                        <span className="inline-flex items-center px-4 pl-10 rounded-l-xl border border-r-0 border-gray-200 dark:border-[#363636] bg-gray-50 dark:bg-[#1A1A1A] text-gray-500 dark:text-[#A8A8A8] text-xs font-semibold">
                          +84
                        </span>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          className="flex-1 block w-full px-3 h-11 text-sm rounded-none rounded-r-xl border border-gray-200 dark:border-[#363636] bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] outline-none transition-colors"
                          placeholder="912 345 678"
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                        {t('auth.password')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Lock className="h-4.5 w-4.5 text-gray-400 dark:text-[#737373]" />
                        </div>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 h-11 text-sm rounded-xl border border-gray-200 dark:border-[#363636] bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] outline-none transition-colors"
                          placeholder={t('auth.passwordPlaceholder')}
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-[#737373] mt-1">
                        {language === 'vi' ? 'Phải chứa ít nhất 8 ký tự.' : 'Must be at least 8 characters long.'}
                      </p>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-[#E5E5E5]">
                        {language === 'vi' ? 'Xác nhận mật khẩu' : 'Confirm Password'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Lock className="h-4.5 w-4.5 text-gray-400 dark:text-[#737373]" />
                        </div>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 h-11 text-sm rounded-xl border border-gray-200 dark:border-[#363636] bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#0095F6]/30 focus:border-[#004AC6] dark:focus:border-[#0095F6] outline-none transition-colors"
                          placeholder={language === 'vi' ? 'Nhập lại mật khẩu của bạn' : 'Confirm your password'}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-auto pt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={clsx(
                      "w-full flex justify-center py-2 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#004AC6] hover:bg-[#003da3] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] h-11 items-center transition-colors gap-2 cursor-pointer",
                      isLoading && "opacity-75 cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (language === 'vi' ? 'Đang xử lý...' : 'Processing...') : (step === 1 ? (language === 'vi' ? 'Tiếp tục' : 'Continue') : t('auth.signUp'))}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#F5F5F5] mb-3">
                  {language === 'vi' ? 'Tài khoản đã tạo thành công!' : 'Account created!'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] mb-6 max-w-[300px] leading-relaxed">
                  {language === 'vi'
                    ? `Chào mừng ${formData.firstName} đến với RySocial! Tài khoản của bạn đã sẵn sàng.`
                    : `Welcome to RySocial, ${formData.firstName}! Your account has been successfully created.`}
                </p>
                <Link
                  to="/signin"
                  className="w-full flex justify-center py-2 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#004AC6] hover:bg-[#003da3] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] h-11 items-center transition-colors cursor-pointer"
                >
                  {language === 'vi' ? 'Đăng nhập để tiếp tục' : 'Sign in to continue'}
                </Link>
              </div>
            )}

            {/* Legal Disclaimer */}
            {step < 3 && (
              <p className="mt-5 text-center text-xs text-gray-400 dark:text-[#737373]">
                {language === 'vi' ? 'Bằng cách tiếp tục, bạn đồng ý với ' : 'By continuing, you agree to our '}
                <a href="#" className="font-medium text-gray-600 dark:text-[#D4D4D4] hover:underline">
                  {language === 'vi' ? 'Điều khoản dịch vụ' : 'Terms of Service'}
                </a>
                {language === 'vi' ? ' và ' : ' and '}
                <a href="#" className="font-medium text-gray-600 dark:text-[#D4D4D4] hover:underline">
                  {language === 'vi' ? 'Chính sách riêng tư' : 'Privacy Policy'}
                </a>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
