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
  switch (status) {
    case 'Eingereicht': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'In Bearbeitung': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'Angenommen': return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'Abgelehnt': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'Zurückgezogen': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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

    // Stiller Auto-Refresh alle 5 Sekunden
    intervalRef.current = setInterval(() => {
      silentRefresh();
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  // Bestätigungs-Dialog
  const ConfirmDialog = () => {
    if (!actionConfirm) return null;
    
    const colorMap = {
      'Angenommen': 'bg-green-600 hover:bg-green-700',
      'Abgelehnt': 'bg-red-600 hover:bg-red-700',
    };
    
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <GlassCard className="p-6 max-w-md w-full animate-scale-in">
          <h3 className="text-lg font-bold mb-2">{actionConfirm.title}</h3>
          <p className="text-white/50 text-sm mb-6">{actionConfirm.description}</p>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setActionConfirm(null)} 
              className="rounded-xl border-white/10"
            >
              Abbrechen
            </Button>
            <Button 
              onClick={() => handleAction(actionConfirm.id, actionConfirm.action, actionConfirm.status)} 
              className={`rounded-xl ${colorMap[actionConfirm.status] || 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Bestätigen
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  };

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
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <ConfirmDialog />
        
        <Button 
          variant="ghost" 
          onClick={() => setSelectedId(null)} 
          className="text-white/50 hover:text-white gap-2 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zur Übersicht
        </Button>

        <GlassCard className="p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold">Bewerbung von {selected.username || 'Unbekannt'}</h2>
              <p className="text-sm text-white/35 mt-1">
                ID: {selected.id?.substring(0, 8)} | Eingereicht am {formatDateTime(selected.createdAt)}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(selected.status)}`}>
              <StatusIcon status={selected.status} />
              {selected.status}
            </span>
          </div>

          {selected.claimedByName && (
            <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              Wird bearbeitet von: <strong>{selected.claimedByName}</strong>
            </div>
          )}

          {/* Discord-Daten */}
          <div className="p-4 rounded-xl bg-[#5865F2]/[0.08] border border-[#5865F2]/20">
            <h4 className="text-xs font-semibold text-blue-300 mb-3 uppercase tracking-wider">Discord-Daten</h4>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-white/40 text-xs">Name</span>
                <p className="text-white/90 font-medium">{selected.username || '-'}</p>
              </div>
              <div>
                <span className="text-white/40 text-xs">E-Mail</span>
                <p className="text-white/90 font-medium">{selected.email || '-'}</p>
              </div>
              <div>
                <span className="text-white/40 text-xs">Discord seit</span>
                <p className="text-white/90 font-medium">{selected.discordCreatedAt ? formatDate(selected.discordCreatedAt) : '-'}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Bewerbungsdaten */}
          <div>
            <h4 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
              Bewerbungsdaten
              {fd.bewerbungType && (
                <span className="text-xs text-white/40 ml-2 px-2 py-1 rounded-full bg-white/[0.04] inline-flex items-center gap-1.5">
                  {fd.bewerbungType === 'normal' && (
                    <>
                      <FileText className="w-3 h-3 text-blue-400" />
                      <span>Team-Bewerbung</span>
                    </>
                  )}
                  {fd.bewerbungType === 'praktikum' && (
                    <>
                      <Briefcase className="w-3 h-3 text-orange-400" />
                      <span>Praktikum</span>
                    </>
                  )}
                  {fd.bewerbungType === 'uprank' && (
                    <>
                      <TrendingUp className="w-3 h-3 text-purple-400" />
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
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                <span className="text-sm text-yellow-300">Lade Verwarnungen...</span>
              </div>
            </div>
          )}
          
          {!loadingWarnings && userWarnings && (
            <div className={`p-4 border rounded-xl ${
              userWarnings.total === 0 
                ? 'bg-green-500/10 border-green-500/20' 
                : userWarnings.total >= 3 
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-yellow-500/10 border-yellow-500/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`w-4 h-4 ${
                  userWarnings.total === 0 
                    ? 'text-green-400' 
                    : userWarnings.total >= 3 
                      ? 'text-red-400'
                      : 'text-yellow-400'
                }`} />
                <h4 className="text-sm font-semibold text-white">
                  Server Verwarnungen: {userWarnings.total}
                </h4>
              </div>
              {userWarnings.total > 0 && (
                <>
                  {userWarnings.total >= 3 && (
                    <p className="text-xs text-red-300 mb-2">
                      ⚠️ ACHTUNG: {userWarnings.total} Verwarnungen! Bewerbung mit Vorsicht annehmen.
                    </p>
                  )}
                  <div className="space-y-2 mt-2">
                    {userWarnings.warnings.slice(0, 3).map((warn, idx) => (
                      <div key={idx} className="text-xs bg-black/20 p-2 rounded">
                        <div className="text-white/60">{new Date(warn.date).toLocaleDateString('de-DE')}</div>
                        <div className="text-white/80">{warn.reason}</div>
                        <div className="text-white/40">Von: {warn.admin}</div>
                      </div>
                    ))}
                    {userWarnings.total > 3 && (
                      <div className="text-xs text-white/40 text-center">
                        + {userWarnings.total - 3} weitere Verwarnungen
                      </div>
                    )}
                  </div>
                </>
              )}
              {userWarnings.total === 0 && (
                <p className="text-xs text-green-300">Keine Verwarnungen vorhanden ✓</p>
              )}
            </div>
          )}

          <Separator className="bg-white/[0.06]" />

          {/* Aktionen */}
          <div className="flex flex-wrap gap-3">
            {!selected.claimedBy && selected.status === 'Eingereicht' && (
              <Button 
                onClick={() => handleAction(selected.id, 'claim')} 
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <User className="w-4 h-4 mr-2" />}
                Übernehmen
              </Button>
            )}
            {selected.claimedBy === admin?.discordUserId && selected.status !== 'Angenommen' && selected.status !== 'Abgelehnt' && (
              <>
                <Button 
                  onClick={() => handleAction(selected.id, 'unclaim')} 
                  disabled={actionLoading}
                  variant="outline" 
                  className="rounded-xl border-white/10"
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
                  className="bg-green-600 hover:bg-green-700 rounded-xl"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Annehmen
                </Button>
                <Button 
                  disabled={actionLoading}
                  onClick={() => {
                    setShowRejectModal(true);
                    setRejectReason('');
                  }} 
                  className="bg-red-600 hover:bg-red-700 rounded-xl"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Ablehnen
                </Button>
              </>
            )}
          </div>
        </GlassCard>
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
    <div className="p-6 space-y-6">
      <ConfirmDialog />
      
      {/* Reject Modal mit Pflicht-Grund */}
      {showRejectModal && selected && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0A0B0F] border border-red-500/20 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Bewerbung ablehnen</h3>
                <p className="text-sm text-white/40">Von: {selected.username}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-white/60">Ablehnungsgrund *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Bitte gib einen Grund für die Ablehnung an (wird dem Bewerber mitgeteilt)..."
                className="w-full min-h-[100px] px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
              />
              <p className="text-xs text-white/30">Mindestens 10 Zeichen</p>
            </div>

            {userWarnings && userWarnings.total >= 3 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Bewerber hat {userWarnings.total} Verwarnungen
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 rounded-xl border-white/10"
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
                className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl"
                disabled={actionLoading || rejectReason.trim().length < 10}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                Bewerbung ablehnen
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bewerbungen</h1>
          <p className="text-white/40 text-sm mt-1">
            {bewerbungen.length} insgesamt
            {admin && (
              <span className="ml-2 text-blue-400">| {admin.roleName} (Lv.{admin.roleLevel})</span>
            )}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => fetchBewerbungen()} 
          className="gap-2 rounded-xl border-white/10"
        >
          <RefreshCw className="w-4 h-4" /> Aktualisieren
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Name oder ID suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/[0.04] border-white/[0.08] rounded-xl"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'Eingereicht', 'In Bearbeitung', 'Angenommen', 'Abgelehnt'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className={`rounded-xl ${filter === f ? '' : 'border-white/10'}`}
              size="sm"
            >
              {f === 'all' ? `Alle (${bewerbungen.length})` : `${f} (${bewerbungen.filter(b => b.status === f).length})`}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <Filter className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">Keine Bewerbungen gefunden</p>
          </GlassCard>
        ) : (
          filtered.map(b => (
            <GlassCard 
              key={b.id} 
              hover 
              className="p-5 cursor-pointer transition-all hover:border-blue-500/20" 
              onClick={() => setSelectedId(b.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <span className="font-semibold text-white">{b.username || 'Unbekannt'}</span>
                    <span className="text-white/30 text-xs">#{b.id?.substring(0, 8)}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(b.status)}`}>
                      <StatusIcon status={b.status} />
                      {b.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/30">
                    <span>{formatDateTime(b.createdAt)}</span>
                    {b.email && <span>{b.email}</span>}
                    {b.claimedByName && (
                      <span className="text-yellow-300/70">Bearbeitet von: {b.claimedByName}</span>
                    )}
                  </div>
                </div>
                <Eye className="w-5 h-5 text-white/20" />
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
