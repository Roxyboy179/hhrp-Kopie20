import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  CreditCard, Calendar, Clock, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Filter, Search, Download, Target, Calculator,
  PiggyBank, Lightbulb, BarChart2, DollarSign, ArrowUpRight, ArrowDownRight,
  Loader2, ArrowRight, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, subDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { toast } from 'sonner';

// Chart Colors
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ══════════════════════════════════════════════════════════════════════════
// PENDING OVERLAY für Kredit-Aktionen (Zurückzahlen / Verlängern)
// ══════════════════════════════════════════════════════════════════════════
function CreditPendingOverlay({ queuedAt, action }) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!queuedAt) return;
    const start = new Date(queuedAt).getTime();
    const tick = () => setElapsedSec(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [queuedAt]);

  const meta = action === 'repay' 
    ? { label: 'Rückzahlung wird verarbeitet …', color: '#10b981', icon: CheckCircle }
    : { label: 'Verlängerung wird verarbeitet …', color: '#3b82f6', icon: Clock };

  const IconComp = meta.icon;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-xl animate-in fade-in duration-200"
      style={{
        background: 'rgba(10, 11, 15, 0.88)',
        backdropFilter: 'blur(3px)',
        border: `1px solid ${meta.color}44`
      }}
    >
      {/* Spinning Ring */}
      <div className="relative w-14 h-14">
        <div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: `${meta.color}22` }}
        />
        <div
          className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: meta.color, borderTopColor: 'transparent' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <IconComp className="w-5 h-5" style={{ color: meta.color }} />
        </div>
      </div>

      <div className="text-center px-3 max-w-[90%]">
        <p className="text-xs font-semibold text-white">{meta.label}</p>
        <p className="text-[10px] text-white/60 mt-0.5 leading-snug">
          Bitte einen kurzen Moment Geduld.
        </p>
        <p className="text-[10px] mt-1.5 flex items-center justify-center gap-1" style={{ color: meta.color }}>
          <Clock className="w-2.5 h-2.5" />
          {elapsedSec}s in Warteschlange
        </p>
      </div>
    </div>
  );
}

// =============================================
// PHASE 1: KREDITE DETAIL-ÜBERSICHT
// =============================================
export function KrediteDetailView({ userData, onRefresh }) {
  const kredite = userData?.kredite || [];
  
  const aktiveKredite = kredite.filter(k => k.status === 'aktiv');
  const pendingKredite = kredite.filter(k => k.status === 'pending');
  const abgeschlosseneKredite = kredite.filter(k => k.status === 'abgeschlossen');
  
  const totalSchulden = aktiveKredite.reduce((sum, k) => sum + (k.rueckzahlungsBetrag || 0), 0);
  
  // ═══════════════════════════════════════════════════════════════
  // PENDING CREDIT ACTIONS — Karten sperren bis Bot verarbeitet hat
  // ═══════════════════════════════════════════════════════════════
  const [pendingActions, setPendingActions] = useState({});
  const [processing, setProcessing] = useState(false);
  const pollTimeoutRef = useRef(null);
  const previousPendingKeys = useRef(new Set());

  // Modals
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedKredit, setSelectedKredit] = useState(null);
  const [extendDays, setExtendDays] = useState(2);

  const fetchPendingActions = useCallback(async () => {
    try {
      const res = await fetch('/api/credits/pending');
      if (!res.ok) return null;
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { return null; }

      const map = {};
      (data.pending || []).forEach(p => {
        if (!map[p.kreditId] || new Date(p.queuedAt) > new Date(map[p.kreditId].queuedAt)) {
          map[p.kreditId] = {
            queuedId: p.queuedId,
            queuedAt: p.queuedAt,
            action: p.action,
            status: p.status
          };
        }
      });
      return map;
    } catch {
      return null;
    }
  }, []);

  const schedulePollActions = useCallback((delay = 3000) => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    pollTimeoutRef.current = setTimeout(async () => {
      const fresh = await fetchPendingActions();
      if (fresh === null) {
        schedulePollActions(5000);
        return;
      }

      const newKeys = new Set(Object.keys(fresh));
      const oldKeys = previousPendingKeys.current;
      const removed = [...oldKeys].filter(k => !newKeys.has(k));

      if (removed.length > 0) {
        if (typeof onRefresh === 'function') {
          await onRefresh();
        }
        removed.forEach(kreditId => {
          const kredit = kredite.find(k => k.kreditId === kreditId);
          const action = (pendingActions[kreditId] || {}).action;
          toast.success(
            action === 'repay' ? 'Rückzahlung abgeschlossen' : 'Verlängerung abgeschlossen',
            { description: `${kredit?.name || kreditId} – Bot hat die Verarbeitung abgeschlossen.` }
          );
        });
      }

      previousPendingKeys.current = newKeys;
      setPendingActions(fresh);

      if (newKeys.size > 0) {
        schedulePollActions(3000);
      }
    }, delay);
  }, [fetchPendingActions, onRefresh, kredite, pendingActions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fresh = await fetchPendingActions();
      if (cancelled || !fresh) return;
      previousPendingKeys.current = new Set(Object.keys(fresh));
      setPendingActions(fresh);
      if (Object.keys(fresh).length > 0) schedulePollActions(3000);
    })();
    return () => {
      cancelled = true;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [fetchPendingActions, schedulePollActions]);

  // Sofort als pending markieren (optimistic update)
  const markActionPending = (kreditId, action) => {
    const now = new Date().toISOString();
    setPendingActions(prev => ({
      ...prev,
      [kreditId]: {
        queuedId: `optimistic_${kreditId}_${Date.now()}`,
        queuedAt: now,
        action,
        status: 'pending'
      }
    }));
    previousPendingKeys.current.add(kreditId);
    schedulePollActions(2500);
  };

  // Kredit zurückzahlen
  const handleRepay = async () => {
    if (!selectedKredit || processing) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/credits/repay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kreditId: selectedKredit.kreditId })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Rückzahlung fehlgeschlagen');
      } else {
        toast.info('Rückzahlung wird verarbeitet …');
        markActionPending(selectedKredit.kreditId, 'repay');
        setShowRepayModal(false);
      }
    } catch (e) {
      toast.error('Netzwerkfehler');
    } finally {
      setProcessing(false);
    }
  };

  // Kredit verlängern
  const handleExtend = async () => {
    if (!selectedKredit || processing) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/credits/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kreditId: selectedKredit.kreditId, days: extendDays })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Verlängerung fehlgeschlagen');
      } else {
        toast.info(`Verlängerung um ${extendDays} Tage wird verarbeitet …`);
        markActionPending(selectedKredit.kreditId, 'extend');
        setShowExtendModal(false);
      }
    } catch (e) {
      toast.error('Netzwerkfehler');
    } finally {
      setProcessing(false);
    }
  };

  // Gebühren-Optionen für Verlängerung
  const extensionOptions = [
    { days: 2, percent: 0.05, label: '+2 Tage' },
    { days: 4, percent: 0.06, label: '+4 Tage' },
    { days: 6, percent: 0.08, label: '+6 Tage' },
    { days: 8, percent: 0.10, label: '+8 Tage' }
  ];
  
  const renderKreditCard = (kredit) => {
    const daysLeft = kredit.rueckzahlungsDatum 
      ? differenceInDays(new Date(kredit.rueckzahlungsDatum), new Date())
      : 0;
    
    const isOverdue = daysLeft < 0;
    const isUrgent = daysLeft <= 3 && daysLeft >= 0;
    
    const progress = kredit.betrag > 0 
      ? ((kredit.betrag / kredit.rueckzahlungsBetrag) * 100).toFixed(1)
      : 0;
    
    // Pending-Check
    const pending = pendingActions[kredit.kreditId];
    const isBotLocked = !!pending;
    const isExtendable = !kredit.verlaengert && kredit.status === 'aktiv';
    
    return (
      <div 
        key={kredit.kreditId}
        className={`glass rounded-2xl p-6 border relative ${isBotLocked ? 'overflow-hidden pointer-events-none' : ''}`}
        style={{
          borderColor: isBotLocked
            ? 'rgba(59, 130, 246, 0.4)'
            : isOverdue
            ? 'rgba(239, 68, 68, 0.3)'
            : isUrgent
            ? 'rgba(245, 158, 11, 0.3)'
            : 'rgba(255, 255, 255, 0.08)',
          background: isBotLocked
            ? 'rgba(59, 130, 246, 0.05)'
            : isOverdue
            ? 'rgba(239, 68, 68, 0.05)'
            : isUrgent
            ? 'rgba(245, 158, 11, 0.05)'
            : undefined
        }}
      >
        {/* Bot-Pending Overlay */}
        {isBotLocked && (
          <CreditPendingOverlay
            queuedAt={pending.queuedAt}
            action={pending.action}
          />
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              kredit.status === 'aktiv' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
              kredit.status === 'pending' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
              'bg-gradient-to-br from-green-500 to-emerald-500'
            }`}>
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Kredit #{kredit.kreditId}</h3>
              <p className="text-sm text-white/50">Kontonr: {kredit.kontonummer}</p>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            kredit.status === 'aktiv' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
            kredit.status === 'pending' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            {kredit.status === 'aktiv' ? 'AKTIV' :
             kredit.status === 'pending' ? 'AUSSTEHEND' :
             'ABGESCHLOSSEN'}
          </div>
        </div>
        
        {/* Beträge */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-xs text-white/50 mb-1">Kreditbetrag</p>
            <p className="text-lg font-bold text-white">{kredit.betrag?.toLocaleString('de-DE')} €</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-xs text-white/50 mb-1">Gebühr</p>
            <p className="text-lg font-bold text-orange-400">+{kredit.gebuehr?.toLocaleString('de-DE')} €</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-xs text-red-400/60 mb-1">Rückzahlung</p>
            <p className="text-lg font-bold text-red-400">{kredit.rueckzahlungsBetrag?.toLocaleString('de-DE')} €</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-xs text-white/50 mb-1">Zinssatz</p>
            <p className="text-lg font-bold text-white">
              {kredit.betrag > 0 ? ((kredit.gebuehr / kredit.betrag) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
        
        {/* Countdown & Status */}
        {kredit.status === 'aktiv' && kredit.rueckzahlungsDatum && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/60">Fälligkeit</span>
              <span className={`font-semibold ${
                isOverdue ? 'text-red-400' :
                isUrgent ? 'text-yellow-400' :
                'text-white'
              }`}>
                {isOverdue 
                  ? `${Math.abs(daysLeft)} Tage überfällig!`
                  : `in ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tagen'}`
                }
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverdue ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  isUrgent ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-green-500 to-emerald-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Daten */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center gap-2 text-white/60">
            <Calendar className="w-4 h-4" />
            <span>Beantragt: {kredit.beantragtAm ? format(new Date(kredit.beantragtAm), 'dd.MM.yyyy', { locale: de }) : 'N/A'}</span>
          </div>
          {kredit.rueckzahlungsDatum && (
            <div className="flex items-center gap-2 text-white/60">
              <Clock className="w-4 h-4" />
              <span>Fällig: {format(new Date(kredit.rueckzahlungsDatum), 'dd.MM.yyyy', { locale: de })}</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons - NUR für aktive Kredite */}
        {kredit.status === 'aktiv' && !isBotLocked && (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setSelectedKredit(kredit);
                setShowRepayModal(true);
              }}
              disabled={processing}
              className="flex-1 rounded-xl h-11"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#fff'
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Zurückzahlen
            </Button>
            
            {isExtendable && (
              <Button
                onClick={() => {
                  setSelectedKredit(kredit);
                  setShowExtendModal(true);
                }}
                disabled={processing}
                className="flex-1 rounded-xl h-11"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3))',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#fff'
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                Verlängern
              </Button>
            )}
          </div>
        )}
        
        {/* Verlängerungs-Hinweis */}
        {kredit.status === 'aktiv' && kredit.verlaengert && !isBotLocked && (
          <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-300">Bereits verlängert</p>
                <p className="text-xs text-blue-400/60 mt-1">Dieser Kredit kann nur einmal verlängert werden.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Zusammenfassung */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6 border border-orange-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60">Aktive Kredite</p>
              <p className="text-2xl font-bold text-white">{aktiveKredite.length}</p>
            </div>
          </div>
          <p className="text-sm text-orange-400 font-semibold">
            Gesamt: {totalSchulden.toLocaleString('de-DE')} €
          </p>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60">Ausstehend</p>
              <p className="text-2xl font-bold text-white">{pendingKredite.length}</p>
            </div>
          </div>
          <p className="text-sm text-blue-400">Warten auf Genehmigung</p>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60">Abgeschlossen</p>
              <p className="text-2xl font-bold text-white">{abgeschlosseneKredite.length}</p>
            </div>
          </div>
          <p className="text-sm text-green-400">Erfolgreich zurückgezahlt</p>
        </div>
      </div>
      
      {/* Kredite Listen */}
      {aktiveKredite.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-400" />
            Aktive Kredite
          </h3>
          <div className="grid gap-4">
            {aktiveKredite.map(renderKreditCard)}
          </div>
        </div>
      )}
      
      {pendingKredite.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Ausstehende Kredite
          </h3>
          <div className="grid gap-4">
            {pendingKredite.map(renderKreditCard)}
          </div>
        </div>
      )}
      
      {abgeschlosseneKredite.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Abgeschlossene Kredite
          </h3>
          <div className="grid gap-4">
            {abgeschlosseneKredite.slice(0, 3).map(renderKreditCard)}
          </div>
        </div>
      )}
      
      {kredite.length === 0 && (
        <div className="glass rounded-2xl p-12 border border-white/[0.08] text-center">
          <CreditCard className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Keine Kredite</h3>
          <p className="text-white/50">Du hast aktuell keine Kredite.</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* REPAY MODAL - Kompakt im Überweisungs-Stil */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showRepayModal && selectedKredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.95), rgba(20, 20, 20, 0.98))',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4">Kredit zurückzahlen</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-white/60">Kredit</span>
                <span className="text-white font-mono">#{selectedKredit.kreditId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Kreditbetrag</span>
                <span className="text-white">{selectedKredit.betrag?.toLocaleString('de-DE')}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Gebühr</span>
                <span className="text-orange-400">+{selectedKredit.gebuehr?.toLocaleString('de-DE')}€</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between">
                <span className="text-white font-semibold">Rückzahlung</span>
                <span className="text-white font-bold text-lg">{selectedKredit.rueckzahlungsBetrag?.toLocaleString('de-DE')}€</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowRepayModal(false)}
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={processing}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleRepay}
                disabled={processing}
                className="flex-1 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#fff'
                }}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verarbeite...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Bestätigen
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* EXTEND MODAL - Kompakt im Überweisungs-Stil */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showExtendModal && selectedKredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.95), rgba(20, 20, 20, 0.98))',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4">Kredit verlängern</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Kredit</span>
                <span className="text-white font-mono">#{selectedKredit.kreditId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Rückzahlung</span>
                <span className="text-white">{selectedKredit.rueckzahlungsBetrag?.toLocaleString('de-DE')}€</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-white/60 mb-2">Verlängerung wählen:</p>
              <div className="space-y-2">
                {extensionOptions.map((opt) => {
                  const gebuehr = Math.ceil((selectedKredit.rueckzahlungsBetrag || 0) * opt.percent);
                  const isSelected = extendDays === opt.days;
                  return (
                    <button
                      key={opt.days}
                      onClick={() => setExtendDays(opt.days)}
                      className={`w-full p-3 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'bg-blue-500/20 border-blue-500/50'
                          : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold text-sm ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-white/50 mt-0.5">
                            Gebühr: {gebuehr.toLocaleString('de-DE')}€ ({(opt.percent * 100).toFixed(0)}%)
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowExtendModal(false)}
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={processing}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleExtend}
                disabled={processing}
                className="flex-1 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3))',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#fff'
                }}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verarbeite...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Bestätigen
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// PHASE 2: FINANZ-STATISTIKEN
// =============================================
export function FinanzStatistikenView({ userData }) {
  const transactions = userData?.transactions || [];
  
  // Berechne Statistiken
  const stats = useMemo(() => {
    const income = transactions.filter(t => t.amount > 0);
    const expenses = transactions.filter(t => t.amount < 0);
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
    
    // Aktuelles Gesamtvermögen berechnen
    const cash = userData?.money?.cash || 0;
    const bank = userData?.money?.bank || 0;
    const savings = userData?.money?.savings || 0;
    const totalWealth = cash + bank + savings;
    
    // Schulden berechnen
    const kredite = userData?.kredite || [];
    const totalDebt = kredite
      .filter(k => k.status === 'aktiv' || k.status === 'pending')
      .reduce((sum, k) => sum + (k.rueckzahlungsBetrag || 0), 0);
    
    // Netto-Vermögen (nach Schulden)
    const netWealth = totalWealth - totalDebt;
    
    const largestIncome = income.length > 0 
      ? Math.max(...income.map(t => t.amount))
      : 0;
    
    const largestExpense = expenses.length > 0
      ? Math.abs(Math.min(...expenses.map(t => t.amount)))
      : 0;
    
    // Kategorien gruppieren
    const categories = {};
    transactions.forEach(t => {
      const category = t.type || 'Sonstiges';
      if (!categories[category]) {
        categories[category] = { income: 0, expense: 0, count: 0 };
      }
      categories[category].count++;
      if (t.amount > 0) {
        categories[category].income += t.amount;
      } else {
        categories[category].expense += Math.abs(t.amount);
      }
    });
    
    // Letzte 30 Tage Trend
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTransactions = transactions.filter(t => {
        if (!t.timestamp) return false;
        const tDate = format(new Date(t.timestamp), 'yyyy-MM-dd');
        return tDate === dateStr;
      });
      
      const income = dayTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const expense = Math.abs(dayTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
      
      last30Days.push({
        date: format(date, 'dd.MM'),
        Einnahmen: income,
        Ausgaben: expense,
        Netto: income - expense
      });
    }
    
    return {
      totalIncome,
      totalExpenses,
      balance: netWealth, // Aktuelles Netto-Vermögen statt Transaktions-Bilanz
      totalWealth, // Gesamt-Vermögen (Bargeld + Bank + Sparkonto)
      totalDebt, // Gesamt-Schulden
      largestIncome,
      largestExpense,
      avgDaily: transactions.length > 0 ? (totalIncome - totalExpenses) / 30 : 0,
      transactionCount: transactions.length,
      categories: Object.entries(categories).map(([name, data]) => ({
        name,
        ...data,
        total: data.income + data.expense
      })),
      last30Days
    };
  }, [transactions, userData]);
  
  const categoryData = stats.categories.sort((a, b) => b.total - a.total).slice(0, 5);
  
  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <p className="text-xs text-white/50">Einnahmen (Gesamt)</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.totalIncome.toLocaleString('de-DE')} €</p>
          <p className="text-xs text-white/30 mt-1">Aus Transaktionen</p>
        </div>
        
        <div className="glass rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <p className="text-xs text-white/50">Ausgaben (Gesamt)</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.totalExpenses.toLocaleString('de-DE')} €</p>
          <p className="text-xs text-white/30 mt-1">Aus Transaktionen</p>
        </div>
        
        <div className="glass rounded-2xl p-4 border border-green-500/30 bg-green-500/5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-green-400" />
            <p className="text-xs text-white/50">Aktuelles Vermögen</p>
          </div>
          <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.balance.toLocaleString('de-DE')} €
          </p>
          <p className="text-xs text-green-400/60 mt-1">Bargeld + Bank + Sparkonto - Schulden</p>
        </div>
        
        <div className="glass rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-white/50">Ø Pro Tag (30 Tage)</p>
          </div>
          <p className={`text-2xl font-bold ${stats.avgDaily >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.avgDaily.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
          </p>
          <p className="text-xs text-white/30 mt-1">Transaktions-Durchschnitt</p>
        </div>
      </div>
      
      {/* Zusätzliche Vermögens-Details */}
      {stats.totalWealth > 0 && (
        <div className="glass rounded-2xl p-6 border border-blue-500/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            Vermögens-Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <p className="text-xs text-white/50 mb-1">Gesamt-Vermögen</p>
              <p className="text-xl font-bold text-white">{stats.totalWealth.toLocaleString('de-DE')} €</p>
              <p className="text-xs text-white/40 mt-1">Bargeld + Bank + Sparkonto</p>
            </div>
            
            {stats.totalDebt > 0 && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400/60 mb-1">Offene Schulden</p>
                <p className="text-xl font-bold text-red-400">-{stats.totalDebt.toLocaleString('de-DE')} €</p>
                <p className="text-xs text-red-400/40 mt-1">Aktive Kredite</p>
              </div>
            )}
            
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-green-400/60 mb-1">Netto-Vermögen</p>
              <p className="text-xl font-bold text-green-400">{stats.balance.toLocaleString('de-DE')} €</p>
              <p className="text-xs text-green-400/40 mt-1">Nach Abzug aller Schulden</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Einnahmen vs Ausgaben Chart */}
      <div className="glass rounded-2xl p-6 border border-white/[0.08]">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          Einnahmen vs. Ausgaben (30 Tage)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={stats.last30Days}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="#fff" opacity={0.5} />
            <YAxis stroke="#fff" opacity={0.5} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Area type="monotone" dataKey="Einnahmen" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
            <Area type="monotone" dataKey="Ausgaben" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Kategorien Pie Chart */}
      {categoryData.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-white/[0.08]">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-purple-400" />
            Top Transaktions-Kategorien
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPie>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
              </RechartsPie>
            </ResponsiveContainer>
            
            <div className="space-y-3">
              {categoryData.map((cat, index) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{cat.name}</p>
                    <p className="text-xs text-white/50">{cat.count} Transaktionen</p>
                  </div>
                  <p className="text-sm font-bold text-white">{cat.total.toLocaleString('de-DE')} €</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Top Transaktionen */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60">Größte Einnahme</p>
              <p className="text-2xl font-bold text-green-400">{stats.largestIncome.toLocaleString('de-DE')} €</p>
            </div>
          </div>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60">Größte Ausgabe</p>
              <p className="text-2xl font-bold text-red-400">{stats.largestExpense.toLocaleString('de-DE')} €</p>
            </div>
          </div>
        </div>
      </div>
      
      {stats.transactionCount === 0 && (
        <div className="glass rounded-2xl p-12 border border-white/[0.08] text-center">
          <BarChart2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Keine Transaktionen</h3>
          <p className="text-white/50">Es wurden noch keine Transaktionen aufgezeichnet.</p>
        </div>
      )}
    </div>
  );
}

// Weiter in Teil 2...
