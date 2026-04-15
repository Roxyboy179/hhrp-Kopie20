'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * AnimatedValue - Zeigt einen animierten Wert mit +/- Differenz
 * @param {number} value - Der aktuelle Wert
 * @param {string} prefix - Präfix (z.B. "€" oder "Level ")
 * @param {string} suffix - Suffix (z.B. " XP")
 * @param {string} storageKey - LocalStorage Key um alten Wert zu speichern
 * @param {string} className - Zusätzliche CSS Klassen
 */
export default function AnimatedValue({ 
  value, 
  prefix = '', 
  suffix = '', 
  storageKey, 
  className = '' 
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [difference, setDifference] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValueRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // Lade vorherigen Wert aus localStorage
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        previousValueRef.current = parseFloat(stored);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    const oldValue = previousValueRef.current;
    const newValue = value;

    // Wenn kein alter Wert existiert, setze einfach den neuen Wert
    if (oldValue === null || oldValue === undefined) {
      setDisplayValue(newValue);
      previousValueRef.current = newValue;
      if (storageKey && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newValue.toString());
      }
      return;
    }

    // Berechne Differenz
    const diff = newValue - oldValue;

    // Wenn keine Änderung, mache nichts
    if (diff === 0) {
      return;
    }

    // Zeige +/- Animation
    setDifference(diff);
    setIsAnimating(true);

    // Counter Animation (hochzählen)
    const duration = 2000; // 2 Sekunden
    const startTime = Date.now();
    const startValue = oldValue;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (diff * easeProgress);
      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(newValue);
        setIsAnimating(false);
        
        // Nach 1 Sekunde, entferne die +/- Anzeige
        setTimeout(() => {
          setDifference(null);
        }, 1000);

        // Speichere neuen Wert
        previousValueRef.current = newValue;
        if (storageKey && typeof window !== 'undefined') {
          localStorage.setItem(storageKey, newValue.toString());
        }
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, storageKey]);

  const formatValue = (val) => {
    return `${prefix}${Math.round(val).toLocaleString()}${suffix}`;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Haupt-Wert */}
      <span className={`transition-all duration-300 ${isAnimating ? 'scale-105' : ''}`}>
        {formatValue(displayValue)}
      </span>

      {/* +/- Differenz Animation */}
      {difference !== null && (
        <div 
          className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 pointer-events-none animate-float-up"
          style={{
            animation: 'floatUp 3s ease-out forwards'
          }}
        >
          <div className={`
            px-2 sm:px-3 py-1 rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap
            ${difference > 0 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/20' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/20'
            }
          `}>
            {difference > 0 ? '+' : ''}{formatValue(Math.abs(difference))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translate(-50%, 0px);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -10px);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, -30px);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50px);
          }
        }
      `}</style>
    </div>
  );
}
