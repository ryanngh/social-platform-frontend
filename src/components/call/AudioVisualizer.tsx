import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isSpeaking?: boolean;
  isMuted?: boolean;
  color?: string;
  barCount?: number;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isSpeaking = false,
  isMuted = false,
  color = '#0095F6',
  barCount = 28,
  className = 'h-16 w-full max-w-[280px]',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const spacing = width / barCount;
      const barWidth = Math.max(3, spacing * 0.55);

      for (let i = 0; i < barCount; i++) {
        let barHeight = 6;

        if (isMuted) {
          barHeight = 4;
        } else if (isSpeaking) {
          // Dynamic wave formula with harmonious frequencies
          const sin1 = Math.sin(phase * 0.08 + i * 0.3);
          const sin2 = Math.cos(phase * 0.05 + i * 0.2);
          const sin3 = Math.sin(phase * 0.12 - i * 0.15);
          const factor = Math.abs((sin1 + sin2 + sin3) / 3);
          
          // Bell curve shaping towards the center
          const centerDist = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
          barHeight = 8 + factor * (height - 12) * Math.max(0.3, centerDist);
        } else {
          // Subtle idle ambient pulse
          const sin = Math.sin(phase * 0.03 + i * 0.15);
          barHeight = 6 + Math.abs(sin) * 8;
        }

        const x = i * spacing + (spacing - barWidth) / 2;
        const y = (height - barHeight) / 2;

        // Gradient bar
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isMuted) {
          gradient.addColorStop(0, 'rgba(156, 163, 175, 0.4)');
          gradient.addColorStop(1, 'rgba(107, 114, 128, 0.2)');
        } else if (isSpeaking) {
          gradient.addColorStop(0, '#38BDF8');
          gradient.addColorStop(0.5, color);
          gradient.addColorStop(1, '#6366F1');
        } else {
          gradient.addColorStop(0, 'rgba(0, 149, 246, 0.6)');
          gradient.addColorStop(1, 'rgba(0, 74, 198, 0.3)');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        ctx.fill();
      }

      phase += isSpeaking ? 1.5 : 0.6;
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpeaking, isMuted, color, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={64}
      className={`mx-auto select-none pointer-events-none ${className}`}
    />
  );
};

export default AudioVisualizer;
