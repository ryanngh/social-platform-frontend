import { useEffect, useRef } from 'react';
export default function CallVideo({ stream, className = '' }: { stream: MediaStream; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => { const element = video.current; if (element) { element.srcObject = stream; void element.play().catch(() => {}); } return () => { if (element) element.srcObject = null; }; }, [stream]);
  return <video ref={video} autoPlay playsInline muted className={className} />;
}

