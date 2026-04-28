'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Loader2, RefreshCw, ArrowLeft, User, AlertTriangle,
  Clock, CheckCircle2, XCircle, Filter, Search, Eye, Shield,
  FileText, Briefcase, TrendingUp, Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusColor(status) {
  // Monochromer Überweisungsstil mit subtilen Bedeutungs-Akzenten
  switch (status) {
    case 'Eingereicht': return 'bg-blue-500/10 text-blue-300/90 border-blue-500/25';
    case 'In Bearbeitung': return 'bg-yellow-500/10 text-yellow-300/90 border-yellow-500/25';
    case 'Angenommen': return 'bg-green-500/10 text-green-300/90 border-green-500/25';
    case 'Abgelehnt': return 'bg-red-500/10 text-red-300/90 border-red-500/25';
    case 'Zurückgezogen': return 'bg-white/[0.04] text-white/55 border-white/[0.1]';
    default: return 'bg-white/[0.04] text-white/55 border-white/[0.1]';
  }
}

function StatusIcon({ status }) {
  switch (status) {
    case 'Eingereicht': return <Clock className="w-3.5 h-3.5" />;
    case 'In Bearbeitung': return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    case 'Angenommen': return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'Abgelehnt': return <XCircle className="w-3.5 h-3.5" />;
    case 'Zurückgezogen': return <AlertTriangle className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
}

function DetailRow({ label, value }) {
  if (!value && value !== false && value !== 0) return null;
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 py-2 border-b border-white/[0.04]">
      <span className="text-white/40 text-sm">{label}</span>
      <span className="text-white/80 text-sm whitespace-pre-wrap">{String(value)}</span>
    </div>
  );
}

export default function AdminBewerbungenPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [bewerbungen, setBewerbungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionConfirm, setActionConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [userWarnings, setUserWarnings] = useState(null);
  const [loadingWarnings, setLoadingWarnings] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const intervalRef = useRef(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        if (!data.admin) {
          router.push('/admin');
          return;
        }
        setAdmin(data.admin);
        await fetchBewerbungen();
        initialLoadDone.current = true;
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    })();

    // Stiller Auto-Refresh - Egress-optimiert: 30s + visibility-aware
    intervalRef.current = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      silentRefresh();
    }, 30000);

    const onVis = () => {
      if (document.visibilityState === 'visible') silentRefresh();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, []);

  const fetchBewerbungen = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bewerbungen');
      const data = await res.json();
      setBewerbungen(data.bewerbungen || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Komplett stiller Refresh - kein Loading, kein Flicker
  const silentRefresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bewerbungen');
      const data = await res.json();
      if (data.bewerbungen) {
        setBewerbungen(data.bewerbungen);
      }
    } catch (e) {
      // Still fehlschlagen - kein UI-Update
    }
  }, []);

  // Aktuelle ausgewählte Bewerbung aus der Liste
  const selected = bewerbungen.find(b => b.id === selectedId) || null;

  // Verwarnungen laden wenn eine Bewerbung ausgewählt wird
  useEffect(() => {
    if (selected && selected.discordUserId) {
      fetchUserWarnings(selected.discordUserId);
    } else {
      setUserWarnings(null);
    }
  }, [selectedId]);

  const fetchUserWarnings = async (discordUserId) => {
    setLoadingWarnings(true);
    try {
      const res = await fetch(`/api/hh/user-warnings?userId=${discordUserId}`);
      if (res.ok) {
        const data = await res.json();
        setUserWarnings(data);
      } else {
        setUserWarnings({ warnings: [], total: 0 });
      }
    } catch (e) {
      console.error('Error loading warnings:', e);
      setUserWarnings({ warnings: [], total: 0 });
    } finally {
      setLoadingWarnings(false);
    }
  };

  const handleAction = async (id, action, status, reason = null) => {
    setActionConfirm(null);
    setActionLoading(true);
    try {
      const body = action ? { action } : { status, reason };
      const res = await fetch(`/api/admin/bewerbungen/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        const actionText = action === 'claim' ? 'übernommen' : 
                          action === 'unclaim' ? 'freigegeben' :
                          status === 'Angenommen' ? 'angenommen' :
                          status === 'Abgelehnt' ? 'abgelehnt' : 'aktualisiert';
        
        toast.success(`Bewerbung ${actionText}`, {
          description: `Die Bewerbung wurde erfolgreich ${actionText}.`,
        });
        
        // Liste still aktualisieren
        if (data.bewerbung) {
          setBewerbungen(prev => prev.map(b => b.id === id ? data.bewerbung : b));
        } else {
          await silentRefresh();
        }
      } else {
        toast.error('Fehler', { description: data.error || 'Aktion fehlgeschlagen' });
      }
    } catch (e) {
      console.error(e);
      toast.error('Fehler', { description: 'Netzwerkfehler aufgetreten' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !bewerbungen.length) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
      </div>
    );
  }

  // Bestätigungs-Dialog
  const ConfirmDialog = () => {
    if (!actionConfirm) return null;
    
    const acceptStyle = { background: 'linear-gradient(135deg, rgba(34,197,94,0.85), rgba(22,163,74,0.95))', color: 'white' };
    const rejectStyle = { background: 'linear-gradient(135deg, rgba(239,68,68,0.85), rgba(220,38,38,0.95))', color: 'white' };
    const isAccept = actionConfirm.status === 'Angenommen';
    
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px) saturate(160%)', WebkitBackdropFilter: 'blur(16px) saturate(160%)' }}
      >
        <div
          className="p-6 max-w-md w-full rounded-2xl animate-scale-in relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(18,18,20,0.95) 0%, rgba(10,10,12,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 60px -12px rgba(0,0,0,0.8)',
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }}
          />
          <h3 className="text-[16px] font-semibold text-white tracking-tight mb-1.5">{actionConfirm.title}</h3>
          <p className="text-white/50 text-[13px] mb-6 leading-relaxed">{actionConfirm.description}</p>
          <div className="flex gap-2 justify-end">
            <Button 
              onClick={() => setActionConfirm(null)} 
              className="rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white/75 hover:text-white h-10 px-4 text-[12.5px] font-medium"
            >
              Abbrechen
            </Button>
            <Button 
              onClick={() => handleAction(actionConfirm.id, actionConfirm.action, actionConfirm.status)} 
              className="rounded-xl h-10 px-4 text-[12.5px] font-semibold border-0"
              style={isAccept ? acceptStyle : rejectStyle}
            >
              Bestätigen
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Reject Modal als JSX-Variable (NICHT als Komponente, sonst Focus-Loss beim Tippen!)
  const rejectModalJsx = (showRejectModal && selected) ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px) saturate(160%)', WebkitBackdropFilter: 'blur(16px) saturate(160%)' }}
    >
      <div
        className="rounded-2xl max-w-md w-full p-6 space-y-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(18,18,20,0.96) 0%, rgba(10,10,12,0.98) 100%)',
          border: '1px solid rgba(239,68,68,0.22)',
          boxShadow: '0 24px 60px -12px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.35), transparent)' }}
        />
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }}
          >
            <XCircle className="w-5 h-5 text-red-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-white tracking-tight">Bewerbung ablehnen</h3>
            <p className="text-[12px] text-white/45 truncate">Von: {selected.username}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12.5px] text-white/65 font-medium">Ablehnungsgrund *</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Bitte gib einen Grund für die Ablehnung an (wird dem Bewerber mitgeteilt)..."
            className="w-full min-h-[110px] px-3 py-2.5 bg-white/[0.04] border border-white/[0.1] rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 resize-none text-[13px] leading-relaxed"
          />
          <p className="text-[11px] text-white/30">Mindestens 10 Zeichen</p>
        </div>

        {userWarnings && userWarnings.total >= 3 && (
          <div
            className="p-3 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
          >
            <AlertTriangle className="w-4 h-4 text-red-300 flex-shrink-0" />
            <p className="text-[12px] text-red-200/90">
              Bewerber hat {userWarnings.total} Verwarnungen
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            onClick={() => {
              setShowRejectModal(false);
              setRejectReason('');
            }}
            className="flex-1 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white/75 hover:text-white text-[12.5px] font-medium"
            disabled={actionLoading}
          >
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              if (rejectReason.trim().length < 10) {
                toast.error('Ablehnungsgrund zu kurz', {
                  description: 'Bitte gib mindestens 10 Zeichen ein.'
                });
                return;
              }
              setShowRejectModal(false);
              handleAction(selected.id, null, 'Abgelehnt', rejectReason.trim());
              setRejectReason('');
            }}
            className="flex-1 h-10 rounded-xl border-0 text-white text-[12.5px] font-semibold"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.85), rgba(220,38,38,0.95))',
              boxShadow: '0 4px 14px -4px rgba(239,68,68,0.4)',
            }}
            disabled={actionLoading || rejectReason.trim().length < 10}
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
            Ablehnen
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  // DETAIL-ANSICHT
  if (selected) {
    // formData richtig auslesen - unterstützt verschiedene Formate
    let fd = {};
    if (selected.formData) {
      fd = typeof selected.formData === 'string' ? (() => { try { return JSON.parse(selected.formData); } catch(e) { return {}; } })() : selected.formData;
    } else if (selected.form_data) {
      fd = typeof selected.form_data === 'string' ? (() => { try { return JSON.parse(selected.form_data); } catch(e) { return {}; } })() : selected.form_data;
    }

    return (
      <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
        <ConfirmDialog />
        {rejectModalJsx}
        
        <Button 
          onClick={() => setSelectedId(null)} 
          className="text-white/55 hover:text-white gap-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] h-10 px-4 text-[12.5px] font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zur Übersicht
        </Button>

        <div
          className="p-6 md:p-8 space-y-6 rounded-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }}
          />
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">Bewerbung von {selected.username || 'Unbekannt'}</h2>
              <p className="text-[12px] text-white/40 mt-1.5 font-mono">
                ID: {selected.id?.substring(0, 8)} · Eingereicht am {formatDateTime(selected.createdAt)}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium border ${getStatusColor(selected.status)}`}>
              <StatusIcon status={selected.status} />
              {selected.status}
            </span>
          </div>

          {selected.claimedByName && (
            <div
              className="p-3 rounded-xl text-[12.5px] flex items-center gap-2"
              style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: 'rgba(253,224,71,0.9)' }}
            >
              <User className="w-4 h-4" />
              <span>Wird bearbeitet von: <strong className="text-yellow-200">{selected.claimedByName}</strong></span>
            </div>
          )}

          {/* Discord-Daten */}
          <div
            className="p-4 rounded-xl"
            style={{ background: 'rgba(88,101,242,0.05)', border: '1px solid rgba(88,101,242,0.15)' }}
          >
            <h4 className="text-[10.5px] font-semibold text-indigo-300/90 mb-3 uppercase tracking-[0.1em]">Discord-Daten</h4>
            <div className="grid sm:grid-cols-3 gap-4 text-[13px]">
              <div>
                <span className="text-white/35 text-[10.5px] uppercase tracking-wider">Name</span>
                <p className="text-white/90 font-medium mt-0.5">{selected.username || '-'}</p>
              </div>
              <div>
                <span className="text-white/35 text-[10.5px] uppercase tracking-wider">E-Mail</span>
                <p className="text-white/90 font-medium mt-0.5 truncate">{selected.email || '-'}</p>
              </div>
              <div>
                <span className="text-white/35 text-[10.5px] uppercase tracking-wider">Discord seit</span>
                <p className="text-white/90 font-medium mt-0.5">{selected.discordCreatedAt ? formatDate(selected.discordCreatedAt) : '-'}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Bewerbungsdaten */}
          <div>
            <h4 className="text-[13px] font-semibold text-white/80 mb-3 flex items-center gap-2 tracking-tight">
              Bewerbungsdaten
              {fd.bewerbungType && (
                <span
                  className="text-[10.5px] text-white/60 ml-1 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 border"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  {fd.bewerbungType === 'normal' && (
                    <>
                      <FileText className="w-3 h-3 text-white/60" />
                      <span>Team-Bewerbung</span>
                    </>
                  )}
                  {fd.bewerbungType === 'praktikum' && (
                    <>
                      <Briefcase className="w-3 h-3 text-orange-300" />
                      <span>Praktikum</span>
                    </>
                  )}
                  {fd.bewerbungType === 'uprank' && (
                    <>
                      <TrendingUp className="w-3 h-3 text-purple-300" />
                      <span>Uprank</span>
                    </>
                  )}
                  {fd.bewerbungType === 'beta_tester' && (
                    <>
                      <Sparkles className="w-3 h-3" style={{ color: 'var(--theme-accent)' }} />
                      <span>Beta Tester</span>
                    </>
                  )}
                </span>
              )}
            </h4>
            <div className="space-y-0">
              {/* NORMALE BEWERBUNG */}
              {(!fd.bewerbungType || fd.bewerbungType === 'normal') && (
                <>
                  <DetailRow label="Vorname" value={fd.vorname} />
                  <DetailRow label="Alter" value={fd.alter} />
                  <DetailRow label="Roblox-Name" value={fd.robloxName} />
                  <DetailRow label="Spielzeit" value={fd.spielzeit} />
                  <DetailRow label="Fraktion" value={fd.fraktion} />
                  <DetailRow label="Anderer Server" value={fd.andererServer} />
                  <DetailRow label="Bann/Warn" value={fd.bannWarn} />
                  <DetailRow label="Warum ins Team?" value={fd.warumTeam} />
                  <DetailRow label="Geduldig?" value={fd.geduldig} />
                  <DetailRow label="Stunden/Woche" value={fd.stundenProWoche} />
                  <DetailRow label="Fail-RP Lösung" value={fd.failRpLoesung} />
                  <DetailRow label="Streit-Lösung" value={fd.streitLoesung} />
                  <DetailRow label="Hat Mikrofon" value={fd.hatMikro ? 'Ja' : 'Nein'} />
                  <DetailRow label="Kennt Regeln" value={fd.kenntRegeln ? 'Ja' : 'Nein'} />
                  <DetailRow label="Bleibt nett" value={fd.bleibtNett ? 'Ja' : 'Nein'} />
                </>
              )}
              
              {/* PRAKTIKUM BEWERBUNG */}
              {fd.bewerbungType === 'praktikum' && (
                <>
                  <DetailRow label="Vorname" value={fd.vorname} />
                  <DetailRow label="Alter" value={fd.alter} />
                  <DetailRow label="Roblox-Name" value={fd.robloxName} />
                  <DetailRow label="Fraktion" value={fd.fraktion} />
                  <DetailRow label="Spielzeit/Erfahrung" value={fd.spielzeit} />
                  <DetailRow label="Warum Praktikum?" value={fd.warumTeam} />
                  <DetailRow label="Stunden/Woche" value={fd.stundenProWoche} />
                  <DetailRow label="Hat Mikrofon" value={fd.hatMikro ? 'Ja' : 'Nein'} />
                  <DetailRow label="Kennt Regeln" value={fd.kenntRegeln ? 'Ja' : 'Nein'} />
                  <DetailRow label="Bleibt nett" value={fd.bleibtNett ? 'Ja' : 'Nein'} />
                </>
              )}
              
              {/* UPRANK BEWERBUNG */}
              {fd.bewerbungType === 'uprank' && (
                <>
                  <DetailRow label="Seit wann im Team" value={fd.seitWannImTeam} />
                  <DetailRow label="Aktuelle Aufgaben" value={fd.aktuelleAufgaben} />
                  <DetailRow label="Gewünschter Rang" value={fd.gewuenschterRang} />
                  <DetailRow label="Warum Uprank?" value={fd.warumUprank} />
                  <DetailRow label="Zusätzliche Verantwortung" value={fd.zusaetzlicheVerantwortung} />
                  <DetailRow label="Stunden/Woche" value={fd.stundenProWoche} />
                </>
              )}
              
              {/* BETA TESTER BEWERBUNG */}
              {fd.bewerbungType === 'beta_tester' && (
                <>
                  <DetailRow label="Name" value={fd.name} />
                  <DetailRow label="Discord Name" value={fd.discordName} />
                  <DetailRow label="Alter" value={fd.alter} />
                  <DetailRow label="Motivation" value={fd.warum} />
                  <DetailRow label="Testing-Erfahrung" value={fd.erfahrung} />
                  <DetailRow label="Verfügbarkeit" value={fd.verfuegbarkeit} />
                  <DetailRow label="Features testen" value={fd.features} />
                  <DetailRow label="Bug-Handling" value={fd.bugs} />
                  <DetailRow label="Feedback geben" value={fd.feedback} />
                  <DetailRow label="Kommunikation" value={fd.kommunikation} />
                  <DetailRow label="Erwartungen" value={fd.erwartungen} />
                  <DetailRow label="Stärken" value={fd.staerken} />
                  <DetailRow label="Schwächen" value={fd.schwaechen} />
                  <DetailRow label="Zusätzliches" value={fd.zusaetzlich} />
                </>
              )}
            </div>
          </div>

          {/* Verwarnungen Anzeige */}
          {loadingWarnings && (
            <div
              className="p-4 rounded-xl flex items-center gap-2"
              style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}
            >
              <Loader2 className="w-4 h-4 animate-spin text-yellow-300" />
              <span className="text-[12.5px] text-yellow-200/90">Lade Verwarnungen...</span>
            </div>
          )}
          
          {!loadingWarnings && userWarnings && (() => {
            const warningStyle = userWarnings.total === 0
              ? { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', accent: 'rgba(134,239,172,0.9)' }
              : userWarnings.total >= 3
                ? { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', accent: 'rgba(252,165,165,0.9)' }
                : { bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)', accent: 'rgba(253,224,71,0.9)' };
            return (
              <div
                className="p-4 rounded-xl"
                style={{ background: warningStyle.bg, border: `1px solid ${warningStyle.border}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: warningStyle.accent }} />
                  <h4 className="text-[13px] font-semibold text-white tracking-tight">
                    Server Verwarnungen: {userWarnings.total}
                  </h4>
                </div>
                {userWarnings.total > 0 && (
                  <>
                    {userWarnings.total >= 3 && (
                      <p className="text-[11.5px] text-red-200/90 mb-2">
                        ⚠️ ACHTUNG: {userWarnings.total} Verwarnungen! Bewerbung mit Vorsicht annehmen.
                      </p>
                    )}
                    <div className="space-y-2 mt-2">
                      {userWarnings.warnings.slice(0, 3).map((warn, idx) => (
                        <div key={idx} className="text-[11.5px] p-2.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div className="text-white/55 font-mono text-[10.5px]">{new Date(warn.date).toLocaleDateString('de-DE')}</div>
                          <div className="text-white/85 mt-0.5">{warn.reason}</div>
                          <div className="text-white/35 text-[10.5px] mt-0.5">Von: {warn.admin}</div>
                        </div>
                      ))}
                      {userWarnings.total > 3 && (
                        <div className="text-[11px] text-white/40 text-center pt-1">
                          + {userWarnings.total - 3} weitere Verwarnungen
                        </div>
                      )}
                    </div>
                  </>
                )}
                {userWarnings.total === 0 && (
                  <p className="text-[11.5px]" style={{ color: warningStyle.accent }}>Keine Verwarnungen vorhanden ✓</p>
                )}
              </div>
            );
          })()}

          <Separator className="bg-white/[0.06]" />

          {/* Aktionen */}
          {selected.status === 'Zurückgezogen' ? (
            <div
              className="p-4 rounded-xl flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <AlertTriangle className="w-5 h-5 text-white/50 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-white/80">Bewerbung wurde vom Bewerber zurückgezogen</p>
                <p className="text-[11.5px] text-white/40 mt-0.5">Es sind keine weiteren Aktionen möglich.</p>
              </div>
            </div>
          ) : selected.status === 'Angenommen' ? (
            <div
              className="p-4 rounded-xl flex items-center gap-3"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <CheckCircle2 className="w-5 h-5 text-green-300 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-green-200">Bewerbung wurde angenommen</p>
                <p className="text-[11.5px] text-white/45 mt-0.5">Der Vorgang ist abgeschlossen.</p>
              </div>
            </div>
          ) : selected.status === 'Abgelehnt' ? (
            <div
              className="p-4 rounded-xl flex items-center gap-3"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <XCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-red-200">Bewerbung wurde abgelehnt</p>
                <p className="text-[11.5px] text-white/45 mt-0.5">Der Vorgang ist abgeschlossen.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {!selected.claimedBy && selected.status === 'Eingereicht' && (
                <Button 
                  onClick={() => handleAction(selected.id, 'claim')} 
                  disabled={actionLoading}
                  className="h-10 rounded-xl text-[12.5px] font-semibold text-black border-0"
                  style={{
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)',
                    boxShadow: '0 4px 12px -4px rgba(0,0,0,0.5)',
                  }}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <User className="w-4 h-4 mr-2" />}
                  Übernehmen
                </Button>
              )}
              {selected.claimedBy === admin?.discordUserId && (
                <>
                  <Button 
                    onClick={() => handleAction(selected.id, 'unclaim')} 
                    disabled={actionLoading}
                    className="h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white/75 hover:text-white text-[12.5px] font-medium"
                  >
                    Freigeben
                  </Button>
                  <Button 
                    disabled={actionLoading}
                    onClick={() => setActionConfirm({
                      id: selected.id,
                      action: null,
                      status: 'Angenommen',
                      title: 'Bewerbung annehmen?',
                      description: `Möchtest du die Bewerbung von ${selected.username} wirklich annehmen? Der Bewerber wird per Discord benachrichtigt.`
                    })} 
                    className="h-10 rounded-xl border-0 text-white text-[12.5px] font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.85), rgba(22,163,74,0.95))',
                      boxShadow: '0 4px 14px -4px rgba(34,197,94,0.35)',
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Annehmen
                  </Button>
                  <Button 
                    disabled={actionLoading}
                    onClick={() => {
                      setShowRejectModal(true);
                      setRejectReason('');
                    }} 
                    className="h-10 rounded-xl border-0 text-white text-[12.5px] font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, rgba(239,68,68,0.85), rgba(220,38,38,0.95))',
                      boxShadow: '0 4px 14px -4px rgba(239,68,68,0.35)',
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Ablehnen
                  </Button>
                </>
              )}
              {selected.claimedBy && selected.claimedBy !== admin?.discordUserId && (
                <div
                  className="p-3 rounded-xl text-[12.5px] flex items-center gap-2"
                  style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', color: 'rgba(253,224,71,0.9)' }}
                >
                  <User className="w-4 h-4" />
                  <span>Diese Bewerbung wird aktuell von <strong className="text-yellow-200">{selected.claimedByName}</strong> bearbeitet.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // LISTE
  const filtered = bewerbungen.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!b.username?.toLowerCase().includes(s) && !b.id?.includes(s) && !b.email?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
      <ConfirmDialog />
      {rejectModalJsx}
      
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">Bewerbungen</h1>
          <p className="text-white/45 text-[13px] mt-1.5">
            {bewerbungen.length} insgesamt
            {admin && (
              <span className="ml-2 text-white/70">· {admin.roleName} (Lv.{admin.roleLevel})</span>
            )}
          </p>
        </div>
        <Button 
          onClick={() => fetchBewerbungen()} 
          className="gap-2 h-10 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] hover:border-white/[0.15] text-white/75 hover:text-white text-[12.5px] font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Aktualisieren
        </Button>
      </div>

      {/* Search + Filter Bar */}
      <div
        className="p-3 md:p-4 rounded-2xl space-y-3"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
          <Input
            placeholder="Name, Email oder ID suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/30 focus:border-white/30 rounded-xl"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'Eingereicht', 'In Bearbeitung', 'Angenommen', 'Abgelehnt', 'Zurückgezogen'].map(f => {
            const count = f === 'all' ? bewerbungen.length : bewerbungen.filter(b => b.status === f).length;
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
                  active
                    ? 'text-white'
                    : 'text-white/55 hover:text-white/85 hover:bg-white/[0.04]'
                }`}
                style={active ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                  borderColor: 'rgba(255,255,255,0.18)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                } : {
                  background: 'transparent',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              >
                {f === 'all' ? 'Alle' : f}
                <span className="ml-1.5 text-[10.5px] text-white/40 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2.5">
        {filtered.length === 0 ? (
          <div
            className="p-12 text-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-white/[0.06]"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }}
            >
              <Filter className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-white/50 text-[13.5px] font-medium">Keine Bewerbungen gefunden</p>
            <p className="text-white/25 text-[11.5px] mt-1">Passe deinen Filter oder deine Suche an</p>
          </div>
        ) : (
          filtered.map(b => (
            <button
              key={b.id} 
              type="button"
              onClick={() => setSelectedId(b.id)}
              className="w-full text-left p-4 md:p-5 rounded-xl cursor-pointer transition-all group hover:translate-x-0.5"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <span className="font-semibold text-white text-[14px] tracking-tight truncate">{b.username || 'Unbekannt'}</span>
                    <span className="text-white/30 text-[10.5px] font-mono">#{b.id?.substring(0, 8)}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium border ${getStatusColor(b.status)}`}>
                      <StatusIcon status={b.status} />
                      {b.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11.5px] text-white/35 flex-wrap">
                    <span>{formatDateTime(b.createdAt)}</span>
                    {b.email && <span className="truncate max-w-[180px]">{b.email}</span>}
                    {b.claimedByName && (
                      <span className="text-yellow-300/75">Bearbeitet von: {b.claimedByName}</span>
                    )}
                  </div>
                </div>
                <Eye className="w-4 h-4 text-white/25 group-hover:text-white/60 transition-colors flex-shrink-0" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
