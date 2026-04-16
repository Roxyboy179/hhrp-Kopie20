'use client';

import { useEffect, useState } from 'react';
import { Clock, CheckCircle } from 'lucide-react';

export function Countdown({ targetTimestamp, label, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const target = targetTimestamp;
      const diff = target - now;

      if (diff <= 0) {
        setIsAvailable(true);
        setTimeLeft(null);
        if (onComplete) onComplete();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
      setIsAvailable(false);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetTimestamp, onComplete]);

  if (isAvailable) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Jetzt verfügbar!</span>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 text-white/40">
        <Clock className="w-4 h-4" />
        <span className="text-sm">Lädt...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-orange-400">
      <Clock className="w-4 h-4" />
      <span className="text-sm font-medium tabular-nums">
        {timeLeft.hours > 0 && `${timeLeft.hours}h `}
        {timeLeft.minutes}min {timeLeft.seconds}s
      </span>
    </div>
  );
}
