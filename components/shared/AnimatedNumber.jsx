'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * AnimatedNumber – Counter-Up Animation
 * - Lädt Zahl von 0 → target innerhalb `duration` ms
 * - Respektiert `hhrp-fx-anim-numbers` am Root (wenn Klasse fehlt → sofort Endwert)
 * - formatter: optionale Formatierungsfunktion (z.B. Intl.NumberFormat)
 */
export function AnimatedNumber({
  value = 0,
  duration = 900,
  formatter = (n) => Math.round(n).toLocaleString('de-DE'),
  prefix = '',
  suffix = '',
  className = '',
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    // Animationen deaktiviert? → sofort Endwert
    const root = document.querySelector('.hhrp-fx-anim-numbers');
    const noAnim = document.querySelector('.hhrp-no-anim');
    if (!root || noAnim) {
      setDisplay(value);
      return;
    }

    fromRef.current = display;
    startRef.current = null;

    const step = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span className={`animated-number tabular-nums ${className}`}>
      {prefix}{formatter(display)}{suffix}
    </span>
  );
}

export default AnimatedNumber;
