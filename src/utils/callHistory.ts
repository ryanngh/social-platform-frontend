import type { CallSummary } from '../types/call';
export function callPreview(call: CallSummary, userId: string, t: (key: string) => string) {
  return t('calls.' + call.type) + ' · ' + t('calls.' + (call.caller_id === userId ? 'outgoing' : 'received')) + ' · ' + t('calls.errors.' + call.reason);
}
export function callDuration(call: CallSummary) {
  if (typeof call.duration_seconds === 'number') return Math.max(0, call.duration_seconds);
  return call.connected_at && call.ended_at ? Math.max(0, Math.floor((new Date(call.ended_at).getTime() - new Date(call.connected_at).getTime()) / 1000)) : 0;
}
