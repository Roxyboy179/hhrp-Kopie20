'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  User, Edit, Trash2, AlertTriangle, CheckCircle, Loader2, 
  Clock, MapPin, Calendar, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════════════════
// PENDING OVERLAY für Character-Anträge
// ══════════════════════════════════════════════════════════════════════════
function CharacterPendingOverlay({ requestedAt, type }) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!requestedAt) return;
    const start = new Date(requestedAt).getTime();
    const tick = () => setElapsedSec(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [requestedAt]);

  const meta = type === 'edit' 
    ? { label: 'Bearbeitungs-Antrag wartet auf Genehmigung', color: '#3b82f6', icon: Edit }
    : { label: 'Lösch-Antrag wartet auf Genehmigung', color: '#ef4444', icon: Trash2 };

  const IconComp = meta.icon;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-xl animate-in fade-in duration-200"
      style={{
        background: 'rgba(10, 11, 15, 0.92)',
        backdropFilter: 'blur(4px)',
        border: `1px solid ${meta.color}44`
      }}
    >
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
          Ein Admin wird deinen Antrag prüfen.
        </p>
        <p className="text-[10px] mt-1.5 flex items-center justify-center gap-1" style={{ color: meta.color }}>
          <Clock className="w-2.5 h-2.5" />
          Seit {elapsedSec}s in Warteschlange
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: Charakter-Verwaltung
// ══════════════════════════════════════════════════════════════════════════
export function CharacterManagementView({ userData, onRefresh }) {
  // Formular-State
  const [vorname, setVorname] = useState('');
  const [nachname, setNachname] = useState('');
  const [herkunft, setHerkunft] = useState('');
  const [geschlecht, setGeschlecht] = useState('');
  const [grund, setGrund] = useState('');

  // Delete-State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Processing
  const [processing, setProcessing] = useState(false);

  // Pending-System
  const [pendingActions, setPendingActions] = useState([]);
  const pollTimeoutRef = useRef(null);
  const previousPendingKeys = useRef(new Set());

  // Initialisiere Formular mit aktuellen Werten
  useEffect(() => {
    if (userData) {
      const fullName = userData.characterName || '';
      const nameParts = fullName.split(' ');
      setVorname(nameParts[0] || '');
      setNachname(nameParts.slice(1).join(' ') || '');
      setHerkunft(userData.origin || '');
      setGeschlecht(userData.gender || '');
    }
  }, [userData]);

  // Pending-Actions abrufen
  const fetchPendingActions = useCallback(async () => {
    try {
      const res = await fetch('/api/character/pending');
      if (!res.ok) return null;
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { return null; }
      return data.pending || [];
    } catch {
      return null;
    }
  }, []);

  // Polling
  const schedulePollActions = useCallback((delay = 3000) => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    pollTimeoutRef.current = setTimeout(async () => {
      const fresh = await fetchPendingActions();
      if (fresh === null) {
        schedulePollActions(5000);
        return;
      }

      const newKeys = new Set(fresh.map(p => p.requestId));
      const oldKeys = previousPendingKeys.current;
      const removed = [...oldKeys].filter(k => !newKeys.has(k));

      if (removed.length > 0) {
        if (typeof onRefresh === 'function') {
          await onRefresh();
        }
        toast.success('Antrag wurde verarbeitet', {
          description: 'Dein Charakter-Antrag wurde von einem Admin bearbeitet.'
        });
      }

      previousPendingKeys.current = newKeys;
      setPendingActions(fresh);

      if (newKeys.size > 0) {
        schedulePollActions(3000);
      }
    }, delay);
  }, [fetchPendingActions, onRefresh]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fresh = await fetchPendingActions();
      if (cancelled || !fresh) return;
      previousPendingKeys.current = new Set(fresh.map(p => p.requestId));
      setPendingActions(fresh);
      if (fresh.length > 0) schedulePollActions(3000);
    })();
    return () => {
      cancelled = true;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [fetchPendingActions, schedulePollActions]);

  // Bearbeitungs-Antrag stellen
  const handleEditRequest = async () => {
    if (!grund || (!vorname && !nachname && !herkunft && !geschlecht)) {
      toast.error('Bitte fülle mindestens ein Feld aus und gib eine Begründung an');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/character/edit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vorname,
          nachname,
          herkunft,
          geschlecht,
          grund
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Antrag fehlgeschlagen');
      } else {
        toast.success('Antrag erstellt!', {
          description: 'Ein Admin wird deine Änderungen im Discord prüfen.'
        });
        setGrund('');
        const fresh = await fetchPendingActions();
        setPendingActions(fresh || []);
        schedulePollActions(3000);
      }
    } catch (e) {
      toast.error('Netzwerkfehler');
    } finally {
      setProcessing(false);
    }
  };

  // Lösch-Antrag stellen
  const handleDeleteRequest = async () => {
    if (confirmText !== 'LÖSCHEN') {
      toast.error('Bitte tippe "LÖSCHEN" zur Bestätigung ein');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/character/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmText,
          reason: deleteReason
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Antrag fehlgeschlagen');
      } else {
        toast.warning('Lösch-Antrag erstellt!', {
          description: 'ACHTUNG: Bei Genehmigung werden ALLE Daten gelöscht!'
        });
        setShowDeleteModal(false);
        setConfirmText('');
        setDeleteReason('');
        const fresh = await fetchPendingActions();
        setPendingActions(fresh || []);
        schedulePollActions(3000);
      }
    } catch (e) {
      toast.error('Netzwerkfehler');
    } finally {
      setProcessing(false);
    }
  };

  // Prüfe ob pending
  const hasPendingEdit = pendingActions.some(p => p.type === 'edit');
  const hasPendingDelete = pendingActions.some(p => p.type === 'delete');
  const pendingEdit = pendingActions.find(p => p.type === 'edit');
  const pendingDelete = pendingActions.find(p => p.type === 'delete');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 border border-white/[0.08]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Charakter-Verwaltung</h2>
            <p className="text-sm text-white/60">Bearbeite oder lösche deinen Charakter</p>
          </div>
        </div>
      </div>

      {/* Charakter Bearbeiten */}
      <div className="glass rounded-2xl p-6 border border-white/[0.08] relative">
        {hasPendingEdit && <CharacterPendingOverlay requestedAt={pendingEdit.requestedAt} type="edit" />}
        
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Edit className="w-5 h-5 text-blue-400" />
          Charakter bearbeiten
        </h3>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-white/60 mb-2 block">Vorname *</label>
            <input
              type="text"
              value={vorname}
              onChange={(e) => setVorname(e.target.value)}
              disabled={hasPendingEdit || processing}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-white/40 focus:border-blue-500/50 focus:outline-none disabled:opacity-50"
              placeholder="Max"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">Nachname *</label>
            <input
              type="text"
              value={nachname}
              onChange={(e) => setNachname(e.target.value)}
              disabled={hasPendingEdit || processing}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-white/40 focus:border-blue-500/50 focus:outline-none disabled:opacity-50"
              placeholder="Mustermann"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">Herkunft *</label>
            <input
              type="text"
              value={herkunft}
              onChange={(e) => setHerkunft(e.target.value)}
              disabled={hasPendingEdit || processing}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-white/40 focus:border-blue-500/50 focus:outline-none disabled:opacity-50"
              placeholder="Hamburg"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">Geschlecht *</label>
            <select
              value={geschlecht}
              onChange={(e) => setGeschlecht(e.target.value)}
              disabled={hasPendingEdit || processing}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white focus:border-blue-500/50 focus:outline-none disabled:opacity-50"
            >
              <option value="">Bitte wählen</option>
              <option value="Männlich">Männlich</option>
              <option value="Weiblich">Weiblich</option>
              <option value="Divers">Divers</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-white/60 mb-2 block">Begründung *</label>
          <textarea
            value={grund}
            onChange={(e) => setGrund(e.target.value)}
            disabled={hasPendingEdit || processing}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-white/40 focus:border-blue-500/50 focus:outline-none disabled:opacity-50 resize-none"
            placeholder="Warum möchtest du deinen Charakter ändern?"
          />
        </div>

        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-300">Hinweis</p>
              <p className="text-xs text-blue-400/80 mt-1">
                Dein Antrag wird von einem Admin geprüft. Änderungen werden erst nach Genehmigung übernommen.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleEditRequest}
          disabled={hasPendingEdit || processing}
          className="w-full rounded-xl h-12"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3))',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#fff'
          }}
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sende Antrag...
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Änderungen beantragen
            </>
          )}
        </Button>
      </div>

      {/* Charakter Löschen */}
      <div className="glass rounded-2xl p-6 border border-red-500/30 relative">
        {hasPendingDelete && <CharacterPendingOverlay requestedAt={pendingDelete.requestedAt} type="delete" />}
        
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-400" />
          Charakter löschen
        </h3>

        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">ACHTUNG: Irreversible Aktion!</p>
              <p className="text-xs text-red-400/80 mt-1">
                Bei Genehmigung werden ALLE Daten gelöscht: Geld, Lizenzen, Kredite, Transaktionen, etc.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setShowDeleteModal(true)}
          disabled={hasPendingDelete || processing}
          variant="outline"
          className="w-full rounded-xl h-12"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.4)',
            color: '#ef4444'
          }}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Lösch-Antrag stellen
        </Button>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.95), rgba(20, 20, 20, 0.98))',
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              Charakter-Löschung bestätigen
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-300 font-semibold mb-2">
                  Es werden ALLE Daten gelöscht:
                </p>
                <ul className="text-xs text-red-400/80 space-y-1 ml-4">
                  <li>• Charakter-Informationen</li>
                  <li>• Bankguthaben & Credits</li>
                  <li>• Lizenzen & Versicherungen</li>
                  <li>• Kredite & Transaktionen</li>
                  <li>• Level & Fortschritt</li>
                </ul>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">
                  Begründung (optional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-white/40 focus:border-red-500/50 focus:outline-none resize-none"
                  placeholder="Warum möchtest du deinen Charakter löschen?"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">
                  Tippe "LÖSCHEN" zur Bestätigung:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-white/40 focus:border-red-500/50 focus:outline-none"
                  placeholder="LÖSCHEN"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText('');
                  setDeleteReason('');
                }}
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={processing}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleDeleteRequest}
                disabled={processing || confirmText !== 'LÖSCHEN'}
                className="flex-1 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3))',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fff'
                }}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sende...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Antrag stellen
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
