import React, { useRef, useEffect, useState } from 'react';
import clsx from 'clsx';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
}) => {
  const [digits, setDigits] = useState<string[]>(() => {
    const arr = Array(length).fill('');
    const chars = value.replace(/\D/g, '').slice(0, length).split('');
    chars.forEach((c, i) => {
      arr[i] = c;
    });
    return arr;
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Synchronize internal digits with external value
  useEffect(() => {
    const chars = value.replace(/\D/g, '').slice(0, length).split('');
    const newDigits = Array(length).fill('');
    chars.forEach((c, i) => {
      newDigits[i] = c;
    });
    setDigits(newDigits);
  }, [value, length]);

  // Initial focus
  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Extract only digits
    const cleaned = rawVal.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      const combined = next.join('');
      onChange(combined);
      return;
    }

    // Take the last character typed into this box
    const lastChar = cleaned.slice(-1);
    const next = [...digits];
    next[index] = lastChar;
    setDigits(next);

    const combined = next.join('');
    onChange(combined);

    // If filled, move to next input
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // If fully filled
    if (combined.length === length && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        onChange(next.join(''));
        inputRefs.current[index - 1]?.focus();
      } else if (digits[index]) {
        // Clear current
        const next = [...digits];
        next[index] = '';
        setDigits(next);
        onChange(next.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const matched = pasted.replace(/\D/g, '').slice(0, length);
    if (!matched) return;

    const next = Array(length).fill('');
    matched.split('').forEach((c, i) => {
      next[i] = c;
    });
    setDigits(next);

    const combined = next.join('');
    onChange(combined);

    const targetIdx = Math.min(matched.length, length - 1);
    inputRefs.current[targetIdx]?.focus();

    if (combined.length === length && onComplete) {
      onComplete(combined);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" role="group" aria-label="OTP verification code input">
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            value={digits[index] || ''}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={clsx(
              'w-11 sm:w-13 h-13 sm:h-14 text-center text-2xl font-bold rounded-xl transition-all select-none',
              'bg-slate-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-[#F5F5F5]',
              'border outline-none focus:bg-white dark:focus:bg-[#121212]',
              hasError
                ? 'border-red-400 dark:border-red-500/80 text-red-600 dark:text-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                : isFilled
                ? 'border-[#004AC6] dark:border-[#38BDF8] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20'
                : 'border-gray-200 dark:border-[#374151] focus:border-[#004AC6] dark:focus:border-[#38BDF8] focus:ring-2 focus:ring-[#004AC6]/20 dark:focus:ring-[#38BDF8]/20',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        );
      })}
    </div>
  );
};

export default OtpInput;
