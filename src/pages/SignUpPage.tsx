import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, Users, MessageCircle, AtSign, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export const SignUpPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  
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
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col items-center justify-center p-4">
      {/* Top Bar with Language Selector */}
      <div className="w-full max-w-[1240px] flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#004AC6] tracking-tight">RySocial</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-[#4B5563]">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/signin" className="font-semibold text-[#004AC6] hover:text-[#003da3]">
              {t('auth.signIn')}
            </Link>
          </p>
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
      </div>

      <div className="bg-white max-w-[1240px] w-full min-h-[750px] rounded-2xl shadow-sm border border-gray-200 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Panel */}
        <div className="w-full lg:w-5/12 bg-[#FAFAFC] p-8 lg:p-12 flex flex-col justify-between border-r border-gray-100">
          <div>
            <h2 className="text-3xl font-bold text-[#1F2937] leading-tight mb-8">
              {language === 'vi' ? 'Tham gia RySocial ngay hôm nay! 🚀' : 'Join RySocial today! 🚀'}
            </h2>
            
            {/* Illustration Placeholder */}
            <div className="w-full h-[240px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] rounded-2xl mb-10 flex items-center justify-center">
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
            </div>
          </div>
          
          <div className="mt-12 text-xs text-gray-500 flex gap-4">
            <a href="#" className="hover:text-gray-900">{language === 'vi' ? 'Chính sách riêng tư' : 'Privacy Policy'}</a>
            <a href="#" className="hover:text-gray-900">{language === 'vi' ? 'Điều khoản dịch vụ' : 'Terms of Service'}</a>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-7/12 p-8 lg:p-12 xl:p-16 flex flex-col">
          <div className="max-w-[500px] w-full mx-auto flex-1 flex flex-col">
            
            {/* Steps Progress */}
            {step < 3 && (
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-[#1F2937] mb-2">{t('auth.signUpTitle')}</h2>
                <p className="text-[#4B5563] mb-8">
                  {language === 'vi'
                    ? `Bước ${step} / 2 — ${step === 1 ? 'Thông tin cơ bản' : 'Hồ sơ & Bảo mật'}`
                    : `Step ${step} of 2 — ${step === 1 ? 'Basic information' : 'Profile & Security'}`}
                </p>
                
                <div className="flex items-center gap-2">
                  <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold", step >= 1 ? "bg-[#004AC6] text-white" : "bg-gray-100 text-gray-400")}>1</div>
                  <div className={clsx("h-[2px] flex-1", step >= 2 ? "bg-[#004AC6]" : "bg-gray-200")}></div>
                  <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold", step >= 2 ? "bg-[#004AC6] text-white" : "bg-gray-100 text-gray-400")}>2</div>
                  <div className={clsx("h-[2px] flex-1", step >= 3 ? "bg-[#004AC6]" : "bg-gray-200")}></div>
                  <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold", step >= 3 ? "bg-[#004AC6] text-white" : "bg-gray-100 text-gray-400")}>3</div>
                </div>
              </div>
            )}

            {/* Form */}
            {step < 3 ? (
              <form onSubmit={handleNextStep} className="space-y-5 flex-1 flex flex-col">
                {step === 1 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-[#1F2937]">
                          {language === 'vi' ? 'Tên' : 'First name'}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="block w-full pl-10 pr-3 h-[46px] text-sm rounded-lg border-gray-200 focus:ring-1 focus:ring-[#004AC6] focus:border-[#004AC6] placeholder-gray-400 outline-none"
                            placeholder={language === 'vi' ? 'Văn' : 'John'}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[13px] font-semibold text-[#1F2937]">
                          {language === 'vi' ? 'Họ' : 'Last name'}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="block w-full pl-10 pr-3 h-[46px] text-sm rounded-lg border-gray-200 focus:ring-1 focus:ring-[#004AC6] focus:border-[#004AC6] placeholder-gray-400 outline-none"
                            placeholder={language === 'vi' ? 'Nguyễn' : 'Doe'}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-[#1F2937]">
                        {language === 'vi' ? 'Tên người dùng (Username)' : 'Username'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <AtSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 h-[46px] text-sm rounded-lg border-gray-200 focus:ring-1 focus:ring-[#004AC6] focus:border-[#004AC6] placeholder-gray-400 outline-none"
                          placeholder="johndoe123"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-[#1F2937]">
                        {language === 'vi' ? 'Địa chỉ Email' : 'Email address'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 h-[46px] text-sm rounded-lg border-gray-200 focus:ring-1 focus:ring-[#004AC6] focus:border-[#004AC6] placeholder-gray-400 outline-none"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-[#1F2937]">
                        {language === 'vi' ? 'Số điện thoại' : 'Phone number'}
                      </label>
                      <div className="relative flex rounded-lg">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <span className="inline-flex items-center px-4 pl-10 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 sm:text-sm">
                          +84
                        </span>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          className="flex-1 block w-full px-3 h-[46px] text-sm rounded-none rounded-r-lg border-gray-200 focus:ring-1 focus:ring-[#004AC6] focus:border-[#004AC6] placeholder-gray-400 outline-none"
                          placeholder="912 345 678"
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-semibold text-[#1F2937]">
                        {t('auth.password')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 h-[46px] text-sm rounded-lg border-gray-200 focus:ring-1 focus:ring-[#004AC6] focus:border-[#004AC6] placeholder-gray-400 outline-none"
                          placeholder={t('auth.passwordPlaceholder')}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {language === 'vi' ? 'Phải chứa ít nhất 8 ký tự.' : 'Must be at least 8 characters long.'}
                      </p>
                    </div>

                    <div className="space-y-1.5 mt-4">
                      <label className="block text-[13px] font-semibold text-[#1F2937]">
                        {language === 'vi' ? 'Xác nhận mật khẩu' : 'Confirm Password'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 h-[46px] text-sm rounded-lg border-gray-200 focus:ring-1 focus:ring-[#004AC6] focus:border-[#004AC6] placeholder-gray-400 outline-none"
                          placeholder={language === 'vi' ? 'Nhập lại mật khẩu của bạn' : 'Confirm your password'}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-auto pt-8">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={clsx(
                      "w-full flex justify-center py-2 px-4 border border-transparent rounded-[8px] shadow-sm text-sm font-semibold text-white bg-[#004AC6] hover:bg-[#003da3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004AC6] h-[46px] items-center transition-colors duration-200 gap-2 cursor-pointer",
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
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-[#1F2937] mb-4">
                  {language === 'vi' ? 'Tài khoản đã tạo thành công!' : 'Account created!'}
                </h2>
                <p className="text-[#4B5563] mb-8 max-w-[300px]">
                  {language === 'vi'
                    ? `Chào mừng ${formData.firstName} đến với RySocial! Tài khoản của bạn đã sẵn sàng.`
                    : `Welcome to RySocial, ${formData.firstName}! Your account has been successfully created.`}
                </p>
                <Link
                  to="/signin"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-[8px] shadow-sm text-sm font-semibold text-white bg-[#004AC6] hover:bg-[#003da3] h-[46px] items-center transition-colors duration-200 cursor-pointer"
                >
                  {language === 'vi' ? 'Đăng nhập để tiếp tục' : 'Sign in to continue'}
                </Link>
              </div>
            )}

            {/* Legal Disclaimer */}
            {step < 3 && (
              <p className="mt-6 text-center text-xs text-gray-500">
                {language === 'vi' ? 'Bằng cách tiếp tục, bạn đồng ý với ' : 'By continuing, you agree to our '}
                <a href="#" className="font-medium text-gray-700 hover:text-gray-900">
                  {language === 'vi' ? 'Điều khoản dịch vụ' : 'Terms of Service'}
                </a>
                {language === 'vi' ? ' và ' : ' and '}
                <a href="#" className="font-medium text-gray-700 hover:text-gray-900">
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
