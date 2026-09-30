import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'rysocial_otp_resend_cooldown_expiry';

export const useResendCooldown = (cooldownSeconds: number = 60) => {
  const calculateRemaining = (): number => {
    try {
      const storedExpiry = sessionStorage.getItem(STORAGE_KEY);
      if (!storedExpiry) return 0;
      const expiryTime = parseInt(storedExpiry, 10);
      const now = Date.now();
      if (isNaN(expiryTime) || now >= expiryTime) {
        sessionStorage.removeItem(STORAGE_KEY);
        return 0;
      }
      return Math.ceil((expiryTime - now) / 1000);
    } catch {
      return 0;
    }
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(calculateRemaining);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          sessionStorage.removeItem(STORAGE_KEY);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const startCooldown = useCallback((customSeconds?: number) => {
    const seconds = customSeconds ?? cooldownSeconds;
    const expiryTime = Date.now() + seconds * 1000;
    try {
      sessionStorage.setItem(STORAGE_KEY, expiryTime.toString());
    } catch {
      // Ignore sessionStorage issues
    }
    setSecondsLeft(seconds);
  }, [cooldownSeconds]);

  const resetCooldown = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setSecondsLeft(0);
  }, []);

  return {
    canResend: secondsLeft === 0,
    secondsLeft,
    startCooldown,
    resetCooldown,
  };
};
