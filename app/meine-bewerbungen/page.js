'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
    case 'Eingereicht': return <Clock className="w-4 h-4" />;
    case 'In Bearbeitung': return <Loader2 className="w-4 h-4 animate-spin" />;
    case 'Angenommen': return <CheckCircle2 className="w-4 h-4" />;
    case 'Abgelehnt': return <XCircle className="w-4 h-4" />;
    case 'Zurückgezogen': return <AlertTriangle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
}

export default function MeineBewerbungenPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [bewerbungen, setBewerbungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/?error=not_logged_in');
      return;
    }
    if (user) {
      fetchBewerbungen();
    }
  }, [user, authLoading, router]);

  const fetchBewerbungen = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bewerbungen');
      const data = await res.json();
      console.log('[DEBUG] Bewerbungen geladen:', data.bewerbungen);
      if (data.bewerbungen && data.bewerbungen.length > 0) {
        console.log('[DEBUG] Erste Bewerbung:', JSON.stringify(data.bewerbungen[0], null, 2));
        console.log('[DEBUG] formData vorhanden?', !!data.bewerbungen[0].formData);
        console.log('[DEBUG] formData Keys:', data.bewerbungen[0].formData ? Object.keys(data.bewerbungen[0].formData) : 'keine');
      }
      setBewerbungen(data.bewerbungen || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (id) => {
    if (!confirm('Möchtest du diese Bewerbung wirklich zurückziehen?')) return;
    try {
      const res = await fetch(`/api/bewerbungen/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchBewerbungen();
        setSelected(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-4 text-white/60 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Startseite
            </Button>
            <h1 className="text-4xl font-bold">Meine Bewerbungen</h1>
            <p className="text-white/60 mt-2">Übersicht deiner Team-Bewerbungen</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={fetchBewerbungen}
              className="rounded-xl border-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Aktualisieren
            </Button>
            <Button
              onClick={() => router.push('/bewerbung')}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neue Bewerbung
            </Button>
          </div>
        </div>

        {bewerbungen.length === 0 ? (
          <GlassCard className="p-16 text-center">
            <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Noch keine Bewerbungen</h3>
            <p className="text-white/40 mb-6">Du hast noch keine Bewerbung eingereicht.</p>
            <Button
              onClick={() => router.push('/bewerbung')}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Jetzt bewerben
            </Button>
          </GlassCard>
        ) : (
          <div className="grid gap-4">
            {bewerbungen.map(bewerbung => (
              <GlassCard key={bewerbung.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        Bewerbung vom {formatDateTime(bewerbung.createdAt)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs border flex items-center gap-1.5 ${getStatusColor(bewerbung.status)}`}>
                        <StatusIcon status={bewerbung.status} />
                        {bewerbung.status}
                      </span>
                    </div>
                    
                    {bewerbung.claimedByName && (
                      <p className="text-white/40 text-sm">
                        Bearbeitet von: {bewerbung.claimedByName}
                      </p>
                    )}

                    {selected === bewerbung.id && bewerbung.formData && (
                      <div className="mt-6 pt-6 border-t border-white/5">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                              <User className="w-3 h-3" /> Vorname
                            </p>
                            <p className="text-white/90">{bewerbung.formData.vorname || '-'}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                              <User className="w-3 h-3" /> Alter
                            </p>
                            <p className="text-white/90">{bewerbung.formData.alter || '-'}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                              <Gamepad2 className="w-3 h-3" /> Roblox Name
                            </p>
                            <p className="text-white/90">{bewerbung.formData.robloxName || '-'}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" /> Spielzeit
                            </p>
                            <p className="text-white/90">{bewerbung.formData.spielzeit || '-'}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                              <Users className="w-3 h-3" /> Fraktion
                            </p>
                            <p className="text-white/90">{bewerbung.formData.fraktion || '-'}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" /> Stunden/Woche
                            </p>
                            <p className="text-white/90">{bewerbung.formData.stundenProWoche || '-'}</p>
                          </div>
                          {bewerbung.formData.andererServer && (
                            <div className="md:col-span-2">
                              <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                                <Gamepad2 className="w-3 h-3" /> Andere Server
                              </p>
                              <p className="text-white/90 whitespace-pre-wrap text-sm">{bewerbung.formData.andererServer}</p>
                            </div>
                          )}
                          <div className="md:col-span-2">
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                              <Shield className="w-3 h-3" /> Bann/Warn History
                            </p>
                            <p className="text-white/90 whitespace-pre-wrap text-sm">{bewerbung.formData.bannWarn || '-'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                              <Target className="w-3 h-3" /> Motivation
                            </p>
                            <p className="text-white/90 whitespace-pre-wrap text-sm">{bewerbung.formData.warumTeam || '-'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                              <Heart className="w-3 h-3" /> Geduld & Stressresistenz
                            </p>
                            <p className="text-white/90 whitespace-pre-wrap text-sm">{bewerbung.formData.geduldig || '-'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                              <MessageSquare className="w-3 h-3" /> Fail-RP Lösung
                            </p>
                            <p className="text-white/90 whitespace-pre-wrap text-sm">{bewerbung.formData.failRpLoesung || '-'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1.5">
                              <MessageSquare className="w-3 h-3" /> Streit-Lösung
                            </p>
                            <p className="text-white/90 whitespace-pre-wrap text-sm">{bewerbung.formData.streitLoesung || '-'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-white/40 text-xs mb-2">Voraussetzungen</p>
                            <div className="flex flex-wrap gap-3">
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                {bewerbung.formData.hatMikro ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                                <Mic className="w-3 h-3 text-white/40" />
                                <span className="text-xs text-white/60">Mikrofon</span>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                {bewerbung.formData.kenntRegeln ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                                <BookOpen className="w-3 h-3 text-white/40" />
                                <span className="text-xs text-white/60">Regeln gelesen</span>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                {bewerbung.formData.bleibtNett ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                                <Heart className="w-3 h-3 text-white/40" />
                                <span className="text-xs text-white/60">Respektvoll</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    {bewerbung.status === 'Eingereicht' || bewerbung.status === 'In Bearbeitung' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWithdraw(bewerbung.id)}
                        className="rounded-xl border-red-500/20 text-red-300 hover:bg-red-500/10"
                      >
                        Zurückziehen
                      </Button>
                    ) : null}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(selected === bewerbung.id ? null : bewerbung.id)}
                      className="rounded-xl"
                    >
                      <ChevronRight className={`w-5 h-5 transition-transform ${selected === bewerbung.id ? 'rotate-90' : ''}`} />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
