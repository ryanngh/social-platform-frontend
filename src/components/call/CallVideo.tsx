import { useEffect, useRef } from 'react';

export default function CallVideo({
  stream,
  className = '',
  mirrored = false,
}: {
  stream: MediaStream;
  className?: string;
  mirrored?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (element) {
      element.srcObject = stream;
      void element.play().catch(() => {});
    }
    return () => {
      if (element) element.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={video}
      autoPlay
      playsInline
      muted
      className={`${className} ${mirrored ? '-scale-x-100' : ''}`}
    />
  );
}
