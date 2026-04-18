'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminCard, AdminCardHeader } from '@/components/admin/AdminCard';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/components/providers/AdminAuthProvider';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  Save,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  'Eingereicht': { color: 'blue', icon: FileText },
  'In Bearbeitung': { color: 'yellow', icon: Clock },
  'Angenommen': { color: 'green', icon: CheckCircle2 },
  'Abgelehnt': { color: 'red', icon: XCircle }
};

export default function BewerbungDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bewerbungId = params.id;
  const { admin, loading: authLoading } = useAdminAuth();
  
  const [bewerbung, setBewerbung] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    if (!authLoading && !admin) router.push('/admin');
    if (admin && bewerbungId) fetchBewerbung();
  }, [admin, authLoading, bewerbungId]);

  const fetchBewerbung = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bewerbungen?id=${bewerbungId}`);
      const data = await res.json();
      if (data.bewerbung) {
        setBewerbung(data.bewerbung);
        setAdminNote(data.bewerbung.adminNote || '');
      } else {
        toast.error('Bewerbung nicht gefunden');
        router.push('/admin/bewerbungen');
      }
    } catch (e) {
      console.error(e);
      toast.error('Fehler beim Laden der Bewerbung');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/bewerbungen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bewerbungId,
          status: newStatus,
          adminNote
        })
      });

      if (res.ok) {
        toast.success('Status aktualisiert', {
          description: `Bewerbung wurde auf "${newStatus}" gesetzt.`
        });
        fetchBewerbung();
      } else {
        throw new Error('Fehler beim Aktualisieren');
      }
    } catch (e) {
      toast.error('Fehler', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/bewerbungen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bewerbungId,
          adminNote
        })
      });

      if (res.ok) {
        toast.success('Notiz gespeichert');
        fetchBewerbung();
      } else {
        throw new Error('Fehler beim Speichern');
      }
    } catch (e) {
      toast.error('Fehler', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!bewerbung) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold text-white mb-2">Bewerbung nicht gefunden</h2>
          <Button onClick={() => router.push('/admin/bewerbungen')} className="mt-4">
            Zurück zur Übersicht
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[bewerbung.status] || STATUS_CONFIG['Eingereicht'];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/bewerbungen')}
            className="rounded-xl border-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{bewerbung.characterName}</h1>
            <p className="text-white/60 text-sm mt-1">Bewerbung vom {new Date(bewerbung.createdAt).toLocaleDateString('de-DE')}</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 bg-${statusConfig.color}-500/10 border-${statusConfig.color}-500/20`}>
          <StatusIcon className={`w-5 h-5 text-${statusConfig.color}-400`} />
          <span className={`font-semibold text-${statusConfig.color}-300`}>{bewerbung.status}</span>
        </div>
      </div>

      {/* Charakter Info */}
      <AdminCard>
        <AdminCardHeader icon={User} title="Charakter-Informationen" />
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold text-white/60 mb-1 block">Name</label>
            <p className="text-white text-lg">{bewerbung.characterName}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-white/60 mb-1 block">Alter</label>
            <p className="text-white text-lg">{bewerbung.characterAge} Jahre</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-white/60 mb-1 block">Discord Username</label>
            <p className="text-white text-lg">{bewerbung.discordUsername}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-white/60 mb-1 block">Eingereicht am</label>
            <p className="text-white text-lg flex items-center gap-2">
              <Calendar className="w-4 h-4 text-white/60" />
              {new Date(bewerbung.createdAt).toLocaleString('de-DE')}
            </p>
          </div>
        </div>
      </AdminCard>

      {/* Story */}
      <AdminCard>
        <AdminCardHeader icon={FileText} title="Story / Hintergrundgeschichte" />
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
          <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
            {bewerbung.story || 'Keine Story vorhanden'}
          </p>
        </div>
      </AdminCard>

      {/* Admin Notizen */}
      <AdminCard>
        <AdminCardHeader icon={MessageSquare} title="Admin Notizen (Intern)" />
        <div className="space-y-4">
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={5}
            placeholder="Interne Notizen zu dieser Bewerbung..."
            className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
          />
          <Button
            onClick={saveNote}
            disabled={saving}
            className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Notiz speichern
          </Button>
        </div>
      </AdminCard>

      {/* Status Ändern */}
      <AdminCard>
        <AdminCardHeader title="Status ändern" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => updateStatus('Eingereicht')}
            disabled={saving || bewerbung.status === 'Eingereicht'}
            variant="outline"
            className="h-24 flex-col gap-2 rounded-xl border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10"
          >
            <FileText className="w-6 h-6 text-blue-400" />
            <span>Eingereicht</span>
          </Button>
          
          <Button
            onClick={() => updateStatus('In Bearbeitung')}
            disabled={saving || bewerbung.status === 'In Bearbeitung'}
            variant="outline"
            className="h-24 flex-col gap-2 rounded-xl border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/10"
          >
            <Clock className="w-6 h-6 text-yellow-400" />
            <span>In Bearbeitung</span>
          </Button>
          
          <Button
            onClick={() => updateStatus('Angenommen')}
            disabled={saving || bewerbung.status === 'Angenommen'}
            variant="outline"
            className="h-24 flex-col gap-2 rounded-xl border-white/10 hover:border-green-500/50 hover:bg-green-500/10"
          >
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <span>Angenommen</span>
          </Button>
          
          <Button
            onClick={() => updateStatus('Abgelehnt')}
            disabled={saving || bewerbung.status === 'Abgelehnt'}
            variant="outline"
            className="h-24 flex-col gap-2 rounded-xl border-white/10 hover:border-red-500/50 hover:bg-red-500/10"
          >
            <XCircle className="w-6 h-6 text-red-400" />
            <span>Abgelehnt</span>
          </Button>
        </div>
      </AdminCard>
    </div>
  );
}
