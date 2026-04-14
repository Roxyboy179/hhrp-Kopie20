'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Loader2, FileText, RefreshCw, ChevronRight, ArrowLeft, 
  AlertTriangle, Clock, CheckCircle2, XCircle, Plus,
  User, Gamepad2, Users, Target, MessageSquare, Shield, Mic, BookOpen, Heart
} from 'lucide-react';

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
}

function getStatusStyle(status) {
  switch (status) {
    case 'Eingereicht': return 'bg-white/[0.04] text-white/50 border-white/[0.08]';
    case 'In Bearbeitung': return 'bg-yellow-500/10 text-yellow-300/70 border-yellow-500/20';
    case 'Angenommen': return 'bg-green-500/10 text-green-300/70 border-green-500/20';
    case 'Abgelehnt': return 'bg-red-500/10 text-red-300/70 border-red-500/20';
    case 'Zurückgezogen': return 'bg-white/[0.02] text-white/30 border-white/[0.05]';
    default: return 'bg-white/[0.03] text-white/40 border-white/[0.06]';
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

export default function MeineBewerbungenPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bewerbungen, setBewerbungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [withdrawConfirm, setWithdrawConfirm] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/'); return; }
    if (user) fetchBewerbungen();
    setTimeout(() => setVisible(true), 100);
    
    // Auto-Refresh alle 10 Sekunden
    const interval = setInterval(() => {
      if (user) silentRefresh();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [user, authLoading, router]);

  const fetchBewerbungen = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bewerbungen');
      const data = await res.json();
      setBewerbungen(data.bewerbungen || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  
  // Stiller Refresh ohne Loading-State
  const silentRefresh = async () => {
    try {
      const res = await fetch('/api/bewerbungen');
      const data = await res.json();
      if (data.bewerbungen) {
        setBewerbungen(data.bewerbungen);
      }
    } catch (e) {
      // Fehler still ignorieren
    }
  };

  const handleWithdraw = async (id) => {
    setWithdrawConfirm(null);
    try {
      const res = await fetch(`/api/bewerbungen/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Bewerbung zurückgezogen');
        await fetchBewerbungen();
        setSelected(null);
      } else {
        toast.error('Fehler', { description: 'Konnte nicht zurückgezogen werden.' });
      }
    } catch (e) {
      toast.error('Netzwerkfehler');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-white/30" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen px-4 py-8">
      {/* Zurückziehen Bestätigung */}
      {withdrawConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="p-6 max-w-md w-full rounded-2xl bg-[#111] border border-white/[0.06] animate-scale-in">
            <h3 className="text-lg font-bold text-white/90 mb-2">Bewerbung zurückziehen?</h3>
            <p className="text-white/35 text-sm mb-6">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setWithdrawConfirm(null)} className="rounded-xl border-white/10 text-white/50">
                Abbrechen
              </Button>
              <Button onClick={() => handleWithdraw(withdrawConfirm)} className="bg-red-600 hover:bg-red-700 rounded-xl">
                Zurückziehen
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.push('/')} className={`mb-8 text-white/30 hover:text-white/60 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>

        <div className={`flex items-end justify-between mb-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-white/90">Meine Bewerbungen</h1>
            <p className="text-white/30 mt-2">{bewerbungen.length} Bewerbung{bewerbungen.length !== 1 ? 'en' : ''}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchBewerbungen} className="rounded-xl border-white/[0.06] text-white/40 hover:text-white/70">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={() => router.push('/bewerbung')} className="bg-white text-black hover:bg-white/90 rounded-xl font-semibold">
              <Plus className="w-4 h-4 mr-1" /> Neue Bewerbung
            </Button>
          </div>
        </div>

        {bewerbungen.length === 0 ? (
          <div className={`p-16 rounded-3xl bg-white/[0.015] border border-white/[0.04] text-center transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <FileText className="w-14 h-14 text-white/10 mx-auto mb-5" />
            <h3 className="text-xl font-semibold text-white/60 mb-2">Noch keine Bewerbungen</h3>
            <p className="text-white/25 mb-8">Du hast noch keine Bewerbung eingereicht.</p>
            <Button onClick={() => router.push('/bewerbung')} className="bg-white text-black hover:bg-white/90 rounded-xl font-semibold">
              Jetzt bewerben
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bewerbungen.map((b, i) => {
              const fd = b.formData || b.form_data || {};
              const isOpen = selected === b.id;
              return (
                <div
                  key={b.id}
                  className={`rounded-2xl bg-white/[0.015] border border-white/[0.04] overflow-hidden transition-all duration-500 hover:bg-white/[0.025] hover:border-white/[0.07] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${i * 100 + 200}ms` }}
                >
                  {/* Header */}
                  <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setSelected(isOpen ? null : b.id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-white/80">{formatDateTime(b.createdAt)}</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${getStatusStyle(b.status)}`}>
                          <StatusIcon status={b.status} />
                          {b.status}
                        </span>
                      </div>
                      {b.claimedByName && (
                        <p className="text-white/25 text-xs mt-1.5">Bearbeitet von: {b.claimedByName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {(b.status === 'Eingereicht' || b.status === 'In Bearbeitung') && (
                        <Button
                          variant="ghost" size="sm"
                          onClick={(e) => { e.stopPropagation(); setWithdrawConfirm(b.id); }}
                          className="rounded-xl text-red-400/50 hover:text-red-400 hover:bg-red-500/10 text-xs"
                        >
                          Zurückziehen
                        </Button>
                      )}
                      <ChevronRight className={`w-5 h-5 text-white/15 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Details */}
                  <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-5 pb-6 pt-2">
                      <div className="divider-gradient mb-5" />
                      
                      {/* Bewerbungstyp anzeigen */}
                      {fd.bewerbungType && (
                        <div className="mb-4 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] inline-flex items-center gap-2">
                          {fd.bewerbungType === 'normal' && (
                            <>
                              <FileText className="w-3 h-3 text-blue-400" />
                              <span className="text-white/40 text-xs">Team-Bewerbung</span>
                            </>
                          )}
                          {fd.bewerbungType === 'praktikum' && (
                            <>
                              <Briefcase className="w-3 h-3 text-orange-400" />
                              <span className="text-white/40 text-xs">Praktikum-Bewerbung</span>
                            </>
                          )}
                          {fd.bewerbungType === 'uprank' && (
                            <>
                              <TrendingUp className="w-3 h-3 text-purple-400" />
                              <span className="text-white/40 text-xs">Uprank-Bewerbung</span>
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* NORMALE BEWERBUNG */}
                      {(!fd.bewerbungType || fd.bewerbungType === 'normal') && (
                        <>
                          <div className="grid md:grid-cols-2 gap-5">
                            {[
                              { icon: <User className="w-3 h-3" />, label: 'Vorname', value: fd.vorname },
                              { icon: <User className="w-3 h-3" />, label: 'Alter', value: fd.alter },
                              { icon: <Gamepad2 className="w-3 h-3" />, label: 'Roblox Name', value: fd.robloxName },
                              { icon: <Clock className="w-3 h-3" />, label: 'Spielzeit', value: fd.spielzeit },
                              { icon: <Users className="w-3 h-3" />, label: 'Fraktion', value: fd.fraktion },
                              { icon: <Clock className="w-3 h-3" />, label: 'Stunden/Woche', value: fd.stundenProWoche },
                              { icon: <MessageSquare className="w-3 h-3" />, label: 'Anderer Server', value: fd.andererServer },
                              { icon: <AlertTriangle className="w-3 h-3" />, label: 'Bann/Warn', value: fd.bannWarn },
                            ].map((item, j) => item.value ? (
                              <div key={j}>
                                <p className="text-white/25 text-xs mb-1 flex items-center gap-1.5">{item.icon} {item.label}</p>
                                <p className="text-white/70 text-sm whitespace-pre-wrap">{item.value}</p>
                              </div>
                            ) : null)}
                          </div>

                          {/* Long text fields */}
                          {[
                            { icon: <Target className="w-3 h-3" />, label: 'Warum ins Team?', value: fd.warumTeam },
                            { icon: <Heart className="w-3 h-3" />, label: 'Geduld & Stress', value: fd.geduldig },
                            { icon: <MessageSquare className="w-3 h-3" />, label: 'Fail-RP Lösung', value: fd.failRpLoesung },
                            { icon: <MessageSquare className="w-3 h-3" />, label: 'Streit-Lösung', value: fd.streitLoesung },
                          ].map((item, j) => item.value ? (
                            <div key={j} className="mt-4">
                              <p className="text-white/25 text-xs mb-1.5 flex items-center gap-1.5">{item.icon} {item.label}</p>
                              <p className="text-white/60 text-sm whitespace-pre-wrap leading-relaxed">{item.value}</p>
                            </div>
                          ) : null)}
                        </>
                      )}
                      
                      {/* PRAKTIKUM BEWERBUNG */}
                      {fd.bewerbungType === 'praktikum' && (
                        <>
                          <div className="grid md:grid-cols-2 gap-5">
                            {[
                              { icon: <User className="w-3 h-3" />, label: 'Vorname', value: fd.vorname },
                              { icon: <User className="w-3 h-3" />, label: 'Alter', value: fd.alter },
                              { icon: <Gamepad2 className="w-3 h-3" />, label: 'Roblox Name', value: fd.robloxName },
                              { icon: <Users className="w-3 h-3" />, label: 'Fraktion', value: fd.fraktion },
                              { icon: <Clock className="w-3 h-3" />, label: 'Spielzeit/Erfahrung', value: fd.spielzeit },
                              { icon: <Clock className="w-3 h-3" />, label: 'Stunden/Woche', value: fd.stundenProWoche },
                            ].map((item, j) => item.value ? (
                              <div key={j}>
                                <p className="text-white/25 text-xs mb-1 flex items-center gap-1.5">{item.icon} {item.label}</p>
                                <p className="text-white/70 text-sm whitespace-pre-wrap">{item.value}</p>
                              </div>
                            ) : null)}
                          </div>

                          {/* Long text fields */}
                          {fd.warumTeam && (
                            <div className="mt-4">
                              <p className="text-white/25 text-xs mb-1.5 flex items-center gap-1.5">
                                <Target className="w-3 h-3" /> Warum Praktikum?
                              </p>
                              <p className="text-white/60 text-sm whitespace-pre-wrap leading-relaxed">{fd.warumTeam}</p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* UPRANK BEWERBUNG */}
                      {fd.bewerbungType === 'uprank' && (
                        <>
                          <div className="grid md:grid-cols-2 gap-5">
                            {[
                              { icon: <Clock className="w-3 h-3" />, label: 'Seit wann im Team', value: fd.seitWannImTeam },
                              { icon: <Target className="w-3 h-3" />, label: 'Gewünschter Rang', value: fd.gewuenschterRang },
                              { icon: <Clock className="w-3 h-3" />, label: 'Stunden/Woche', value: fd.stundenProWoche },
                            ].map((item, j) => item.value ? (
                              <div key={j}>
                                <p className="text-white/25 text-xs mb-1 flex items-center gap-1.5">{item.icon} {item.label}</p>
                                <p className="text-white/70 text-sm whitespace-pre-wrap">{item.value}</p>
                              </div>
                            ) : null)}
                          </div>

                          {/* Long text fields */}
                          {[
                            { icon: <Target className="w-3 h-3" />, label: 'Warum Uprank?', value: fd.warumUprank },
                            { icon: <MessageSquare className="w-3 h-3" />, label: 'Aktuelle Aufgaben', value: fd.aktuelleAufgaben },
                            { icon: <Shield className="w-3 h-3" />, label: 'Zusätzliche Verantwortung', value: fd.zusaetzlicheVerantwortung },
                          ].map((item, j) => item.value ? (
                            <div key={j} className="mt-4">
                              <p className="text-white/25 text-xs mb-1.5 flex items-center gap-1.5">{item.icon} {item.label}</p>
                              <p className="text-white/60 text-sm whitespace-pre-wrap leading-relaxed">{item.value}</p>
                            </div>
                          ) : null)}
                        </>
                      )}

                      {/* Checkboxes nur für Normal & Praktikum */}
                      {(!fd.bewerbungType || fd.bewerbungType === 'normal' || fd.bewerbungType === 'praktikum') && (
                        <div className="flex flex-wrap gap-2 mt-5">
                          {[
                            { key: 'hatMikro', icon: <Mic className="w-3 h-3" />, label: 'Mikrofon' },
                            { key: 'kenntRegeln', icon: <BookOpen className="w-3 h-3" />, label: 'Regeln' },
                            { key: 'bleibtNett', icon: <Heart className="w-3 h-3" />, label: 'Respektvoll' },
                          ].map(item => (
                            <div key={item.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                              {fd[item.key] ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400/70" /> : <XCircle className="w-3.5 h-3.5 text-red-400/50" />}
                              {item.icon}
                              <span className="text-xs text-white/40">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
