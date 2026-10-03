export const formatCallDuration = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return (s >= 3600 ? String(Math.floor(s / 3600)).padStart(2, '0') + ':' : '') +
    String(Math.floor(s / 60) % 60).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};
