import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  AtSign, 
  Globe, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff, 
  RotateCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel';
import { EmailVerificationStep } from '../components/auth/EmailVerificationStep';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export const SignUpPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { t, language, setLanguage } = useLanguage();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { register } = useAuth();

  const isVi = language === 'vi';

  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return isVi ? 'Vui lòng nhập tên của bạn' : 'First name is required';
        if (value.trim().length > 50) return isVi ? 'Tên tối đa 50 ký tự' : 'Max 50 characters';
        return null;
      case 'lastName':
        if (!value.trim()) return isVi ? 'Vui lòng nhập họ của bạn' : 'Last name is required';
        if (value.trim().length > 50) return isVi ? 'Họ tối đa 50 ký tự' : 'Max 50 characters';
        return null;
      case 'username': {
        const trimmed = value.trim();
        if (!trimmed) return isVi ? 'Vui lòng nhập tên người dùng' : 'Username is required';
        if (trimmed.length < 3 || trimmed.length > 30) {
          return isVi ? 'Tên người dùng phải từ 3 đến 30 ký tự' : 'Username must be between 3 and 30 characters';
        }
        if (!/^[a-zA-Z0-9_.]+$/.test(trimmed)) {
          return isVi ? 'Chỉ gồm chữ cái, chữ số, dấu chấm (.) và gạch dưới (_)' : 'Only letters, numbers, dot (.), and underscore (_) allowed';
        }
        return null;
      }
      case 'email': {
        const trimmed = value.trim();
        if (!trimmed) return isVi ? 'Vui lòng nhập địa chỉ email' : 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return isVi ? 'Địa chỉ email không đúng định dạng' : 'Invalid email format';
        }
        return null;
      }
      case 'phoneNumber': {
        const trimmed = value.trim().replace(/\s+/g, '');
        if (!trimmed) return isVi ? 'Vui lòng nhập số điện thoại' : 'Phone number is required';
        if (!/^[0-9]{9,11}$/.test(trimmed)) {
          return isVi ? 'Số điện thoại gồm 9 đến 11 chữ số' : 'Phone number must be 9-11 digits';
        }
        return null;
      }
      case 'password':
        if (!value) return isVi ? 'Vui lòng nhập mật khẩu' : 'Password is required';
        if (value.length < 8) return isVi ? 'Mật khẩu phải chứa ít nhất 8 ký tự' : 'Password must be at least 8 characters long';
        if (value.length > 72) return isVi ? 'Mật khẩu tối đa 72 ký tự' : 'Max 72 characters';
        return null;
      case 'confirmPassword':
        if (!value) return isVi ? 'Vui lòng xác nhận mật khẩu' : 'Please confirm your password';
        if (value !== formData.password) return isVi ? 'Mật khẩu xác nhận không khớp' : 'Passwords do not match';
        return null;
      default:
        return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Live validation
    const err = validateField(name, value);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) {
        next[name] = err;
      } else {
        delete next[name];
      }
      return next;
    });

    if (name === 'password' && formData.confirmPassword) {
      if (formData.confirmPassword !== value) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: isVi ? 'Mật khẩu xác nhận không khớp' : 'Passwords do not match',
        }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.confirmPassword;
          return next;
        });
      }
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      const eFirstName = validateField('firstName', formData.firstName);
      const eLastName = validateField('lastName', formData.lastName);
      const eUsername = validateField('username', formData.username);
      const eEmail = validateField('email', formData.email);
      const ePhone = validateField('phoneNumber', formData.phoneNumber);

      const step1Errors: Record<string, string> = {};
      if (eFirstName) step1Errors.firstName = eFirstName;
      if (eLastName) step1Errors.lastName = eLastName;
      if (eUsername) step1Errors.username = eUsername;
      if (eEmail) step1Errors.email = eEmail;
      if (ePhone) step1Errors.phoneNumber = ePhone;

      if (Object.keys(step1Errors).length > 0) {
        setErrors((prev) => ({ ...prev, ...step1Errors }));
        toast.error(isVi ? 'Vui lòng điền đúng và đầy đủ thông tin' : 'Please check and fill in all fields correctly');
        return;
      }

      setStep(2);
    } else if (step === 2) {
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const ePassword = validateField('password', formData.password);
    const eConfirm = validateField('confirmPassword', formData.confirmPassword);

    if (ePassword || eConfirm) {
      setErrors((prev) => ({
        ...prev,
        ...(ePassword ? { password: ePassword } : {}),
        ...(eConfirm ? { confirmPassword: eConfirm } : {}),
      }));
      toast.error(isVi ? 'Vui lòng kiểm tra lại mật khẩu' : 'Please check your password');
      return;
    }

    try {
      setIsLoading(true);
      await register({
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim().replace(/\s+/g, ''),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        password: formData.password,
      });

      // Clear any prior errors and advance to OTP verification
      setErrors({});
      setStep(3);
      toast.success(
        isVi
          ? 'Đăng ký thành công! Vui lòng kiểm tra mã OTP gửi về email.'
          : 'Registration successful! Please check your email for the OTP code.'
      );
    } catch (error: unknown) {
      const errResponse = (error as { 
        response?: { 
          data?: { 
            message?: string; 
            fieldErrors?: Record<string, string>; 
            status?: number 
          } 
        } 
      })?.response;

      const fieldErrors = errResponse?.data?.fieldErrors;
      const status = errResponse?.data?.status;
      const msg = errResponse?.data?.message || '';

      // Direct field error mapping from 400 Validation failed
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        if (fieldErrors.firstName || fieldErrors.lastName || fieldErrors.username || fieldErrors.email || fieldErrors.phoneNumber) {
          setStep(1);
        }
        toast.error(isVi ? 'Vui lòng sửa các trường thông tin bị lỗi' : 'Please fix the invalid fields');
        return;
      }

      // Conflict handling (409)
      if (status === 409) {
        const lower = msg.toLowerCase();
        if (lower.includes('phone') || lower.includes('số điện thoại')) {
          setErrors((prev) => ({
            ...prev,
            phoneNumber: isVi ? 'Số điện thoại này đã được đăng ký. Vui lòng đăng nhập hoặc dùng số khác.' : 'Phone number already registered.',
          }));
          setStep(1);
          toast.error(isVi ? 'Số điện thoại này đã được sử dụng!' : 'Phone number already in use!');
          return;
        }
        if (lower.includes('email')) {
          setErrors((prev) => ({
            ...prev,
            email: isVi ? 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.' : 'Email already in use.',
          }));
          setStep(1);
          toast.error(isVi ? 'Địa chỉ email này đã được sử dụng!' : 'Email already in use!');
          return;
        }
        if (lower.includes('username') || lower.includes('tên người dùng')) {
          setErrors((prev) => ({
            ...prev,
            username: isVi ? 'Tên người dùng này đã tồn tại. Vui lòng chọn tên khác.' : 'Username already in use.',
          }));
          setStep(1);
          toast.error(isVi ? 'Tên người dùng đã được sử dụng!' : 'Username already in use!');
          return;
        }
      }

      toast.error(
        msg || (isVi ? 'Đăng ký tài khoản thất bại. Vui lòng thử lại.' : 'Failed to create account. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAccount = () => {
    setFormData({
      email: '',
      phoneNumber: '',
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
    setStep(1);
    toast(isVi ? 'Đã thiết lập lại form đăng ký' : 'Registration form reset', { icon: '🔄' });
  };

  return (
    <div className="min-h-[100dvh] bg-[#EEF2F6] dark:bg-[#0B0F19] flex flex-col items-center justify-center p-3 sm:p-6 lg:p-10 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] transition-colors duration-200">
      {/* Top Bar with Language Selector & Theme Toggle */}
      <div className="w-full max-w-[1240px] flex justify-between items-center mb-4 sm:mb-6 px-1">
        <Link to="/feed" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="RySocial" className="w-8 h-8 object-contain shrink-0 drop-shadow-xs" />
          <span className="text-2xl font-black text-[#004AC6] dark:text-[#38BDF8] tracking-tight">
            RySocial
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#94A3B8] hidden sm:block">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              to="/signin"
              className="font-bold text-[#004AC6] dark:text-[#38BDF8] hover:underline"
            >
              {t('auth.signIn')}
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
        <AuthHeroPanel mode="signup" />

        {/* Right Functional Stage Panel */}
        <div className="w-full lg:w-7/12 p-5 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-center">
          <div className="max-w-[460px] w-full mx-auto flex-1 flex flex-col justify-center">

            {/* Steps 1 & 2: Information Input Form */}
            {step < 3 ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] mb-1.5 tracking-tight">
                    {t('auth.signUpTitle')}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-[#94A3B8] mb-6">
                    {isVi
                      ? `Bước ${step} / 3 — ${step === 1 ? 'Thông tin cơ bản' : 'Hồ sơ & Bảo mật'}`
                      : `Step ${step} of 3 — ${step === 1 ? 'Basic information' : 'Profile & Security'}`}
                  </p>

                  {/* Stepper Progress Bar */}
                  <div className="flex items-center gap-2">
                    <div
                      className={clsx(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                        step >= 1
                          ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white shadow-2xs'
                          : 'bg-gray-100 dark:bg-[#1E293B] text-gray-400 dark:text-[#94A3B8]'
                      )}
                    >
                      1
                    </div>
                    <div
                      className={clsx(
                        'h-[2px] flex-1 transition-colors',
                        step >= 2 ? 'bg-[#004AC6] dark:bg-[#0095F6]' : 'bg-gray-200 dark:bg-[#1E293B]'
                      )}
                    />
                    <div
                      className={clsx(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                        step >= 2
                          ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white shadow-2xs'
                          : 'bg-gray-100 dark:bg-[#1E293B] text-gray-400 dark:text-[#94A3B8]'
                      )}
                    >
                      2
                    </div>
                    <div
                      className={clsx(
                        'h-[2px] flex-1 transition-colors',
                        step >= 3 ? 'bg-[#004AC6] dark:bg-[#0095F6]' : 'bg-gray-200 dark:bg-[#1E293B]'
                      )}
                    />
                    <div
                      className={clsx(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                        step >= 3
                          ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white shadow-2xs'
                          : 'bg-gray-100 dark:bg-[#1E293B] text-gray-400 dark:text-[#94A3B8]'
                      )}
                    >
                      3
                    </div>
                  </div>
                </div>

                <form onSubmit={handleNextStep} className="space-y-4 flex-1 flex flex-col justify-between">
                  {step === 1 && (
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-[#E2E8F0]">
                            {isVi ? 'Tên' : 'First name'}
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <User className="h-4 w-4 text-gray-400 dark:text-[#94A3B8]" />
                            </div>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className={clsx(
                                'block w-full pl-10 pr-3 h-11 text-sm rounded-xl border bg-white dark:bg-[#1E293B]/60 text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#64748B] outline-none transition-colors',
                                errors.firstName
                                  ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                  : 'border-gray-200 dark:border-[#374151] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20 focus:border-[#004AC6] dark:focus:border-[#38BDF8]'
                              )}
                              placeholder={isVi ? 'Văn' : 'John'}
                              required
                            />
                          </div>
                          {errors.firstName && (
                            <p className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1 font-medium mt-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{errors.firstName}</span>
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-[#E2E8F0]">
                            {isVi ? 'Họ' : 'Last name'}
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <User className="h-4 w-4 text-gray-400 dark:text-[#94A3B8]" />
                            </div>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className={clsx(
                                'block w-full pl-10 pr-3 h-11 text-sm rounded-xl border bg-white dark:bg-[#1E293B]/60 text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#64748B] outline-none transition-colors',
                                errors.lastName
                                  ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                  : 'border-gray-200 dark:border-[#374151] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20 focus:border-[#004AC6] dark:focus:border-[#38BDF8]'
                              )}
                              placeholder={isVi ? 'Nguyễn' : 'Doe'}
                              required
                            />
                          </div>
                          {errors.lastName && (
                            <p className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1 font-medium mt-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{errors.lastName}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-[#E2E8F0]">
                          {isVi ? 'Tên người dùng (Username)' : 'Username'}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <AtSign className="h-4 w-4 text-gray-400 dark:text-[#94A3B8]" />
                          </div>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className={clsx(
                              'block w-full pl-10 pr-3 h-11 text-sm rounded-xl border bg-white dark:bg-[#1E293B]/60 text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#64748B] outline-none transition-colors',
                              errors.username
                                ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                : 'border-gray-200 dark:border-[#374151] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20 focus:border-[#004AC6] dark:focus:border-[#38BDF8]'
                            )}
                            placeholder="johndoe123"
                            required
                          />
                        </div>
                        {errors.username ? (
                          <p className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.username}</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-400 dark:text-[#64748B] mt-0.5">
                            {isVi ? 'Từ 3 đến 30 ký tự, chỉ gồm chữ, số, dấu chấm và gạch dưới.' : '3-30 characters, letters, numbers, dot and underscore only.'}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-[#E2E8F0]">
                          {isVi ? 'Địa chỉ Email' : 'Email address'}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-gray-400 dark:text-[#94A3B8]" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={clsx(
                              'block w-full pl-10 pr-3 h-11 text-sm rounded-xl border bg-white dark:bg-[#1E293B]/60 text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#64748B] outline-none transition-colors',
                              errors.email
                                ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                : 'border-gray-200 dark:border-[#374151] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20 focus:border-[#004AC6] dark:focus:border-[#38BDF8]'
                            )}
                            placeholder="john@example.com"
                            required
                          />
                        </div>
                        {errors.email && (
                          <p className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.email}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-[#E2E8F0]">
                          {isVi ? 'Số điện thoại' : 'Phone number'}
                        </label>
                        <div className="relative flex rounded-xl">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                            <Phone className="h-4 w-4 text-gray-400 dark:text-[#94A3B8]" />
                          </div>
                          <span className="inline-flex items-center px-3.5 pl-9 rounded-l-xl border border-r-0 border-gray-200 dark:border-[#374151] bg-gray-50 dark:bg-[#1E293B] text-gray-500 dark:text-[#94A3B8] text-xs font-semibold select-none">
                            +84
                          </span>
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            className={clsx(
                              'flex-1 block w-full px-3 h-11 text-sm rounded-none rounded-r-xl border bg-white dark:bg-[#1E293B]/60 text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#64748B] outline-none transition-colors',
                              errors.phoneNumber
                                ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                : 'border-gray-200 dark:border-[#374151] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20 focus:border-[#004AC6] dark:focus:border-[#38BDF8]'
                            )}
                            placeholder="912 345 678"
                            required
                          />
                        </div>
                        {errors.phoneNumber && (
                          <p className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.phoneNumber}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-3.5">
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
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={clsx(
                              'block w-full pl-10 pr-10 h-11 text-sm rounded-xl border bg-white dark:bg-[#1E293B]/60 text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#64748B] outline-none transition-colors',
                              errors.password
                                ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                : 'border-gray-200 dark:border-[#374151] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20 focus:border-[#004AC6] dark:focus:border-[#38BDF8]'
                            )}
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
                        {errors.password ? (
                          <p className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.password}</span>
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-400 dark:text-[#94A3B8] mt-1">
                            {isVi ? 'Tối thiểu 8 ký tự, gồm chữ và số.' : 'Must be at least 8 characters long.'}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-700 dark:text-[#E2E8F0]">
                          {isVi ? 'Xác nhận mật khẩu' : 'Confirm Password'}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-gray-400 dark:text-[#94A3B8]" />
                          </div>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={clsx(
                              'block w-full pl-10 pr-10 h-11 text-sm rounded-xl border bg-white dark:bg-[#1E293B]/60 text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#64748B] outline-none transition-colors',
                              errors.confirmPassword
                                ? 'border-red-500 dark:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                : 'border-gray-200 dark:border-[#374151] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20 focus:border-[#004AC6] dark:focus:border-[#38BDF8]'
                            )}
                            placeholder={isVi ? 'Nhập lại mật khẩu' : 'Confirm your password'}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 dark:text-[#94A3B8] hover:text-gray-600 dark:hover:text-[#F5F5F5] cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.confirmPassword}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex items-center gap-3">
                    {step === 2 && (
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="h-11 px-4 border border-gray-200 dark:border-[#374151] text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-50 dark:hover:bg-[#1E293B] rounded-xl font-medium text-xs transition-colors cursor-pointer"
                      >
                        {isVi ? 'Quay lại' : 'Back'}
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={clsx(
                        'flex-1 flex justify-center py-2 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#004AC6] hover:bg-[#003da6] active:bg-[#003185] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] h-11 items-center transition-all gap-2 cursor-pointer',
                        isLoading && 'opacity-75 cursor-not-allowed'
                      )}
                    >
                      {isLoading ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>{isVi ? 'Đang xử lý...' : 'Processing...'}</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {step === 1 ? (isVi ? 'Tiếp tục' : 'Continue') : isVi ? 'Đăng ký ngay' : 'Sign Up'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Terms Disclaimer */}
                <p className="mt-5 text-center text-xs text-gray-400 dark:text-[#64748B] leading-relaxed">
                  {isVi ? 'Bằng việc tiếp tục, bạn đồng ý với ' : 'By continuing, you agree to our '}
                  <a href="#" className="font-semibold text-gray-600 dark:text-[#CBD5E1] hover:underline">
                    {isVi ? 'Điều khoản dịch vụ' : 'Terms of Service'}
                  </a>
                  {isVi ? ' và ' : ' and '}
                  <a href="#" className="font-semibold text-gray-600 dark:text-[#CBD5E1] hover:underline">
                    {isVi ? 'Chính sách bảo mật' : 'Privacy Policy'}
                  </a>.
                </p>
              </>
            ) : (
              /* Step 3: Verified 6-digit OTP Verification */
              <EmailVerificationStep
                email={formData.email}
                fullName={`${formData.firstName} ${formData.lastName}`.trim()}
                username={formData.username}
                isSignUpFlow={true}
                onResetAccount={handleResetAccount}
                onSuccessRedirect="/feed"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
