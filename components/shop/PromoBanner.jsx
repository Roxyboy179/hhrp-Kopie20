'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatPromoDate, getPromoCountdown } from '@/lib/shop-promotions';

/**
 * Wiederverwendbares Rabatt-Aktions-Banner mit Live-Countdown.
 *
 * Props:
 * - promo: das Aktions-Objekt aus SHOP_PROMOTIONS (oder null → nichts anzeigen)
 * - variant: 'shop' (default) | 'landing' — leicht andere Styles
 * - onClick: optionale Click-Handler (z.B. zum Shop springen)
 */
export function PromoBanner({ promo, variant = 'shop', onClick }) {
  // Live-Countdown, tickt minütlich
  const [countdown, setCountdown] = useState(() => getPromoCountdown(promo));

  useEffect(() => {
    if (!promo) return;
    // Sofort aktualisieren (falls Prop wechselt)
    setCountdown(getPromoCountdown(promo));
    const id = setInterval(() => {
      setCountdown(getPromoCountdown(promo));
    }, 30 * 1000); // alle 30 Sekunden
    return () => clearInterval(id);
  }, [promo]);

  if (!promo) return null;
  if (countdown?.expired) return null;

  const isLanding = variant === 'landing';
  const clickable = typeof onClick === 'function';

  // Countdown-Text zusammenbauen
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

  return (
    <div
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      className={`relative p-5 rounded-xl border backdrop-blur-sm overflow-hidden ${
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

      <div className="relative flex items-start gap-4 flex-wrap sm:flex-nowrap">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl shrink-0"
          style={{
            background: 'rgba(245, 158, 11, 0.25)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
          }}
        >
          {promo.icon || '🎉'}
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
            {promo.title}
          </h3>
          <p className="text-sm text-white/80 mb-2">
            {promo.description}
          </p>

          <div className="flex items-center gap-2 text-xs text-white/60 flex-wrap">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Gültig vom{' '}
              <span className="text-white font-medium">
                {formatPromoDate(promo.startDate)}
              </span>{' '}
              bis{' '}
              <span className="text-white font-medium">
                {formatPromoDate(promo.endDate)}
              </span>
            </span>
            {promo.eligibility === 'non_vip' && (
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
            -{Math.round(promo.discount * 100)}%
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
    </div>
  );
}
