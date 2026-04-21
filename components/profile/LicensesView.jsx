'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Crown, Gem, Shield, Car, Umbrella, Bike, Truck, Bus,
  Wrench, Scale, HeartPulse, Home, FileSignature,
  CheckCircle2, XCircle, Calendar, Zap, AlertTriangle, Loader2,
  ShoppingBag, RefreshCw,
  Info, Clock, Bell, BellOff, Ban, ShieldCheck, ShieldOff,
  PackageOpen, Lock, Gift, CreditCard, Star
} from 'lucide-react';
import { SHOP_ITEMS } from '@/lib/shop-data';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

// ──────────────────────────────────────────────────────────────
// Kategorie-Icon / Farb-Map
// ──────────────────────────────────────────────────────────────
const CATEGORY_META = {
  vip_premiums:    { icon: Crown,         color: 'from-amber-500/30 to-yellow-500/20',  label: 'VIP-Mitgliedschaft' },
  waffen:          { icon: Shield,        color: 'from-red-500/30 to-orange-500/20',    label: 'Waffenschein' },
  versicherungen:  { icon: Umbrella,      color: 'from-blue-500/30 to-cyan-500/20',     label: 'Versicherung' },
  werkzeuge:       { icon: Wrench,        color: 'from-purple-500/30 to-violet-500/20', label: 'Werkzeug' },
  schutzbriefe:    { icon: FileSignature, color: 'from-emerald-500/30 to-green-500/20', label: 'Schutzbrief' },
  führerscheine:   { icon: Car,           color: 'from-slate-500/30 to-zinc-500/20',    label: 'Führerschein' },
  credits:         { icon: Zap,           color: 'from-yellow-500/30 to-amber-500/20',  label: 'Credits' },
  credits_passes:  { icon: CreditCard,    color: 'from-pink-500/30 to-rose-500/20',     label: 'Credits-Pass' },
  default:         { icon: PackageOpen,   color: 'from-white/20 to-white/5',            label: 'Sonstiges' }
};

const ITEM_ICON = {
  'führerschein_pkw': Car,
  'führerschein_motorrad': Bike,
  'führerschein_lkw': Truck,
  'führerschein_bus': Bus,
  'waffenschein': Shield,
  'jagdschein': Shield,
  'versicherung_rechtsschutz': Scale,
  'versicherung_kranken': HeartPulse,
  'versicherung_pkw': Car,
  'versicherung_lkw': Truck,
  'versicherung_diebstahl': Home,
  'versicherung_hars': Umbrella,
  'werkzeug_hacking': Wrench,
  'werkzeug_angel': Wrench,
  'vip_premium': Gem,
  'vip_platinum': Gem,
  'vip_ultimate': Crown,
  'vip_elite_plus': Crown,
  'luxus_pass': Crown,
  'credits_free_pass': Gift,
  'credits_basic_pass': CreditCard,
  'credits_standard_pass': Star,
  'credits_elite_plus_pass': Crown
};

// Action → User-freundlicher Text
const ACTION_LABEL = {
  cancel:             { title: 'Lizenz wird gekündigt …',      sub: 'Der Discord-Bot übernimmt die Änderung gleich.' },
  expire:             { title: 'Pass wird beendet …',          sub: 'Der Pass läuft jetzt ab.' },
  disable_autorenew:  { title: 'Auto-Verlängerung deaktivieren …', sub: 'Bitte einen kurzen Moment Geduld.' },
  enable_autorenew:   { title: 'Auto-Verlängerung aktivieren …',   sub: 'Bitte einen kurzen Moment Geduld.' }
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts || ts === 0) return 'Unbegrenzt';
  const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  if (isNaN(d.getTime())) return 'Unbegrenzt';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function daysLeft(ts) {
  if (!ts || ts === 0) return null;
  const t = typeof ts === 'number' ? ts : new Date(ts).getTime();
  const diff = t - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────
export default function LicensesView({ userData, refreshUserData }) {
  const [processing, setProcessing] = useState({});
  const [confirmCancel, setConfirmCancel] = useState(null);

  // pendingActions = Map<licenseId, { action, queuedId, queuedAt, startedAt }>
  const [pendingActions, setPendingActions] = useState({});
  const pollTimeoutRef = useRef(null);
  const previousPendingKeys = useRef(new Set());

  // Normalisiere Licenses
  const licenses = useMemo(() => {
    const raw = Array.isArray(userData?.licenses) ? userData.licenses : [];
    return raw
      .filter(Boolean)
      .map((l, idx) => {
        if (typeof l === 'string') {
          return { id: l, name: l, expiresAt: 0, autoRenew: false, _idx: idx };
        }
        return {
          id: l.id || l.name,
          name: l.name || l.id,
          expiresAt: l.expiresAt || 0,
          autoRenew: l.autoRenew === true,
          canceledAt: l.canceledAt || null,
          _idx: idx,
          ...l
        };
      })
      .filter(l => {
        if (!l.id) return false;
        // Credits-Bundles (credits_10, credits_50, …) sind keine Lizenzen – nur Credits-Pässe anzeigen
        if (l.id.startsWith('credits_') && !l.id.includes('_pass')) return false;
        if (l.id.startsWith('credit_') && !l.id.includes('_pass')) return false;
        return true;
      });
  }, [userData]);

  // Nur kündbare Lizenzen
  const cancellableLicenses = useMemo(() => {
    const now = Date.now();
    return licenses.filter(l => {
      const item = SHOP_ITEMS[l.id];
      const autoRenewSupported = item?.autoRenewable !== false;
      const hasExpiry = l.expiresAt && l.expiresAt > 0;
      
      // Credits-Pässe IMMER anzeigen (auch abgelaufen), damit man sieht dass Free Pass schon genutzt wurde
      const isCreditsPass = l.id && l.id.startsWith('credits_') && l.id.includes('_pass');
      if (isCreditsPass) {
        // Credits-Pass muss nur autoRenewable sein, egal ob abgelaufen
        return autoRenewSupported;
      }
      
      // Andere Lizenzen: nur anzeigen wenn nicht abgelaufen
      const notExpired = hasExpiry && l.expiresAt > now;
      return autoRenewSupported && hasExpiry && notExpired;
    });
  }, [licenses]);

  const sortedLicenses = useMemo(() => {
    return [...cancellableLicenses].sort((a, b) => {
      const aCanceled = a.canceledAt && !a.autoRenew;
      const bCanceled = b.canceledAt && !b.autoRenew;
      if (aCanceled !== bCanceled) return aCanceled ? 1 : -1;
      return a.expiresAt - b.expiresAt;
    });
  }, [cancellableLicenses]);

  const totalLicensesCount = licenses.length;
  
  // Hidden Count: NUR Nicht-Credits-Pässe zählen
  const hiddenCount = useMemo(() => {
    const hidden = licenses.filter(l => !cancellableLicenses.find(c => c.id === l.id));
    // Credits-Pässe ausschließen aus Hidden Count
    return hidden.filter(l => {
      const isCreditsPass = l.id && l.id.startsWith('credits_') && l.id.includes('_pass');
      return !isCreditsPass;
    }).length;
  }, [licenses, cancellableLicenses]);

  // ──────────────────────────────────────────────────────────────
  // Pending Actions Polling
  // ──────────────────────────────────────────────────────────────
  const fetchPendingActions = useCallback(async () => {
    try {
      const res = await fetch('/api/licenses/pending-actions');
      if (!res.ok) return null;
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { return null; }

      const map = {};
      (data.pending || []).forEach(p => {
        // Bei mehreren Actions auf gleicher License nur die neueste behalten
        if (!map[p.licenseId] || new Date(p.queuedAt) > new Date(map[p.licenseId].queuedAt)) {
          map[p.licenseId] = {
            action: p.action,
            queuedId: p.queuedId,
            queuedAt: p.queuedAt,
            status: p.status
          };
        }
      });
      return map;
    } catch {
      return null;
    }
  }, []);

  // Initial fetch + wenn irgendeine Action gesetzt wird → polling starten
  const schedulePoll = useCallback((delay = 3000) => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    pollTimeoutRef.current = setTimeout(async () => {
      const fresh = await fetchPendingActions();
      if (fresh === null) {
        // Netzwerkfehler – später erneut versuchen
        schedulePoll(5000);
        return;
      }

      const newKeys = new Set(Object.keys(fresh));
      const oldKeys = previousPendingKeys.current;

      // Check ob etwas verschwunden ist (= Bot hat verarbeitet)
      const removed = [...oldKeys].filter(k => !newKeys.has(k));
      if (removed.length > 0) {
        // Bot hat verarbeitet → Daten neu laden
        if (typeof refreshUserData === 'function') {
          await refreshUserData();
        }
        removed.forEach(licId => {
          const item = SHOP_ITEMS[licId];
          toast.success('Aktion übernommen', {
            description: `${item?.name || licId} – der Bot hat die Änderung durchgeführt.`
          });
        });
      }

      previousPendingKeys.current = newKeys;
      setPendingActions(fresh);

      // Wenn noch was pending ist → weiter pollen
      if (newKeys.size > 0) {
        schedulePoll(3000);
      }
    }, delay);
  }, [fetchPendingActions, refreshUserData]);

  // Mount: initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fresh = await fetchPendingActions();
      if (cancelled) return;
      if (fresh) {
        previousPendingKeys.current = new Set(Object.keys(fresh));
        setPendingActions(fresh);
        if (Object.keys(fresh).length > 0) schedulePoll(3000);
      }
    })();
    return () => {
      cancelled = true;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [fetchPendingActions, schedulePoll]);

  // ──────────────────────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────────────────────
  const submitLicenseAction = async (licenseId, action) => {
    setProcessing(prev => ({ ...prev, [licenseId]: true }));
    try {
      const res = await fetch('/api/licenses/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId, action })
      });
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { /* ignore */ }

      if (res.ok) {
        // Sofort lokal als pending markieren (damit Karte sofort gesperrt wird)
        setPendingActions(prev => ({
          ...prev,
          [licenseId]: {
            action,
            queuedId: data.queuedId,
            queuedAt: new Date().toISOString(),
            status: 'pending'
          }
        }));
        previousPendingKeys.current = new Set([...previousPendingKeys.current, licenseId]);

        const msg = ACTION_LABEL[action]?.title?.replace(' …', '') || 'Aktion gespeichert';
        toast.info(msg, { description: 'Wird vom Discord-Bot gleich verarbeitet.' });

        // Polling starten (erstes Check in 2.5s)
        schedulePoll(2500);
      } else {
        toast.error('Fehler', { description: data.error || `HTTP ${res.status}` });
      }
    } catch (e) {
      toast.error('Netzwerkfehler', { description: e.message });
    } finally {
      setProcessing(prev => {
        const next = { ...prev };
        delete next[licenseId];
        return next;
      });
    }
  };

  const toggleAutoRenew = async (license) => {
    const newValue = !license.autoRenew;
    const action = newValue ? 'enable_autorenew' : 'disable_autorenew';
    await submitLicenseAction(license.id, action);
  };

  const cancelLicense = async (license) => {
    await submitLicenseAction(license.id, 'cancel');
    setConfirmCancel(null);
  };
  
  const expireLicense = async (license) => {
    // Für Free Pass: expiresAt auf 0 setzen (nicht löschen!)
    await submitLicenseAction(license.id, 'expire');
  };

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Info-Banner */}
      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.03] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            Kündbare Lizenzen
            <span className="text-[10px] font-medium text-blue-300/80 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
              {cancellableLicenses.length} von {totalLicensesCount}
            </span>
          </h3>
          <p className="text-xs text-white/50 mt-1 leading-relaxed">
            Hier siehst du ausschließlich Lizenzen, die <strong>kündbar</strong> oder in der Auto-Verlängerung anpassbar sind.
            Unbegrenzte oder abgelaufene Lizenzen werden ausgeblendet. <strong>Credits-Pässe werden immer angezeigt</strong> (auch abgelaufen).
            Änderungen übernimmt der Discord-Bot innerhalb weniger Sekunden.
          </p>
          {hiddenCount > 0 && (
            <p className="text-[11px] text-white/30 mt-2 flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              {hiddenCount} Lizenz{hiddenCount !== 1 ? 'en' : ''} ausgeblendet (permanent / abgelaufen).
            </p>
          )}
          {Object.keys(pendingActions).length > 0 && (
            <p className="text-[11px] text-amber-300 mt-2 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              {Object.keys(pendingActions).length} Änderung{Object.keys(pendingActions).length !== 1 ? 'en' : ''} werden gerade verarbeitet …
            </p>
          )}
        </div>
      </div>

      {sortedLicenses.length === 0 ? (
        <div className="p-12 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="w-7 h-7 text-white/30" />
          </div>
          <p className="text-white/70 font-medium">Keine kündbaren Lizenzen</p>
          <p className="text-xs text-white/40 mt-1.5 max-w-md mx-auto">
            Du besitzt derzeit keine Lizenzen mit laufender Auto-Verlängerung.
            Besuche den Shop, um Versicherungen, Waffenscheine oder VIP-Mitgliedschaften zu erwerben.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedLicenses.map(license => {
            const item = SHOP_ITEMS[license.id] || null;
            const displayName = item?.name || license.name || license.id;
            const category = item?.category || 'default';
            const catMeta = CATEGORY_META[category] || CATEGORY_META.default;
            const CategoryIcon = catMeta.icon;
            const ItemIcon = ITEM_ICON[license.id] || CategoryIcon;

            const days = daysLeft(license.expiresAt);
            const isCanceled = license.canceledAt && !license.autoRenew;
            const isExpired = license.expiresAt && license.expiresAt > 0 && license.expiresAt <= Date.now();
            const isProcessing = !!processing[license.id];
            const pending = pendingActions[license.id] || null;
            const isLocked = !!pending;

            const statusColor = isCanceled ? 'orange' : (days !== null && days <= 7) ? 'yellow' : 'green';
            const statusColorMap = {
              green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400',  accent: 'bg-green-500/40' },
              yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', accent: 'bg-yellow-500/40' },
              orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', accent: 'bg-orange-500/40' }
            };
            const c = statusColorMap[statusColor];

            return (
              <div
                key={`${license.id}-${license._idx}`}
                className={`group p-5 rounded-2xl border ${c.border} bg-white/[0.02] relative overflow-hidden transition-all hover:bg-white/[0.04] hover:border-white/10 ${isLocked ? 'pointer-events-none' : ''}`}
              >
                {/* Farb-Akzent links */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.accent}`} />

                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${catMeta.color} border border-white/10 flex items-center justify-center flex-shrink-0`}>
                      <ItemIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate leading-tight">{displayName}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <CategoryIcon className="w-3 h-3 text-white/30" />
                        <span className="text-[11px] text-white/40">{catMeta.label}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${c.bg} ${c.text} border ${c.border} flex-shrink-0`}>
                    {isCanceled ? <><AlertTriangle className="w-3 h-3" /> Gekündigt</>
                      : days !== null && days <= 7 ? <><Clock className="w-3 h-3" /> Bald</>
                      : <><CheckCircle2 className="w-3 h-3" /> Aktiv</>}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Läuft ab
                    </span>
                    <span className="text-white/80 font-medium">
                      {formatDate(license.expiresAt)}
                      {days !== null && (
                        <span className={`ml-1.5 ${days <= 3 ? 'text-red-400' : days <= 7 ? 'text-yellow-400' : 'text-white/40'}`}>
                          ({days} Tag{days !== 1 ? 'e' : ''})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Auto-Verlängerung
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium flex items-center gap-1 ${license.autoRenew ? 'text-green-400' : 'text-white/40'}`}>
                        {license.autoRenew ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                        {license.autoRenew ? 'Aktiv' : 'Deaktiviert'}
                      </span>
                      <Switch
                        checked={license.autoRenew}
                        disabled={isProcessing || isLocked}
                        onCheckedChange={() => toggleAutoRenew(license)}
                        aria-label="Auto-Verlängerung umschalten"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                  {!isCanceled && !isExpired ? (
                    <>
                      {/* Free Pass: Ablaufen lassen (expiresAt = 0) */}
                      {license.id === 'credits_free_pass' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => expireLicense(license)}
                          disabled={isProcessing || isLocked}
                          className="flex-1 rounded-xl border-orange-500/20 text-orange-300 hover:bg-orange-500/10 hover:text-orange-200 hover:border-orange-500/40 disabled:opacity-40"
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Ban className="w-4 h-4 mr-1.5" /> Jetzt beenden</>}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmCancel({ license, item: { name: displayName, emoji: item?.emoji, category, ItemIcon } })}
                          disabled={isProcessing || isLocked}
                          className="flex-1 rounded-xl border-red-500/20 text-red-300 hover:bg-red-500/10 hover:text-red-200 hover:border-red-500/40 disabled:opacity-40"
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Ban className="w-4 h-4 mr-1.5" /> Jetzt kündigen</>}
                        </Button>
                      )}
                    </>
                  ) : isExpired ? (
                    <div className="flex-1 text-[11px] text-red-300 flex items-center gap-1.5 justify-center py-2 bg-red-500/5 rounded-lg border border-red-500/10">
                      <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Abgelaufen am {formatDate(license.expiresAt)}</span>
                    </div>
                  ) : (
                    <div className="flex-1 text-[11px] text-orange-300 flex items-center gap-1.5 justify-center py-2 bg-orange-500/5 rounded-lg border border-orange-500/10">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Aktiv bis {formatDate(license.expiresAt)} — danach Ablauf</span>
                    </div>
                  )}
                </div>

                {/* ═══════════════════════════════════════════════════
                    LOCKED OVERLAY — wenn Action beim Bot in Arbeit
                    ═══════════════════════════════════════════════════ */}
                {isLocked && (
                  <LockedOverlay action={pending.action} queuedAt={pending.queuedAt} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm-Dialog für Kündigung */}
      {confirmCancel && (
        <CancelConfirmDialog
          data={confirmCancel}
          isProcessing={!!processing[confirmCancel.license.id]}
          onClose={() => setConfirmCancel(null)}
          onConfirm={() => cancelLicense(confirmCancel.license)}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Locked Overlay — Karte gesperrt bis Bot verarbeitet hat
// ──────────────────────────────────────────────────────────────
function LockedOverlay({ action, queuedAt }) {
  const meta = ACTION_LABEL[action] || { title: 'Wird verarbeitet …', sub: 'Bitte einen kurzen Moment Geduld.' };
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!queuedAt) return;
    const start = new Date(queuedAt).getTime();
    const tick = () => setElapsedSec(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [queuedAt]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0A0B0F]/85 backdrop-blur-[3px] rounded-2xl border border-amber-500/20 animate-in fade-in duration-200">
      {/* Spinning Ring + Lock in Center */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-amber-500/10" />
        <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock className="w-6 h-6 text-amber-400" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center px-4 max-w-[90%]">
        <p className="text-sm font-semibold text-white flex items-center justify-center gap-1.5">
          {meta.title}
        </p>
        <p className="text-[11px] text-white/60 mt-1 leading-snug">
          {meta.sub}
        </p>
        <p className="text-[10px] text-amber-300/80 mt-2 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          {elapsedSec}s in Warteschlange
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Cancel Confirm Dialog — modernisiert mit Icons
// ──────────────────────────────────────────────────────────────
function CancelConfirmDialog({ data, isProcessing, onClose, onConfirm }) {
  const { license, item } = data;
  const ItemIcon = item.ItemIcon || ShoppingBag;
  const catMeta = CATEGORY_META[item.category] || CATEGORY_META.default;
  const days = daysLeft(license.expiresAt);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="bg-[#0A0B0F] border border-red-500/20 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl shadow-red-500/10 animate-in zoom-in-95 duration-200">
        <div className="relative p-6 border-b border-white/[0.06] bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${catMeta.color} border border-white/10 flex items-center justify-center flex-shrink-0`}>
              <ItemIcon className="w-6 h-6 text-white" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-[#0A0B0F] flex items-center justify-center">
                <Ban className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white leading-tight">Lizenz kündigen?</h3>
              <p className="text-sm text-white/50 mt-0.5 truncate">{item.name}</p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/40">
                <catMeta.icon className="w-3 h-3" />
                {catMeta.label}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              Was passiert bei der Kündigung?
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-white/70 leading-relaxed">
                  Die Lizenz bleibt bis zum <strong className="text-white">{formatDate(license.expiresAt)}</strong> aktiv
                  {days !== null && <span className="text-white/40"> (noch {days} Tag{days !== 1 ? 'e' : ''})</span>}.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BellOff className="w-3 h-3 text-red-400" />
                </div>
                <span className="text-white/70 leading-relaxed">
                  Keine automatische Verlängerung mehr — danach endgültig abgelaufen.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <XCircle className="w-3 h-3 text-orange-400" />
                </div>
                <span className="text-white/70 leading-relaxed">
                  <strong className="text-white">Keine Rückerstattung</strong> für den bereits laufenden Zeitraum.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <RefreshCw className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-white/70 leading-relaxed">
                  Rückgängig machbar durch Reaktivieren der Auto-Verlängerung.
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl border-white/10 hover:bg-white/[0.04]"
              disabled={isProcessing}
            >
              Abbrechen
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-600/20"
              disabled={isProcessing}
            >
              {isProcessing
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Wird gekündigt…</>
                : <><Ban className="w-4 h-4 mr-2" /> Ja, kündigen</>
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
