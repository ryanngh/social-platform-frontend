/**
 * Web Audio API Call Sound Synthesizer
 * Provides realistic, gentle phone ringtones, outgoing dial beeps, connect chimes, and hang up tones.
 */

let audioCtx: AudioContext | null = null;
let ringtoneInterval: number | null = null;
let dialtoneInterval: number | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }

  return audioCtx;
}

/**
 * Play Outgoing Dial Tone (Beep... Beep... melody)
 */
export function startOutgoingDialTone(): void {
  stopCallSounds();

  const playBeep = () => {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now); // A4
      osc2.frequency.setValueAtTime(480, now); // Dialtone harmony

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  playBeep();
  ringtoneInterval = window.setInterval(playBeep, 2800);
}

/**
 * Play Incoming Ringtone (Pleasant rhythmic chime melody)
 */
export function startIncomingRingtone(): void {
  stopCallSounds();

  const playChimeSequence = () => {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, time: 0 },    // C5
        { freq: 659.25, time: 0.15 }, // E5
        { freq: 783.99, time: 0.3 },  // G5
        { freq: 1046.5, time: 0.45 }, // C6
        { freq: 880.0, time: 0.75 },  // A5
        { freq: 783.99, time: 0.9 },  // G5
      ];

      notes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.12, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + 0.35);
      });
    } catch {
      // Autoplay fallback
    }
  };

  playChimeSequence();
  ringtoneInterval = window.setInterval(playChimeSequence, 2400);
}

/**
 * Play Call Connected Chime (Upbeat short sparkle)
 */
export function playCallConnectedSound(): void {
  stopCallSounds();
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  } catch {
    //
  }
}

/**
 * Play Call Ended Sound (Gentle descent tone)
 */
export function playCallEndedSound(): void {
  stopCallSounds();
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    //
  }
}

/**
 * Stop all ongoing call sounds
 */
export function stopCallSounds(): void {
  if (ringtoneInterval !== null) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
  if (dialtoneInterval !== null) {
    clearInterval(dialtoneInterval);
    dialtoneInterval = null;
  }
}
