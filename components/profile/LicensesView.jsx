'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  Crown, Gem, Star, Shield, Award, FileText, Car, Umbrella,
  CheckCircle2, XCircle, Calendar, Zap, AlertTriangle, Loader2,
  Sparkles, ShoppingBag, RefreshCw, Infinity as InfinityIcon
} from 'lucide-react';
import { SHOP_ITEMS } from '@/lib/shop-data';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

// Icon-Map pro Kategorie
const CATEGORY_ICON = {
  vip: Crown,
  credits: Zap,
  führerscheine: Car,
  waffen: Shield,
  versicherungen: Umbrella,
  bewerbung: FileText,
  default: ShoppingBag
};

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

export default function LicensesView({ userData, refreshUserData }) {
  const [processing, setProcessing] = useState({}); // { [licenseId]: true }
  const [confirmCancel, setConfirmCancel] = useState(null); // { licenseId, itemName }

  // Normalisiere die Licenses zu Objekten
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
      .filter(l => l.id && !l.id.startsWith('credits_') && !l.id.startsWith('credit_'));
  }, [userData]);

  // Sortiere: Aktive zuerst (nach Ablaufdatum aufsteigend), dann Unbegrenzte, dann Abgelaufene
  const sortedLicenses = useMemo(() => {
    const now = Date.now();
    const active = [];
    const unlimited = [];
    const expired = [];
    licenses.forEach(l => {
      if (!l.expiresAt || l.expiresAt === 0) unlimited.push(l);
      else if (l.expiresAt > now) active.push(l);
      else expired.push(l);
    });
    active.sort((a, b) => a.expiresAt - b.expiresAt);
    return [...active, ...unlimited, ...expired];
  }, [licenses]);

  const submitLicenseAction = async (licenseId, action) => {
    setProcessing(prev => ({ ...prev, [licenseId]: true }));
    try {
      const res = await fetch('/api/licenses/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId, action })
      });
      const data = await res.json();
      if (res.ok) {
        const msg = action === 'enable_autorenew' ? 'Auto-Renew aktiviert'
          : action === 'disable_autorenew' ? 'Auto-Renew deaktiviert'
          : action === 'cancel' ? 'Lizenz gekündigt (läuft bis Ablauf)'
          : 'Aktion ausgeführt';
        toast.success(msg, { description: 'Der Discord Bot wird die Änderung in Kürze übernehmen.' });
        // Daten neu laden
        if (typeof refreshUserData === 'function') {
          await refreshUserData();
        }
      } else {
        toast.error('Fehler', { description: data.error || 'Aktion fehlgeschlagen' });
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
    // Keine Confirm für Toggle - sofort durchführen
    await submitLicenseAction(license.id, action);
  };

  const cancelLicense = async (license) => {
    await submitLicenseAction(license.id, 'cancel');
    setConfirmCancel(null);
  };

  return (
    <div className="space-y-6">
      {/* Info-Banner */}
      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.03] flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-white">Lizenz-Verwaltung</h3>
          <p className="text-xs text-white/50 mt-1 leading-relaxed">
            Hier siehst du alle deine aktiven Lizenzen. Du kannst die automatische Verlängerung aktivieren oder deaktivieren — oder eine Lizenz kündigen. Bei einer Kündigung bleibt die Lizenz bis zum Ablaufdatum aktiv, wird aber nicht automatisch verlängert. Änderungen werden vom Discord-Bot innerhalb weniger Sekunden übernommen.
          </p>
        </div>
      </div>

      {sortedLicenses.length === 0 ? (
        <div className="p-12 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-center">
          <ShoppingBag className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 font-medium">Du besitzt aktuell keine Lizenzen</p>
          <p className="text-xs text-white/30 mt-1">Besuche den Shop, um welche zu erwerben.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedLicenses.map(license => {
            const item = SHOP_ITEMS[license.id] || null;
            const displayName = item?.name || license.name || license.id;
            const emoji = item?.emoji || '📜';
            const category = item?.category || 'default';
            const CategoryIcon = CATEGORY_ICON[category] || ShoppingBag;
            const autoRenewSupported = item?.autoRenewable !== false; // default true für Legacy
            const hasExpiry = license.expiresAt && license.expiresAt > 0;
            const days = hasExpiry ? daysLeft(license.expiresAt) : null;
            const isExpired = hasExpiry && license.expiresAt <= Date.now();
            const isCanceled = license.canceledAt && !license.autoRenew;
            const isProcessing = !!processing[license.id];

            const statusColor = isExpired ? 'red' : isCanceled ? 'orange' : (days !== null && days <= 7) ? 'yellow' : 'green';
            const statusColorMap = {
              green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
              yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
              orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
              red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' }
            };
            const c = statusColorMap[statusColor];

            return (
              <div
                key={`${license.id}-${license._idx}`}
                className={`p-5 rounded-2xl border ${c.border} bg-white/[0.02] relative overflow-hidden transition-all hover:bg-white/[0.04]`}
              >
                {/* Farbiger Akzent-Streifen links */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bg.replace('/10', '/40')}`} />
                
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0 text-xl`}>
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{displayName}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CategoryIcon className="w-3 h-3 text-white/30" />
                        <span className="text-xs text-white/40 capitalize">{category}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${c.bg} ${c.text} border ${c.border} flex-shrink-0`}>
                    {isExpired ? <><XCircle className="w-3 h-3" /> Abgelaufen</>
                      : isCanceled ? <><AlertTriangle className="w-3 h-3" /> Gekündigt</>
                      : days !== null && days <= 7 ? <><AlertTriangle className="w-3 h-3" /> Bald</>
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
                      {hasExpiry ? (
                        <>
                          {formatDate(license.expiresAt)}
                          {days !== null && !isExpired && (
                            <span className={`ml-1.5 ${days <= 3 ? 'text-red-400' : days <= 7 ? 'text-yellow-400' : 'text-white/40'}`}>
                              ({days} Tag{days !== 1 ? 'e' : ''})
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-300">
                          <InfinityIcon className="w-3 h-3" /> Unbegrenzt
                        </span>
                      )}
                    </span>
                  </div>

                  {hasExpiry && autoRenewSupported && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Auto-Verlängerung
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${license.autoRenew ? 'text-green-400' : 'text-white/40'}`}>
                          {license.autoRenew ? 'Aktiv' : 'Deaktiviert'}
                        </span>
                        <Switch
                          checked={license.autoRenew}
                          disabled={isProcessing || isExpired}
                          onCheckedChange={() => toggleAutoRenew(license)}
                          aria-label="Auto-Renew umschalten"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!isExpired && hasExpiry && (
                  <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                    {!isCanceled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmCancel({ licenseId: license.id, itemName: displayName })}
                        disabled={isProcessing}
                        className="flex-1 rounded-xl border-red-500/20 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-1.5" /> Jetzt kündigen</>}
                      </Button>
                    ) : (
                      <div className="flex-1 text-xs text-orange-300 flex items-center gap-1.5 justify-center py-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Gekündigt — Lizenz läuft am {formatDate(license.expiresAt)} ab
                      </div>
                    )}
                  </div>
                )}
                {!hasExpiry && (
                  <div className="pt-3 border-t border-white/[0.06] text-xs text-white/30 text-center">
                    Dauerhafte Lizenz — keine Aktionen nötig
                  </div>
                )}
                {isExpired && (
                  <div className="pt-3 border-t border-white/[0.06] text-xs text-red-300 text-center">
                    Lizenz abgelaufen
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm-Dialog für Kündigung */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0A0B0F] border border-red-500/20 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Lizenz kündigen?</h3>
                <p className="text-sm text-white/40">{confirmCancel.itemName}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <p className="text-xs text-orange-200 leading-relaxed">
                Die Lizenz bleibt bis zum Ablaufdatum aktiv, wird aber nicht automatisch verlängert. 
                Es erfolgt <strong>keine Rückerstattung</strong>. Du kannst die Kündigung jederzeit 
                rückgängig machen, indem du die Auto-Verlängerung wieder aktivierst.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setConfirmCancel(null)} 
                className="flex-1 rounded-xl border-white/10"
                disabled={!!processing[confirmCancel.licenseId]}
              >
                Abbrechen
              </Button>
              <Button 
                onClick={() => cancelLicense({ id: confirmCancel.licenseId })} 
                className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl"
                disabled={!!processing[confirmCancel.licenseId]}
              >
                {processing[confirmCancel.licenseId] ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                Ja, kündigen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
