'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoginModal({ open, onOpenChange }) {
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(30);
  const popupRef = useRef(null);
  const checkClosedIntervalRef = useRef(null);

  useEffect(() => {
    if (!open) {
      // Reset beim Schließen
      setStatus('loading');
      setErrorMessage('');
      setCountdown(30);
      
      // Popup schließen falls noch offen
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      
      // Interval cleanup
      if (checkClosedIntervalRef.current) {
        clearInterval(checkClosedIntervalRef.current);
      }
      
      return;
    }

    // Nachricht vom Popup-Fenster empfangen
    const handleMessage = (event) => {
      // Sicherheit: Nur Nachrichten von unserer Domain akzeptieren
      if (event.origin !== window.location.origin) return;
      
      const { type, success, error } = event.data || {};
      
      if (type === 'discord-auth') {
        if (success) {
          setStatus('success');
        } else if (error) {
          setStatus('error');
          const errorMessages = {
            'discord_denied': 'Du hast die Anmeldung abgebrochen.',
            'no_code': 'Kein Autorisierungscode erhalten.',
            'token_failed': 'Token-Austausch fehlgeschlagen.',
            'user_failed': 'Benutzer-Daten konnten nicht abgerufen werden.',
            'not_member': 'Du bist nicht Mitglied des Hamburg Horizon Discord-Servers.',
            'auth_failed': 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.',
          };
          setErrorMessage(errorMessages[error] || 'Ein unbekannter Fehler ist aufgetreten.');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open]);

  // Auto-Close Timer
  useEffect(() => {
    if (!open || status === 'loading') return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, status]);

  const handleClose = () => {
    onOpenChange(false);
    
    // Bei Erfolg Seite neu laden um den neuen Auth-Status zu holen
    if (status === 'success') {
      window.location.reload();
    }
  };

  const handleManualClose = () => {
    handleClose();
  };

  const openDiscordPopup = () => {
    // Popup-Fenster öffnen für Discord OAuth2
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      '/api/auth/discord',
      'DiscordAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );
    
    popupRef.current = popup;
    
    // Prüfe ob Popup geschlossen wurde (von User abgebrochen)
    checkClosedIntervalRef.current = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkClosedIntervalRef.current);
        if (status === 'loading') {
          setStatus('error');
          setErrorMessage('Anmeldung wurde abgebrochen.');
        }
      }
    }, 500);
  };

  // Popup öffnen wenn Modal geöffnet wird
  useEffect(() => {
    if (open && status === 'loading') {
      openDiscordPopup();
    }
    
    return () => {
      if (checkClosedIntervalRef.current) {
        clearInterval(checkClosedIntervalRef.current);
      }
    };
  }, [open, status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        style={{
          background: 'rgba(8, 8, 8, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(var(--theme-accent-rgb), 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-white">
            {status === 'loading' && 'Anmeldung läuft...'}
            {status === 'success' && 'Anmeldung erfolgreich!'}
            {status === 'error' && 'Anmeldung fehlgeschlagen'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-8">
          {/* Loading State */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <Loader2 
                  className="w-16 h-16 animate-spin" 
                  style={{ color: 'var(--theme-accent)' }} 
                />
                <div 
                  className="absolute inset-0 rounded-full blur-xl opacity-50"
                  style={{ background: 'var(--theme-accent)' }}
                />
              </div>
              <p className="text-center text-base" style={{ color: 'rgba(var(--theme-accent-rgb), 0.7)' }}>
                Bitte warte, während du mit Discord angemeldet wirst...
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ 
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '2px solid rgba(34, 197, 94, 0.3)'
                  }}
                >
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div 
                  className="absolute inset-0 rounded-full blur-xl opacity-30"
                  style={{ background: '#22c55e' }}
                />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white mb-2">
                  Willkommen zurück!
                </p>
                <p className="text-sm" style={{ color: 'rgba(var(--theme-accent-rgb), 0.6)' }}>
                  Du wurdest erfolgreich angemeldet.
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
                  Schließt automatisch in {countdown} Sekunden
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '2px solid rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <div 
                  className="absolute inset-0 rounded-full blur-xl opacity-30"
                  style={{ background: '#ef4444' }}
                />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white mb-2">
                  Oops, etwas ist schiefgelaufen
                </p>
                <p className="text-sm px-4" style={{ color: 'rgba(var(--theme-accent-rgb), 0.6)' }}>
                  {errorMessage}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs" style={{ color: 'rgba(var(--theme-accent-rgb), 0.4)' }}>
                  Schließt automatisch in {countdown} Sekunden
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {status !== 'loading' && (
          <div className="flex justify-center gap-3 pt-4">
            <Button
              onClick={handleManualClose}
              className="rounded-xl px-6"
              style={{ 
                background: 'rgba(var(--theme-accent-rgb), 0.1)',
                border: '1px solid rgba(var(--theme-accent-rgb), 0.2)',
                color: 'var(--theme-accent)'
              }}
            >
              Schließen
            </Button>
            {status === 'error' && (
              <Button
                onClick={() => {
                  handleClose();
                  window.location.href = '/api/auth/discord';
                }}
                className="rounded-xl px-6"
                style={{ 
                  background: 'var(--theme-accent)',
                  color: '#000'
                }}
              >
                Erneut versuchen
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
