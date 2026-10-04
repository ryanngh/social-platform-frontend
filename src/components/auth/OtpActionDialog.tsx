import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { accountSecurity, securityError, type SecurityPurpose } from '../../services/accountSecurity';
export default function OtpActionDialog({ purpose, payload, email, recoveryToken, onComplete, onClose }: {
  purpose: SecurityPurpose; payload: Record<string, unknown>; email?: string; recoveryToken?: string;
  onComplete: (token: string) => Promise<void>; onClose: () => void;
}) {
  const { language } = useLanguage(); const text = (vi: string, en: string) => language === 'vi' ? vi : en;
  const [grant, setGrant] = useState<string>(); const [challenge, setChallenge] = useState<string>(); const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [cooldown, setCooldown] = useState(0);
  const panel = useRef<HTMLDivElement>(null); const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => { previousFocus.current = document.activeElement as HTMLElement; panel.current?.querySelector<HTMLButtonElement>('button')?.focus(); return () => previousFocus.current?.focus(); }, []);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(n => n - 1), 1000); return () => clearTimeout(timer); }, [cooldown]);
  const send = async () => { setBusy(true); setError(''); try { const result = await accountSecurity.request(purpose, payload, email, recoveryToken); setChallenge(result.challengeId); setGrant(undefined); setCode(''); setCooldown(result.resendAfterSeconds); } catch (e) { setError(securityError(e)); } finally { setBusy(false); } };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!challenge) return; setBusy(true); setError(''); try { const token = grant || await accountSecurity.verify(challenge, code); setGrant(token); await onComplete(token); } catch (e) { setError(securityError(e)); setCode(''); } finally { setBusy(false); } };
  return <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onKeyDown={event => {
    if (event.key === 'Escape' && !busy) onClose();
    if (event.key === 'Tab') { const nodes = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)'); if (!nodes?.length) return; const first = nodes[0], last = nodes[nodes.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
  }}><div ref={panel} role="dialog" aria-modal="true" aria-labelledby="otp-action-title" className="w-full max-w-md bg-white dark:bg-[#171717] text-gray-900 dark:text-white rounded-2xl p-6 shadow-xl space-y-4">
    <h2 id="otp-action-title" className="text-xl font-bold">{text('Xác nhận qua email', 'Verify by email')}</h2>
    <p>{purpose === 'RESET_PASSWORD' ? text('Nếu tài khoản đủ điều kiện, mã xác nhận sẽ được gửi tới email đã nhập. Mã có hiệu lực 15 phút.', 'If the account is eligible, a code will be sent to the email you entered. It expires in 15 minutes.') : purpose === 'VERIFY_NEW_EMAIL' ? text('Gửi mã tới email mới để xác nhận quyền sở hữu.', 'Send a code to your new email to confirm ownership.') : text('Mã xác nhận sẽ được gửi tới email tài khoản. Mã có hiệu lực 15 phút.', 'A code will be sent to your account email. It expires in 15 minutes.')}</p>
    {error && <p role="alert" className="text-red-600 dark:text-red-400">{error}</p>}
    <button type="button" disabled={busy || cooldown > 0} onClick={() => void send()} className="security-button">{cooldown ? `${text('Gửi lại sau', 'Resend in')} ${cooldown}s` : challenge ? text('Gửi lại mã', 'Resend code') : text('Gửi mã xác nhận', 'Send code')}</button>
    {challenge && <form onSubmit={submit} className="space-y-4"><label className="block">{text('Mã OTP', 'OTP code')}<input autoFocus autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} required={!grant} className="security-input mt-2" /></label><button disabled={busy || !grant && code.length !== 6} className="security-button">{busy ? text('Đang xác nhận…', 'Verifying…') : text('Xác nhận thao tác', 'Confirm action')}</button></form>}
    <button disabled={busy} type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600">{text('Hủy', 'Cancel')}</button>
  </div></div>;
}
