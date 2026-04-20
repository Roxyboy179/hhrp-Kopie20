'use client';

import { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';
import { formatPromoDate, getPromoCountdown } from '@/lib/shop-promotions';

/**
 * Wiederverwendbares Rabatt-Aktions-Banner mit Live-Countdown und
 * Slider-Rotation, wenn mehrere Aktionen aktiv sind.
 *
 * Props:
 *  - promo:  einzelnes Aktions-Objekt  (für Abwärtskompatibilität)
 *  - promos: Array von Aktions-Objekten (hat Vorrang vor `promo`)
 *  - variant: 'shop' (default) | 'landing'
 *  - onClick: optionaler Click-Handler
 *  - rotateInterval: ms zwischen Slide-Wechseln (default 5000)
 */
export function PromoBanner({
  promo,
  promos,
  variant = 'shop',
  onClick,
  rotateInterval = 5000,
}) {
  // Normalisiere: arbeiten intern immer mit einem Array
  const list = Array.isArray(promos) && promos.length > 0
    ? promos
    : (promo ? [promo] : []);

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fadeKey, setFadeKey] = useState(0); // triggert Fade-Animation bei Wechsel
  const timerRef = useRef(null);

  // Wenn Liste sich ändert, Index resetten (falls z.B. eine Promo abläuft)
  useEffect(() => {
    if (index >= list.length) setIndex(0);
  }, [list.length, index]);

  // Auto-Rotation
  useEffect(() => {
    if (list.length <= 1 || isPaused) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % list.length);
      setFadeKey((k) => k + 1);
    }, rotateInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [list.length, isPaused, rotateInterval]);

  const currentPromo = list[index] || list[0];

  // Live-Countdown (tickt alle 30s)
  const [countdown, setCountdown] = useState(() => getPromoCountdown(currentPromo));
  useEffect(() => {
    if (!currentPromo) return;
    setCountdown(getPromoCountdown(currentPromo));
    const id = setInterval(() => {
      setCountdown(getPromoCountdown(currentPromo));
    }, 30 * 1000);
    return () => clearInterval(id);
  }, [currentPromo]);

  if (!currentPromo) return null;
  if (countdown?.expired) return null;

  const isLanding = variant === 'landing';
  const clickable = typeof onClick === 'function';
  const hasMultiple = list.length > 1;

  // Countdown-Text
  const renderCountdown = () => {
    if (!countdown) return null;
    const { days, hours, minutes } = countdown;
    let mainText = '';
    if (days > 1) mainText = `endet in ${days} Tagen`;
    else if (days === 1) mainText = `endet in 1 Tag ${hours}h`;
    else if (hours > 1) mainText = `endet in ${hours} Stunden`;
    else if (hours === 1) mainText = `endet in 1h ${minutes}m`;
    else if (minutes > 1) mainText = `endet in ${minutes} Minuten`;
    else mainText = 'endet gleich!';
    return (
      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-amber-300">
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        <span>⏳ {mainText}</span>
      </div>
    );
  };

  const goToSlide = (e, i) => {
    e.stopPropagation();
    setIndex(i);
    setFadeKey((k) => k + 1);
  };

  const handleKeyNav = (e) => {
    if (!hasMultiple) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setIndex((p) => (p - 1 + list.length) % list.length);
      setFadeKey((k) => k + 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setIndex((p) => (p + 1) % list.length);
      setFadeKey((k) => k + 1);
    } else if (clickable && e.key === 'Enter') {
      onClick();
    }
  };

  return (
    <div
      onClick={clickable ? onClick : undefined}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role={clickable ? 'button' : 'region'}
      aria-roledescription={hasMultiple ? 'carousel' : undefined}
      aria-label={hasMultiple ? `Aktuelle Aktionen (${list.length} aktiv)` : currentPromo.title}
      tabIndex={clickable || hasMultiple ? 0 : undefined}
      onKeyDown={handleKeyNav}
      className={`relative p-5 pb-${hasMultiple ? '9' : '5'} rounded-xl border backdrop-blur-sm overflow-hidden ${
        clickable ? 'cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]' : ''
      }`}
      style={{
        background:
          'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(236, 72, 153, 0.14), rgba(168, 85, 247, 0.12))',
        borderColor: 'rgba(245, 158, 11, 0.45)',
        boxShadow: '0 0 24px rgba(245, 158, 11, 0.15)',
        paddingBottom: hasMultiple ? '2.5rem' : undefined,
      }}
    >
      {/* Dekorativer Glow */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-30 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(245, 158, 11, 0.6), transparent 70%)',
        }}
      />

      {/* Slide-Content mit Fade-Animation bei Wechsel */}
      <div
        key={fadeKey}
        className="relative flex items-start gap-4 flex-wrap sm:flex-nowrap animate-fade-in-up"
        style={{ animationDuration: '0.45s' }}
      >
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl shrink-0"
          style={{
            background: 'rgba(245, 158, 11, 0.25)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
          }}
        >
          {currentPromo.icon || '🎉'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md"
              style={{
                background: 'rgba(245, 158, 11, 0.3)',
                color: '#FCD34D',
                border: '1px solid rgba(245, 158, 11, 0.5)',
              }}
            >
              🔥 Limitierte Aktion
            </span>
            {!isLanding && (
              <span
                className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md"
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#6EE7B7',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                ✓ Automatisch aktiv
              </span>
            )}
            {renderCountdown()}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white mb-1 leading-tight">
            {currentPromo.title}
          </h3>
          <p className="text-sm text-white/80 mb-2">
            {currentPromo.description}
          </p>

          <div className="flex items-center gap-2 text-xs text-white/60 flex-wrap">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Gültig vom{' '}
              <span className="text-white font-medium">
                {formatPromoDate(currentPromo.startDate)}
              </span>{' '}
              bis{' '}
              <span className="text-white font-medium">
                {formatPromoDate(currentPromo.endDate)}
              </span>
            </span>
            {currentPromo.eligibility === 'non_vip' && (
              <>
                <span className="opacity-50">•</span>
                <span>Nur für Nutzer ohne VIP / Luxus-Pass</span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div
            className="text-3xl sm:text-4xl font-black leading-none"
            style={{
              background:
                'linear-gradient(135deg, #FCD34D, #F59E0B, #EC4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            -{Math.round(currentPromo.discount * 100)}%
          </div>
          <div className="text-[10px] text-white/50 uppercase tracking-wider mt-1">
            Rabatt
          </div>
          {isLanding && clickable && (
            <div className="text-[10px] text-amber-300 uppercase tracking-wider mt-2 font-semibold">
              Zum Shop →
            </div>
          )}
        </div>
      </div>

      {/* Slider-Navigation: Dots + Counter unten mittig */}
      {hasMultiple && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {list.map((p, i) => (
              <button
                key={p.id || i}
                type="button"
                onClick={(e) => goToSlide(e, i)}
                aria-label={`Zu Aktion ${i + 1} wechseln: ${p.title}`}
                aria-current={i === index ? 'true' : 'false'}
                className={`transition-all duration-300 rounded-full ${
                  i === index
                    ? 'w-8 h-2'
                    : 'w-2 h-2 hover:w-3'
                }`}
                style={{
                  background: i === index
                    ? 'linear-gradient(90deg, #FCD34D, #F59E0B, #EC4899)'
                    : 'rgba(255, 255, 255, 0.25)',
                  boxShadow: i === index ? '0 0 10px rgba(245, 158, 11, 0.5)' : undefined,
                }}
              />
            ))}
          </div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium pointer-events-none">
            {index + 1} / {list.length}
          </div>
        </div>
      )}

      {/* Pause-Indikator (nur sichtbar wenn User hovert und es mehr als 1 Aktion gibt) */}
      {hasMultiple && isPaused && (
        <div
          className="absolute top-2 right-2 text-[10px] text-white/40 uppercase tracking-wider font-medium pointer-events-none"
          style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          ⏸ pausiert
        </div>
      )}
    </div>
  );
}
