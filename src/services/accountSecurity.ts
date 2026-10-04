import api from '../lib/axios';
export type SecurityPurpose = 'CHANGE_PASSWORD' | 'CHANGE_EMAIL' | 'VERIFY_NEW_EMAIL' | 'DEACTIVATE' | 'DELETE_ACCOUNT' | 'RESTORE_ACCOUNT' | 'LOGOUT_ALL' | 'PROFILE_PRIVACY' | 'RESET_PASSWORD';
export type PrivacyLevel = 'PUBLIC' | 'MUTUAL' | 'PRIVATE';
export type ProfilePrivacy = Record<'posts' | 'replies' | 'reposts' | 'media' | 'likes', PrivacyLevel>;
export interface RecoverySession { recoveryToken: string; status: string; deletionScheduledAt: string | null }
export interface FoundAccount {
  email: string;
  maskedEmail: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
}
export const accountSecurity = {
  async findAccount(identifier: string) {
    return (await api.post<FoundAccount>('/auth/find-account', { email: identifier.trim() })).data;
  },
  async request(purpose: SecurityPurpose, payload: Record<string, unknown>, email?: string, recoveryToken?: string) {
    return (await api.post<{ challengeId: string; expiresAt: string; resendAfterSeconds: number }>('/auth/otp-challenges', { purpose, payload, email, recoveryToken })).data;
  },
  async verify(id: string, code: string) { return (await api.post<{ actionToken: string }>(`/auth/otp-challenges/${id}/verify`, { code })).data.actionToken; },
  async password(password: string, token: string, reset = false) { await api.post(reset ? '/auth/reset-password' : '/auth/change-password', { password }, { headers: { 'X-Action-Token': token } }); },
  async email(email: string, oldToken: string, newToken: string) { await api.post('/auth/change-email', { email }, { headers: { 'X-Action-Token': oldToken, 'X-New-Email-Token': newToken } }); },
  async privacy(privacy: ProfilePrivacy, token: string) { await api.put('/users/me/privacy', privacy, { headers: { 'X-Action-Token': token } }); },
  async action(purpose: SecurityPurpose, token: string, recoveryToken?: string) {
    const options = { headers: { 'X-Action-Token': token, ...(recoveryToken ? { 'X-Recovery-Token': recoveryToken } : {}) } };
    if (purpose === 'DELETE_ACCOUNT') await api.delete('/users/me', options);
    else await api.post(purpose === 'DEACTIVATE' ? '/users/me/deactivate' : purpose === 'RESTORE_ACCOUNT' ? '/auth/restore-account' : '/auth/logout-all', {}, options);
  },
};
export const securityError = (error: unknown): string => {
  const value = error as { response?: { data?: { message?: string } }; message?: string };
  const message=value.response?.data?.message || value.message || 'Please try again.';
  const vi=typeof localStorage!=='undefined' && (localStorage.getItem('rysocial_language') || (navigator.language.startsWith('en')?'en':'vi'))==='vi';
  const translations:Record<string,string>={'Account not found':'Không tìm thấy tài khoản với thông tin này.','Identifier is required':'Vui lòng nhập email để tìm kiếm.','Invalid or expired code':'Mã xác nhận không đúng hoặc đã hết hạn.','OTP_REQUIRED':'Vui lòng xác minh OTP cho đúng thao tác.','Please wait before requesting another code':'Vui lòng chờ trước khi yêu cầu mã mới.','Too many OTP requests':'Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau.','Too many requests':'Bạn đã thử quá nhiều lần. Vui lòng quay lại sau.','Recovery session expired':'Phiên khôi phục đã hết hạn. Vui lòng đăng nhập lại.','Account cannot be restored':'Tài khoản không thể khôi phục.','Account is inactive':'Tài khoản không hoạt động.','Email already in use':'Email đã được sử dụng.','Unable to send verification email':'Không thể gửi email xác minh. Vui lòng thử lại.','Please try again.':'Vui lòng thử lại.','Password must be between 8 and 72 bytes':'Mật khẩu phải từ 8 ký tự và không quá 72 byte.'};
  return vi ? translations[message] || message : message;
};
