'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GlassCard } from '@/components/shared/GlassCard';
import { toast } from 'sonner';
import { 
  Bug, Lightbulb, MessageSquare, Send, Loader2, CheckCircle2, AlertCircle, Shield, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

const inputClass = "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-purple-500/40 focus:ring-purple-500/20 rounded-xl";

export default function BetaFeedbackPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [feedbackType, setFeedbackType] = useState('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [page, setPage] = useState('');

  useEffect(() => {
    checkBetaTester();
  }, []);

  const checkBetaTester = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      if (!data.user) {
        router.push('/');
        return;
      }

      const isBetaTester = data.user.roles?.includes('1494434149623136276');
      
      if (!isBetaTester) {
        toast.error('Keine Berechtigung', { 
          description: 'Diese Seite ist nur für Beta Tester zugänglich.' 
        });
        router.push('/');
        return;
      }

      setUser(data.user);
    } catch (e) {
      console.error(e);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast.error('Fehler', { description: 'Bitte fülle alle Felder aus.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/beta/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          title,
          description,
          priority,
          page: page || window.location.pathname
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Feedback gesendet!', { 
        description: 'Vielen Dank für deine Mithilfe!' 
      });

      setTitle('');
      setDescription('');
      setPage('');
      setPriority('medium');
    } catch (e) {
      toast.error('Fehler', { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const feedbackTypes = [
    { value: 'bug', label: 'Bug melden', icon: <Bug className="w-5 h-5" />, gradient: 'from-red-500 to-orange-500' },
    { value: 'improvement', label: 'Verbesserung', icon: <Lightbulb className="w-5 h-5" />, gradient: 'from-yellow-500 to-orange-500' },
    { value: 'feedback', label: 'Feedback', icon: <MessageSquare className="w-5 h-5" />, gradient: 'from-blue-500 to-cyan-500' }
  ];

  const priorities = [
    { value: 'low', label: 'Niedrig' },
    { value: 'medium', label: 'Mittel' },
    { value: 'high', label: 'Hoch' },
    { value: 'critical', label: 'Kritisch' }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px] opacity-30"
          style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' }}
        />
      </div>

      <div className="relative px-4 sm:px-6 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          
          {/* Back Button */}
          <Link 
            href="/beta"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Zurück zum Beta Portal</span>
          </Link>

          {/* Header */}
          <div className="mb-12 animate-fade-in-down">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Beta Feedback</h1>
                <p className="text-white/50 text-sm">Hilf uns, die Plattform zu verbessern</p>
              </div>
            </div>
            
            <GlassCard className="p-4">
              <p className="text-sm text-purple-300/80 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Du bist als Beta Tester eingeloggt. Dein Feedback wird direkt an das Entwicklerteam gesendet.
              </p>
            </GlassCard>
          </div>

          {/* Feedback Form */}
          <GlassCard className="p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Feedback Type */}
              <div>
                <Label className="text-white/70 mb-3 block text-sm font-medium">Art des Feedbacks</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFeedbackType(type.value)}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        feedbackType === type.value
                          ? 'border-purple-500 bg-purple-500/10 scale-105'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${type.gradient} flex items-center justify-center`}>
                        {type.icon}
                      </div>
                      <span className="text-sm font-medium text-white">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <Label className="text-white/70 mb-2 block text-sm font-medium">Titel</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Kurze Zusammenfassung..."
                  className={inputClass}
                  required
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-white/70 mb-2 block text-sm font-medium">Beschreibung</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreibe das Problem oder deine Idee so detailliert wie möglich..."
                  className={`${inputClass} min-h-[200px]`}
                  required
                />
                <p className="text-xs text-white/30 mt-2">
                  Tipp: Füge Schritte zur Reproduktion hinzu, wenn es ein Bug ist.
                </p>
              </div>

              {/* Priority & Page */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/70 mb-2 block text-sm font-medium">Priorität</Label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={`${inputClass} w-full px-3 py-2`}
                  >
                    {priorities.map((p) => (
                      <option key={p.value} value={p.value} className="bg-black">
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-white/70 mb-2 block text-sm font-medium">Seite (optional)</Label>
                  <Input
                    value={page}
                    onChange={(e) => setPage(e.target.value)}
                    placeholder="z.B. /bewerbung"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Feedback senden
                  </>
                )}
              </Button>
            </form>
          </GlassCard>

          {/* Info Box */}
          <GlassCard className="mt-6 p-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-sm text-blue-300/80 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Dein Feedback wird vertraulich behandelt und hilft uns, die Plattform kontinuierlich zu verbessern. 
                Bei kritischen Bugs antworten wir innerhalb von 24 Stunden.
              </span>
            </p>
          </GlassCard>

        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
