import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RotateCw, 
  ArrowRight, 
  Check, 
  Info,
  BadgeCheck,
  UserCheck,
  Edit3,
  X,
  LogOut
} from 'lucide-react';
import { OtpInput } from './OtpInput';
import OtpActionDialog from './OtpActionDialog';
import { accountSecurity } from '../../services/accountSecurity';
import { useResendCooldown } from '../../hooks/useResendCooldown';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface EmailVerificationStepProps {
  email: string;
  fullName?: string;
  username?: string;
  avatarUrl?: string;
  isSignUpFlow?: boolean;
  onResetAccount?: () => void;
  onSuccessRedirect?: string;
}

export const EmailVerificationStep: React.FC<EmailVerificationStepProps> = ({
  email: initialEmail,
  fullName,
  username,
  avatarUrl,
  isSignUpFlow = true,
  onResetAccount,
  onSuccessRedirect = '/feed',
}) => {
  const [currentEmail] = useState(initialEmail);
  const [emailChallenge,setEmailChallenge] = useState<string>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

  // State for changing email
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [newEmailError, setNewEmailError] = useState<string | null>(null);
  const isChangingEmail = !!emailChallenge;

  const { canResend, secondsLeft, startCooldown } = useResendCooldown(60);
  const { refreshUser, logout } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const isVi = language === 'vi';

  const handleVerify = async (codeToVerify?: string) => {
    const finalCode = (codeToVerify ?? otp).trim();
    if (finalCode.length !== 6) {
      setErrorMessage(
        isVi
          ? 'Vui lòng nhập đầy đủ 6 chữ số mã xác minh.'
          : 'Please enter all 6 digits of the verification code.'
      );
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      await authService.verifyEmail(finalCode);
      
      try {
        await refreshUser();
      } catch {
        // Ignore refresh error
      }

      setIsVerifiedSuccess(true);
      toast.success(isVi ? 'Xác thực email thành công!' : 'Email verified successfully!');
    } catch (err: unknown) {
      const errResponse = (err as { response?: { data?: { message?: string; status?: number } } })?.response;
      const msg = errResponse?.data?.message;

      if (msg?.includes('expired') || msg?.includes('hết hạn')) {
        setErrorMessage(
          isVi
            ? 'Mã xác minh đã hết hạn. Vui lòng bấm "Gửi lại mã" để nhận mã mới.'
            : 'Verification code has expired. Please click "Resend OTP" for a new one.'
        );
      } else if (msg?.includes('already verified') || msg?.includes('đã được xác minh')) {
        setIsVerifiedSuccess(true);
        toast.success(isVi ? 'Email này đã được xác thực trước đó.' : 'Email is already verified.');
      } else {
        setErrorMessage(
          msg ||
            (isVi
              ? 'Mã xác minh không chính xác. Vui lòng kiểm tra lại.'
              : 'Invalid verification code. Please try again.')
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;

    try {
      setIsResending(true);
      setErrorMessage(null);
      setSuccessNotice(null);

      await authService.resendEmailOtp();
      startCooldown(60);
      setSuccessNotice(
        isVi
          ? `Mã xác minh mới đã được gửi tới ${currentEmail}`
          : `A new verification code has been sent to ${currentEmail}`
      );
      toast.success(isVi ? 'Đã gửi lại mã OTP mới!' : 'New OTP resent successfully!');
    } catch (err: unknown) {
      const errResponse = (err as { response?: { data?: { message?: string; status?: number } } })?.response;
      if (errResponse?.data?.status === 429) {
        startCooldown(60);
        setErrorMessage(
          isVi
            ? 'Vui lòng đợi trước khi yêu cầu gửi lại mã xác minh mới.'
            : 'Please wait before requesting another verification code.'
        );
      } else {
        const msg = errResponse?.data?.message;
        setErrorMessage(
          msg || (isVi ? 'Không thể gửi lại mã lúc này. Vui lòng thử lại sau.' : 'Failed to resend code. Please try again later.')
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmailInput.trim().toLowerCase();
    
    if (!cleanEmail) {
      setNewEmailError(isVi ? 'Vui lòng nhập email mới' : 'Please enter a new email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setNewEmailError(isVi ? 'Địa chỉ email không đúng định dạng' : 'Invalid email format');
      return;
    }
    if (cleanEmail === currentEmail.toLowerCase()) {
      setNewEmailError(isVi ? 'Email mới trùng với email hiện tại' : 'New email matches current email');
      return;
    }

    setNewEmailError(null);setEmailChallenge(cleanEmail);
  };

  const handleAutoVerify = (completedOtp: string) => {
    if (!isLoading && !isVerifiedSuccess) {
      void handleVerify(completedOtp);
    }
  };

  const handleStartFresh = async () => {
    await logout();
    if (onResetAccount) {
      onResetAccount();
    } else {
      navigate('/signup');
    }
  };

  // If verified, display celebratory success state
  if (isVerifiedSuccess) {
    return (
      <div className="w-full max-w-[480px] mx-auto flex flex-col items-center text-center animate-in fade-in duration-300">
        {/* Stepper (Finished) */}
        {isSignUpFlow && (
          <div className="w-full mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight">
              {isVi ? 'Tạo tài khoản' : 'Create your account'}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#004AC6] dark:text-[#38BDF8] mt-1 uppercase tracking-wider">
              {isVi ? 'Bước 3 / 3 — Hoàn tất' : 'Step 3 of 3 — Finish'}
            </p>

            <div className="mt-5 flex items-center justify-between relative max-w-[320px] mx-auto px-2">
              <div className="absolute left-6 right-6 top-4 h-[2px] bg-[#004AC6] dark:bg-[#0095F6] z-0"></div>
              {/* Step 1 */}
              <div className="flex flex-col items-center relative z-10">
                <div className="w-8 h-8 rounded-full bg-[#004AC6] dark:bg-[#0095F6] text-white flex items-center justify-center font-bold shadow-xs">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-medium text-gray-600 dark:text-[#A8A8A8] mt-1.5">
                  {isVi ? 'Thông tin' : 'Basic info'}
                </span>
              </div>
              {/* Step 2 */}
              <div className="flex flex-col items-center relative z-10">
                <div className="w-8 h-8 rounded-full bg-[#004AC6] dark:bg-[#0095F6] text-white flex items-center justify-center font-bold shadow-xs">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-medium text-gray-600 dark:text-[#A8A8A8] mt-1.5">
                  {isVi ? 'Bảo mật' : 'Security'}
                </span>
              </div>
              {/* Step 3 */}
              <div className="flex flex-col items-center relative z-10">
                <div className="w-8 h-8 rounded-full bg-[#004AC6] dark:bg-[#0095F6] text-white flex items-center justify-center font-bold shadow-xs ring-4 ring-[#004AC6]/20">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-bold text-[#004AC6] dark:text-[#38BDF8] mt-1.5">
                  {isVi ? 'Hoàn tất' : 'Finish'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Celebration Visual */}
        <div className="relative mb-5 mt-2">
          <div className="absolute -inset-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#004AC6] to-[#2563EB] dark:from-[#0095F6] dark:to-[#38BDF8] text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <BadgeCheck className="w-10 h-10 stroke-[2.2]" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight mb-2">
          {isVi ? 'Tài khoản đã được kích hoạt! 🎉' : 'Account successfully activated! 🎉'}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] max-w-sm mb-6 leading-relaxed">
          {isVi
            ? `Chúc mừng bạn! Email ${currentEmail} đã được xác thực thành công. Bạn đã sẵn sàng kết nối cùng cộng đồng RySocial.`
            : `Congratulations! Your email ${currentEmail} has been verified. You're ready to explore the RySocial community.`}
        </p>

        {/* User Card Recap */}
        {(fullName || username) && (
          <div className="w-full bg-gray-50/80 dark:bg-[#1A1A1A] border border-gray-200/80 dark:border-[#262626] rounded-2xl p-4 mb-6 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#004AC6]/10 dark:bg-[#0095F6]/20 text-[#004AC6] dark:text-[#38BDF8] font-bold flex items-center justify-center overflow-hidden border border-gray-200 dark:border-[#333333]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName || username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base uppercase">{fullName ? fullName.charAt(0) : 'U'}</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5] leading-snug">
                  {fullName || username}
                </h4>
                {username && (
                  <p className="text-xs text-gray-500 dark:text-[#A8A8A8]">@{username.replace(/^@/, '')}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-full text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isVi ? 'Đã xác thực' : 'Verified'}</span>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="w-full space-y-3">
          <button
            type="button"
            onClick={() => navigate(onSuccessRedirect)}
            className="w-full h-12 bg-[#004AC6] hover:bg-[#003da6] active:bg-[#003185] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isVi ? 'Vào bảng tin ngay' : 'Go to Feed'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {username && (
            <button
              type="button"
              onClick={() => navigate(`/${username.replace(/^@/, '')}`)}
              className="w-full h-11 border border-gray-200 dark:border-[#333333] text-gray-700 dark:text-[#D4D4D4] hover:bg-gray-50 dark:hover:bg-[#1E1E1E] rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-gray-400 dark:text-[#737373]" />
              <span>{isVi ? 'Xem trang cá nhân của bạn' : 'View your profile'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active OTP Input State
  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col animate-in fade-in duration-200">
      {emailChallenge && <OtpActionDialog purpose="VERIFY_NEW_EMAIL" payload={{email:emailChallenge}} onClose={()=>setEmailChallenge(undefined)} onComplete={async token=>{await accountSecurity.email(emailChallenge,'',token);await logout();toast.success(isVi?'Email đã được xác minh. Vui lòng đăng nhập lại.':'Email verified. Please sign in again.');navigate('/signin',{replace:true});}} />}

      {/* Stepper Header (in SignUp flow) */}
      {isSignUpFlow && (
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight">
            {isVi ? 'Tạo tài khoản' : 'Create your account'}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[#004AC6] dark:text-[#38BDF8] mt-1 uppercase tracking-wider">
            {isVi ? 'Bước 3 / 3 — Xác thực Email' : 'Step 3 of 3 — Verify Email'}
          </p>

          <div className="mt-5 flex items-center justify-between relative max-w-[320px] mx-auto px-2">
            <div className="absolute left-6 right-6 top-4 h-[2px] bg-[#004AC6] dark:bg-[#0095F6] z-0"></div>
            {/* Step 1 */}
            <div className="flex flex-col items-center relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#004AC6] dark:bg-[#0095F6] text-white flex items-center justify-center font-bold shadow-xs">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-medium text-gray-600 dark:text-[#A8A8A8] mt-1.5">
                {isVi ? 'Thông tin' : 'Basic info'}
              </span>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#004AC6] dark:bg-[#0095F6] text-white flex items-center justify-center font-bold shadow-xs">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-medium text-gray-600 dark:text-[#A8A8A8] mt-1.5">
                {isVi ? 'Bảo mật' : 'Security'}
              </span>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center relative z-10">
              <div className="w-8 h-8 rounded-full bg-[#004AC6] dark:bg-[#0095F6] text-white flex items-center justify-center font-bold shadow-xs ring-4 ring-[#004AC6]/20">
                <span className="text-xs">3</span>
              </div>
              <span className="text-[11px] font-bold text-[#004AC6] dark:text-[#38BDF8] mt-1.5">
                {isVi ? 'Xác thực OTP' : 'OTP Code'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Icon */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-[#004AC6]/15 border border-blue-100 dark:border-[#004AC6]/30 flex items-center justify-center text-[#004AC6] dark:text-[#38BDF8] mb-3.5 shadow-2xs">
          <Mail className="w-8 h-8 stroke-[1.8]" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight">
          {isVi ? 'Kiểm tra hộp thư của bạn' : 'Check your email inbox'}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] mt-2 max-w-sm leading-relaxed">
          {isVi ? 'Chúng tôi đã gửi mã xác minh gồm 6 chữ số đến:' : 'We sent a 6-digit verification code to:'}
          <br />
          <strong className="text-gray-900 dark:text-white font-semibold text-sm">{currentEmail}</strong>
        </p>

        {/* Inline Email Edit Toggle */}
        {!isEditingEmail && (
          <button
            type="button"
            onClick={() => {
              setIsEditingEmail(true);
              setNewEmailInput(currentEmail);
              setNewEmailError(null);
            }}
            className="mt-2 text-xs font-semibold text-[#004AC6] dark:text-[#38BDF8] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isVi ? 'Đổi địa chỉ email nhận mã' : 'Change email address'}</span>
          </button>
        )}
      </div>

      {/* Inline Email Change Card (if opened) */}
      {isEditingEmail && (
        <form onSubmit={handleChangeEmailSubmit} className="mb-5 p-4 bg-blue-50/70 dark:bg-[#1E293B]/70 border border-blue-200 dark:border-[#2563EB]/40 rounded-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-[#004AC6] dark:text-[#38BDF8]" />
              <span>{isVi ? 'Đổi email nhận mã xác minh' : 'Change verification email'}</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsEditingEmail(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-[#F5F5F5]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-[#94A3B8] mb-3">
            {isVi 
              ? 'Hệ thống sẽ cập nhật email cho tài khoản này và gửi ngay mã OTP 6 số mới.'
              : 'The system will update your email and send a new 6-digit OTP code immediately.'}
          </p>

          <div className="space-y-2">
            <input
              type="email"
              value={newEmailInput}
              onChange={(e) => {
                setNewEmailInput(e.target.value);
                if (newEmailError) setNewEmailError(null);
              }}
              className="block w-full px-3 h-10 text-xs rounded-xl border border-gray-200 dark:border-[#374151] bg-white dark:bg-[#111827] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#004AC6]/20 focus:border-[#004AC6] outline-none"
              placeholder="example@gmail.com"
              required
              autoFocus
            />

            {newEmailError && (
              <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{newEmailError}</span>
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isChangingEmail || !newEmailInput.trim()}
                className="flex-1 h-9 rounded-xl bg-[#004AC6] hover:bg-[#003da6] dark:bg-[#0095F6] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {isChangingEmail ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isVi ? 'Đang cập nhật...' : 'Updating...'}</span>
                  </>
                ) : (
                  <span>{isVi ? 'Cập nhật & Gửi mã mới' : 'Update & Send OTP'}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingEmail(false)}
                className="h-9 px-3 rounded-xl border border-gray-200 dark:border-[#374151] text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E293B] cursor-pointer"
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Notice & Feedback Banners */}
      {successNotice && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium leading-relaxed">{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* 6-box OTP Input */}
      <div className="my-3">
        <label className="block text-center text-xs font-semibold text-gray-600 dark:text-[#A8A8A8] mb-3">
          {isVi ? 'Nhập mã 6 chữ số' : 'Enter 6-digit verification code'}
        </label>
        <OtpInput
          value={otp}
          onChange={(val) => {
            setOtp(val);
            if (errorMessage) setErrorMessage(null);
          }}
          onComplete={handleAutoVerify}
          hasError={Boolean(errorMessage)}
          disabled={isLoading}
        />
      </div>

      {/* Helper Box */}
      <div className="bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200/80 dark:border-[#262626] rounded-xl p-3 my-4 flex items-start gap-2 text-xs text-gray-500 dark:text-[#A8A8A8] leading-relaxed">
        <Info className="w-4 h-4 text-gray-400 dark:text-[#737373] shrink-0 mt-0.5" />
        <span>
          {isVi ? (
            <>
              Không thấy thư? Vui lòng kiểm tra thư mục <strong className="text-gray-700 dark:text-gray-300">Spam</strong> hoặc <strong className="text-gray-700 dark:text-gray-300">Thư rác</strong>. Mã có hiệu lực trong 15 phút.
            </>
          ) : (
            <>
              Didn't receive the email? Check your <strong className="text-gray-700 dark:text-gray-300">Spam</strong> or <strong className="text-gray-700 dark:text-gray-300">Junk</strong> folder. The code expires in 15 minutes.
            </>
          )}
        </span>
      </div>

      {/* Submit Button */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={isLoading || otp.trim().length !== 6}
          className={clsx(
            'w-full h-12 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer',
            isLoading || otp.trim().length !== 6
              ? 'bg-gray-200 dark:bg-[#262626] text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
              : 'bg-[#004AC6] hover:bg-[#003da6] active:bg-[#003185] dark:bg-[#0095F6] dark:hover:bg-[#1877F2]'
          )}
        >
          {isLoading ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>{isVi ? 'Đang xác minh...' : 'Verifying...'}</span>
            </>
          ) : (
            <>
              <span>{isVi ? 'Xác minh ngay' : 'Verify now'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Resend OTP Row & Start Fresh Option */}
        <div className="flex items-center justify-between pt-2 px-1 text-xs">
          <button
            type="button"
            onClick={handleStartFresh}
            className="text-gray-500 dark:text-[#A8A8A8] hover:text-red-600 dark:hover:text-red-400 font-medium flex items-center gap-1 transition-colors cursor-pointer"
            title={isVi ? 'Hủy phiên đăng ký này để đăng ký tài khoản khác từ đầu' : 'Cancel this session to start fresh'}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isSignUpFlow ? (isVi ? 'Đăng ký tài khoản khác' : 'Register another') : (isVi ? 'Đổi tài khoản' : 'Switch account')}</span>
          </button>

          <div>
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-[#004AC6] dark:text-[#38BDF8] font-semibold hover:underline flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isVi ? 'Đang gửi...' : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{isVi ? 'Gửi lại mã OTP' : 'Resend OTP'}</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-gray-400 dark:text-[#737373] flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {isVi ? 'Gửi lại mã sau' : 'Resend in'}{' '}
                  <strong className="text-gray-700 dark:text-[#D4D4D4] font-semibold font-mono">
                    {secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}s
                  </strong>
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationStep;
