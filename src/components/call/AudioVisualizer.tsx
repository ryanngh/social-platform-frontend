import { useEffect, useRef } from 'react';
export default function AudioVisualizer({ stream, isMuted = false, className = 'h-12 w-full' }: { stream?: MediaStream | null; isMuted?: boolean; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current, ctx = element?.getContext('2d');
    if (!element || !ctx) return;
    if (!stream?.getAudioTracks().length || isMuted) { ctx.clearRect(0, 0, element.width, element.height); return; }
    const audio = new AudioContext(), analyser = audio.createAnalyser();
    analyser.fftSize = 256;
    const source = audio.createMediaStreamSource(stream); source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    const paint = () => {
      analyser.getByteFrequencyData(data); ctx.clearRect(0, 0, element.width, element.height);
      ctx.fillStyle = '#0095F6';
      for (let i = 0; i < 28; i++) { const level = data[Math.floor(i * data.length / 28)] / 255; const height = Math.max(2, level * element.height); ctx.fillRect(i * element.width / 28, (element.height - height) / 2, element.width / 40, height); }
      frame = requestAnimationFrame(paint);
    };
    void audio.resume().catch(() => {}); paint();
    return () => { cancelAnimationFrame(frame); source.disconnect(); analyser.disconnect(); void audio.close(); };
  }, [stream, isMuted]);
  return <canvas ref={canvas} width={280} height={48} aria-hidden="true" className={className} />;
}
