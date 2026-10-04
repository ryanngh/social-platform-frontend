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
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  User,
  Check
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { accountSecurity, securityError, type FoundAccount } from '../services/accountSecurity';
import { AuthHeroPanel } from '../components/auth/AuthHeroPanel';
import { OtpInput } from '../components/auth/OtpInput';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type Step = 'FIND' | 'FOUND' | 'OTP' | 'PASSWORD' | 'SUCCESS';

export const ForgotPasswordPage: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isVi = language === 'vi';

  // Step state
  const [step, setStep] = useState<Step>('FIND');

  // Step 1: Find account
  const [emailInput, setEmailInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Step 2: Found account
  const [foundAccount, setFoundAccount] = useState<FoundAccount | null>(null);

  // Step 3: OTP challenge
  const [challengeId, setChallengeId] = useState<string>('');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Step 4: New password
  const [actionToken, setActionToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Cooldown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1 Handler: Search Account by email
  const handleFindAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = emailInput.trim();
    if (!query) {
      setSearchError(isVi ? 'Vui lòng nhập email để tìm tài khoản.' : 'Please enter an email.');
      return;
    }
    setIsSearching(true);
    setSearchError('');

    try {
      const account = await accountSecurity.findAccount(query);
      setFoundAccount(account);
      setStep('FOUND');
    } catch (err) {
      setSearchError(securityError(err));
    } finally {
      setIsSearching(false);
    }
  };

  // Step 2 Handler: Send OTP to email
  const handleSendOtp = async () => {
    if (!foundAccount) return;
    setIsSendingOtp(true);
    setOtpError('');

    try {
      const res = await accountSecurity.request('RESET_PASSWORD', {}, foundAccount.email);
      setChallengeId(res.challengeId);
      setCooldown(res.resendAfterSeconds || 60);
      setOtpCode('');
      setStep('OTP');
      toast.success(
        isVi 
          ? `Mã OTP đã được gửi đến ${foundAccount.maskedEmail || foundAccount.email}` 
          : `OTP sent to ${foundAccount.maskedEmail || foundAccount.email}`
      );
    } catch (err) {
      toast.error(securityError(err));
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 3 Handler: Verify OTP code
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (!code || code.length !== 6) {
      setOtpError(isVi ? 'Vui lòng nhập đủ 6 chữ số mã OTP.' : 'Please enter the 6-digit OTP code.');
      return;
    }
    if (!challengeId) return;

    setIsVerifyingOtp(true);
    setOtpError('');

    try {
      const token = await accountSecurity.verify(challengeId, code);
      setActionToken(token);
      setStep('PASSWORD');
      toast.success(isVi ? 'Xác thực OTP thành công!' : 'OTP verified successfully!');
    } catch (err) {
      setOtpError(securityError(err));
      setOtpCode('');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 4 Handler: Save new password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError(isVi ? 'Mật khẩu phải có ít nhất 8 ký tự.' : 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(isVi ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.');
      return;
    }
    if (!actionToken) {
      setPasswordError(isVi ? 'Phiên xác thực đã hết hạn. Vui lòng thử lại.' : 'Session expired. Please try again.');
      return;
    }

    setIsSavingPassword(true);
    setPasswordError('');

    try {
      await accountSecurity.password(newPassword, actionToken, true);
      setStep('SUCCESS');
      toast.success(isVi ? 'Đổi mật khẩu thành công!' : 'Password reset successfully!');
    } catch (err) {
      setPasswordError(securityError(err));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#EEF2F6] dark:bg-[#0B0F19] flex flex-col items-center justify-center p-3 sm:p-6 lg:p-10 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] transition-colors duration-200">
      {/* Top Header */}
      <div className="w-full max-w-[1240px] flex justify-between items-center mb-4 sm:mb-6 px-1">
        <Link to="/feed" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="RySocial" className="w-8 h-8 object-contain shrink-0 drop-shadow-xs" />
          <span className="text-2xl font-black text-[#004AC6] dark:text-[#38BDF8] tracking-tight">
            RySocial
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/signin"
            className="text-xs sm:text-sm font-semibold text-[#004AC6] dark:text-[#38BDF8] hover:underline hidden sm:block"
          >
            {isVi ? 'Quay lại đăng nhập' : 'Back to sign in'}
          </Link>

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

      {/* Main Split Container */}
      <div className="bg-white dark:bg-[#111827] max-w-[1240px] w-full min-h-0 lg:min-h-[720px] rounded-3xl shadow-sm border border-gray-100 dark:border-[#1F2937] flex flex-col lg:flex-row overflow-hidden transition-colors">
        {/* Left Hero Panel */}
        <AuthHeroPanel mode="signin" />

        {/* Right Stage Panel */}
        <div className="w-full lg:w-7/12 p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-center">
          <div className="max-w-[440px] w-full mx-auto flex-1 flex flex-col justify-center">
            
            {/* STEP 1: FIND ACCOUNT */}
            {step === 'FIND' && (
              <div>
                <div className="mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-[#004AC6] dark:text-[#38BDF8] mb-3">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isVi ? 'Bước 1/4: Tìm tài khoản' : 'Step 1/4: Find Account'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] mb-1.5 tracking-tight">
                    {isVi ? 'Tìm tài khoản của bạn' : 'Find Your Account'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-[#94A3B8]">
                    {isVi 
                      ? 'Vui lòng nhập địa chỉ email đã đăng ký để tìm kiếm tài khoản của bạn.' 
                      : 'Please enter the email associated with your account to search.'}
                  </p>
                </div>

                <form onSubmit={handleFindAccount} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-[#E2E8F0]">
                      {isVi ? 'Địa chỉ email' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400 dark:text-[#94A3B8]" />
                      </div>
                      <input
                        type="email"
                        autoFocus
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          if (searchError) setSearchError('');
                        }}
                        className={clsx(
                          'block w-full pl-10 pr-3 h-11 text-sm rounded-xl border bg-white dark:bg-[#1E293B]/60 text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#64748B] outline-none transition-colors',
                          searchError
                            ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                            : 'border-gray-200 dark:border-[#374151] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20 focus:border-[#004AC6] dark:focus:border-[#38BDF8]'
                        )}
                        placeholder="example@domain.com"
                        required
                      />
                    </div>
                    {searchError && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                        {searchError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSearching}
                    className={clsx(
                      'w-full flex justify-center py-2 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#004AC6] hover:bg-[#003da6] active:bg-[#003185] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] h-11 items-center transition-all gap-2 cursor-pointer',
                      isSearching && 'opacity-75 cursor-not-allowed'
                    )}
                  >
                    {isSearching ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>{isVi ? 'Đang tìm kiếm…' : 'Searching…'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isVi ? 'Tìm kiếm' : 'Search Account'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/signin"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-[#94A3B8] hover:text-[#004AC6] dark:hover:text-[#38BDF8] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {isVi ? 'Quay lại đăng nhập' : 'Back to sign in'}
                  </Link>
                </div>
              </div>
            )}

            {/* STEP 2: ACCOUNT FOUND - CONFIRM & SEND OTP */}
            {step === 'FOUND' && foundAccount && (
              <div>
                <div className="mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-[#004AC6] dark:text-[#38BDF8] mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {isVi ? 'Bước 2/4: Xác nhận tài khoản' : 'Step 2/4: Confirm Account'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] mb-1.5 tracking-tight">
                    {isVi ? 'Đây có phải là bạn?' : 'Is this your account?'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-[#94A3B8]">
                    {isVi
                      ? 'Chúng tôi đã tìm thấy tài khoản tương ứng. Chọn nhận mã OTP qua email để tiếp tục.'
                      : 'We found a matching account. Choose to receive the OTP code via email.'}
                  </p>
                </div>

                {/* Account Identity Card */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#1E293B]/50 border border-gray-200/80 dark:border-[#374151] mb-5 flex items-center gap-4">
                  <div className="relative shrink-0">
                    {foundAccount.avatarUrl ? (
                      <img
                        src={foundAccount.avatarUrl}
                        alt={foundAccount.fullName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-[#1E293B] shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#004AC6]/10 dark:bg-[#38BDF8]/20 flex items-center justify-center text-[#004AC6] dark:text-[#38BDF8] border-2 border-white dark:border-[#1E293B] shadow-sm">
                        <User className="w-7 h-7" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-[#F5F5F5] truncate">
                      {foundAccount.fullName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-[#94A3B8] truncate">
                      @{foundAccount.username}
                    </p>
                  </div>
                </div>

                {/* Option to send OTP via email */}
                <div className="mb-6 p-4 rounded-xl border-2 border-[#004AC6] dark:border-[#38BDF8] bg-blue-50/40 dark:bg-blue-900/10 flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-[#004AC6] dark:bg-[#38BDF8] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5]">
                      {isVi ? 'Gửi mã OTP qua email' : 'Send OTP code via email'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-[#94A3B8] mt-0.5">
                      {foundAccount.maskedEmail || foundAccount.email}
                    </p>
                  </div>
                  <Mail className="w-5 h-5 text-[#004AC6] dark:text-[#38BDF8] shrink-0" />
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className={clsx(
                      'w-full flex justify-center py-2 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#004AC6] hover:bg-[#003da6] active:bg-[#003185] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] h-11 items-center transition-all gap-2 cursor-pointer',
                      isSendingOtp && 'opacity-75 cursor-not-allowed'
                    )}
                  >
                    {isSendingOtp ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>{isVi ? 'Đang gửi mã…' : 'Sending code…'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isVi ? 'Tiếp tục & gửi mã OTP' : 'Continue & Send OTP'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('FIND');
                      setFoundAccount(null);
                      setSearchError('');
                    }}
                    className="w-full flex justify-center py-2 px-4 rounded-xl text-xs font-semibold text-gray-600 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#1E293B] h-10 items-center transition-colors cursor-pointer"
                  >
                    {isVi ? 'Không phải bạn? Tìm lại' : 'Not you? Search again'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ENTER AND VERIFY OTP */}
            {step === 'OTP' && foundAccount && (
              <div>
                <div className="mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-[#004AC6] dark:text-[#38BDF8] mb-3">
                    <Mail className="w-3.5 h-3.5" />
                    {isVi ? 'Bước 3/4: Xác thực mã OTP' : 'Step 3/4: Verify OTP'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] mb-1.5 tracking-tight">
                    {isVi ? 'Nhập mã xác nhận' : 'Enter Verification Code'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-[#94A3B8]">
                    {isVi ? (
                      <>
                        Mã gồm 6 chữ số đã được gửi đến{' '}
                        <strong className="text-gray-900 dark:text-white">
                          {foundAccount.maskedEmail || foundAccount.email}
                        </strong>
                        . Vui lòng kiểm tra hộp thư của bạn.
                      </>
                    ) : (
                      <>
                        A 6-digit code was sent to{' '}
                        <strong className="text-gray-900 dark:text-white">
                          {foundAccount.maskedEmail || foundAccount.email}
                        </strong>
                        .
                      </>
                    )}
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <OtpInput
                      length={6}
                      value={otpCode}
                      onChange={(val) => {
                        setOtpCode(val);
                        if (otpError) setOtpError('');
                      }}
                      onComplete={(val) => {
                        void handleVerifyOtp(val);
                      }}
                      hasError={!!otpError}
                      disabled={isVerifyingOtp}
                    />
                    {otpError && (
                      <p className="text-center text-xs text-red-500 dark:text-red-400 mt-2 font-medium">
                        {otpError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#94A3B8]">
                    <span>
                      {isVi ? 'Chưa nhận được mã?' : "Didn't receive the code?"}
                    </span>
                    <button
                      type="button"
                      disabled={cooldown > 0 || isSendingOtp}
                      onClick={handleSendOtp}
                      className={clsx(
                        'font-bold transition-colors cursor-pointer',
                        cooldown > 0
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-[#004AC6] dark:text-[#38BDF8] hover:underline'
                      )}
                    >
                      {cooldown > 0
                        ? `${isVi ? 'Gửi lại sau' : 'Resend in'} ${cooldown}s`
                        : isVi ? 'Gửi lại mã' : 'Resend code'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleVerifyOtp()}
                      disabled={isVerifyingOtp || otpCode.length !== 6}
                      className={clsx(
                        'w-full flex justify-center py-2 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#004AC6] hover:bg-[#003da6] active:bg-[#003185] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] h-11 items-center transition-all gap-2 cursor-pointer',
                        (isVerifyingOtp || otpCode.length !== 6) && 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      {isVerifyingOtp ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>{isVi ? 'Đang xác thực…' : 'Verifying…'}</span>
                        </>
                      ) : (
                        <>
                          <span>{isVi ? 'Xác nhận mã OTP' : 'Verify Code'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep('FOUND')}
                      className="w-full flex justify-center py-2 px-4 rounded-xl text-xs font-semibold text-gray-500 dark:text-[#94A3B8] hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {isVi ? 'Quay lại' : 'Back'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: ENTER NEW PASSWORD */}
            {step === 'PASSWORD' && (
              <div>
                <div className="mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-3">
                    <Lock className="w-3.5 h-3.5" />
                    {isVi ? 'Bước 4/4: Đặt mật khẩu mới' : 'Step 4/4: Set New Password'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] mb-1.5 tracking-tight">
                    {isVi ? 'Tạo mật khẩu mới' : 'Create New Password'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-[#94A3B8]">
                    {isVi
                      ? 'Mật khẩu mới của bạn phải khác mật khẩu trước đó và có ít nhất 8 ký tự.'
                      : 'Your new password must be at least 8 characters long.'}
                  </p>
                </div>

                <form onSubmit={handleSavePassword} className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-[#E2E8F0]">
                      {isVi ? 'Mật khẩu mới' : 'New Password'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400 dark:text-[#94A3B8]" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoFocus
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                        }}
                        className="block w-full pl-10 pr-10 h-11 text-sm rounded-xl border border-gray-200 dark:border-[#374151] bg-white dark:bg-[#1E293B]/60 text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#64748B] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20 focus:border-[#004AC6] dark:focus:border-[#38BDF8] outline-none transition-colors"
                        placeholder={isVi ? 'Nhập tối thiểu 8 ký tự' : 'At least 8 characters'}
                        required
                        minLength={8}
                        maxLength={72}
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

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-[#E2E8F0]">
                      {isVi ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400 dark:text-[#94A3B8]" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                        }}
                        className="block w-full pl-10 pr-10 h-11 text-sm rounded-xl border border-gray-200 dark:border-[#374151] bg-white dark:bg-[#1E293B]/60 text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#64748B] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20 focus:border-[#004AC6] dark:focus:border-[#38BDF8] outline-none transition-colors"
                        placeholder={isVi ? 'Nhập lại mật khẩu mới' : 'Re-enter your password'}
                        required
                        minLength={8}
                        maxLength={72}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 dark:text-[#94A3B8] hover:text-gray-600 dark:hover:text-[#F5F5F5] cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {passwordError && (
                    <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                      {passwordError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className={clsx(
                      'w-full flex justify-center py-2 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#004AC6] hover:bg-[#003da6] active:bg-[#003185] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] h-11 items-center transition-all gap-2 cursor-pointer mt-2',
                      isSavingPassword && 'opacity-75 cursor-not-allowed'
                    )}
                  >
                    {isSavingPassword ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>{isVi ? 'Đang lưu mật khẩu…' : 'Saving password…'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isVi ? 'Lưu mật khẩu mới' : 'Save New Password'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 5: SUCCESS */}
            {step === 'SUCCESS' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] mb-2">
                  {isVi ? 'Đổi mật khẩu thành công!' : 'Password Reset Successful!'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-[#94A3B8] mb-6 max-w-sm mx-auto">
                  {isVi
                    ? 'Mật khẩu tài khoản của bạn đã được thay đổi thành công. Bạn có thể đăng nhập ngay bây giờ.'
                    : 'Your password has been successfully updated. You can now sign in with your new credentials.'}
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/signin', { replace: true })}
                  className="w-full flex justify-center py-2 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#004AC6] hover:bg-[#003da6] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] h-11 items-center transition-all gap-2 cursor-pointer"
                >
                  <span>{isVi ? 'Đăng nhập ngay' : 'Sign In Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
