'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Clock,
  Flame,
  CheckCircle2,
  Pause,
  Car,
  Gem,
  Gift,
  Sparkles,
  Ticket,
  Tag,
  Percent,
  Coins,
} from 'lucide-react';
import { formatPromoDate, getPromoCountdown } from '@/lib/shop-promotions';

// Icon-Auflösung: Name → Lucide-Komponente.
// `SHOP_PROMOTIONS` referenziert Icons per String (damit die Lib
// sowohl im Backend (route.js) als auch im Frontend importierbar
// bleibt, ohne lucide-react im Backend mitzuschleppen).
const PROMO_ICON_MAP = {
  Car,
  Gem,
  Gift,
  Sparkles,
  Ticket,
  Tag,
  Percent,
  Flame,
  Coins,
};
const resolveIcon = (iconName) => PROMO_ICON_MAP[iconName] || Tag;

/**
 * Wiederverwendbares Rabatt-Aktions-Banner mit Live-Countdown und
 * Slider-Rotation, wenn mehrere Aktionen aktiv sind.
 *
 * Props:
 *  - promo:   einzelnes Aktions-Objekt  (für Abwärtskompatibilität)
 *  - promos:  Array von Aktions-Objekten (hat Vorrang vor `promo`)
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
  const list = Array.isArray(promos) && promos.length > 0
    ? promos
    : (promo ? [promo] : []);

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (index >= list.length) setIndex(0);
  }, [list.length, index]);

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

  const CurrentIcon = resolveIcon(currentPromo.iconName);

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
      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-amber-300 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        <span>{mainText}</span>
      </div>
    );
  };

  const goToSlide = (e, i) => {
    e.stopPropagation();
    setIndex(i);
    setFadeKey((k) => k + 1);
  };

  const handleKeyNav = (e) => {
    if (!hasMultiple) {
      if (clickable && e.key === 'Enter') onClick();
      return;
    }
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
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      role={clickable ? 'button' : 'region'}
      aria-roledescription={hasMultiple ? 'carousel' : undefined}
      aria-label={hasMultiple ? `Aktuelle Aktionen (${list.length} aktiv)` : currentPromo.title}
      tabIndex={clickable || hasMultiple ? 0 : undefined}
      onKeyDown={handleKeyNav}
      className={`relative p-3.5 sm:p-5 rounded-xl border backdrop-blur-sm overflow-hidden ${
        hasMultiple ? 'pb-9 sm:pb-10' : ''
      } ${
        clickable ? 'cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]' : ''
      }`}
      style={{
        background:
          'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(236, 72, 153, 0.14), rgba(168, 85, 247, 0.12))',
        borderColor: 'rgba(245, 158, 11, 0.45)',
        boxShadow: '0 0 24px rgba(245, 158, 11, 0.15)',
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

      {/* ══════════════════════════════════════════════════════════════
          SLIDE-CONTENT mit Fade-Animation bei Wechsel
          Mobile: gestapelt (Spalte)   Desktop: 3-spaltig
          ══════════════════════════════════════════════════════════════ */}
      <div
        key={fadeKey}
        className="relative animate-fade-in-up"
        style={{ animationDuration: '0.45s' }}
      >
        {/* ─── MOBILE-Header: Icon + Titel + Rabatt-Prozent in einer Zeile ─── */}
        <div className="flex items-center gap-3 mb-2 sm:hidden">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
            style={{
              background: 'rgba(245, 158, 11, 0.25)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
            }}
          >
            <CurrentIcon className="w-5 h-5 text-amber-200" strokeWidth={2.2} />
          </div>
          <h3 className="flex-1 min-w-0 text-[15px] font-bold text-white leading-tight break-words">
            {currentPromo.title}
          </h3>
          <div className="shrink-0 text-right">
            <div
              className="text-2xl font-black leading-none"
              style={{
                background: 'linear-gradient(135deg, #FCD34D, #F59E0B, #EC4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              -{Math.round(currentPromo.discount * 100)}%
            </div>
          </div>
        </div>

        {/* ─── DESKTOP-Layout: klassisch 3-spaltig ─── */}
        <div className="hidden sm:flex items-start gap-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
            style={{
              background: 'rgba(245, 158, 11, 0.25)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
            }}
          >
            <CurrentIcon className="w-6 h-6 text-amber-200" strokeWidth={2.2} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md"
                style={{
                  background: 'rgba(245, 158, 11, 0.3)',
                  color: '#FCD34D',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                }}
              >
                <Flame className="w-3 h-3" strokeWidth={2.5} />
                Limitierte Aktion
              </span>
              {!isLanding && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md"
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#6EE7B7',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                  Automatisch aktiv
                </span>
              )}
              {renderCountdown()}
            </div>

            <h3 className="text-lg font-bold text-white mb-1 leading-tight">
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
                background: 'linear-gradient(135deg, #FCD34D, #F59E0B, #EC4899)',
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

        {/* ─── MOBILE-Body: Badges + Beschreibung + Gültigkeit ─── */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(245, 158, 11, 0.3)',
                color: '#FCD34D',
                border: '1px solid rgba(245, 158, 11, 0.5)',
              }}
            >
              <Flame className="w-2.5 h-2.5" strokeWidth={2.5} />
              Limitiert
            </span>
            {!isLanding && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#6EE7B7',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2.5} />
                Aktiv
              </span>
            )}
            {renderCountdown()}
          </div>

          <p className="text-[13px] text-white/85 leading-snug">
            {currentPromo.description}
          </p>

          <div className="flex items-center gap-1.5 text-[11px] text-white/55">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">
              <span className="text-white/80 font-medium">
                {formatPromoDate(currentPromo.startDate)}
              </span>
              {' – '}
              <span className="text-white/80 font-medium">
                {formatPromoDate(currentPromo.endDate)}
              </span>
            </span>
          </div>

          {currentPromo.eligibility === 'non_vip' && (
            <div className="text-[10px] text-white/50 leading-tight">
              Nur für Nutzer ohne VIP / Luxus-Pass
            </div>
          )}

          {isLanding && clickable && (
            <div className="text-[11px] text-amber-300 uppercase tracking-wider font-semibold pt-1">
              Zum Shop →
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SLIDER-NAVIGATION: Dots + Counter unten mittig
          ══════════════════════════════════════════════════════════════ */}
      {hasMultiple && (
        <div className="absolute bottom-2.5 sm:bottom-3 left-0 right-0 flex items-center justify-center gap-2 sm:gap-3 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {list.map((p, i) => (
              <button
                key={p.id || i}
                type="button"
                onClick={(e) => goToSlide(e, i)}
                aria-label={`Zu Aktion ${i + 1} wechseln: ${p.title}`}
                aria-current={i === index ? 'true' : 'false'}
                className={`transition-all duration-300 rounded-full ${
                  i === index ? 'w-7 sm:w-8 h-2' : 'w-2 h-2 hover:w-3'
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
          <div className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider font-medium pointer-events-none">
            {index + 1} / {list.length}
          </div>
        </div>
      )}

      {/* Pause-Indikator */}
      {hasMultiple && isPaused && (
        <div
          className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-white/50 uppercase tracking-wider font-medium pointer-events-none"
          style={{
            background: 'rgba(0,0,0,0.35)',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          <Pause className="w-2.5 h-2.5" strokeWidth={2.5} />
          pausiert
        </div>
      )}
    </div>
  );
}
