'use client';

// ─────────────────────────────────────────────────────────────────────
// Voice Call Hook – WebRTC Peer-to-Peer Audio via Supabase Realtime
//
// Signalling: Supabase Realtime Broadcast Channel `vs_call_${sessionId}`
// Ice Servers: Google STUN (kostenlos)
//
// Handshake-Flow (Presence-basiert):
//   1. Beide Peers subscriben den Channel und tracken ihre Presence.
//   2. Sobald BEIDE Peers im presenceState sind, schickt der Caller
//      (Supporter) ein Offer.
//   3. Callee (User) setzt Remote-Description, erzeugt Answer, schickt.
//   4. ICE-Candidates werden in beide Richtungen über den Channel
//      ausgetauscht.
//   5. pc.ontrack → RemoteStream wird an das <audio> Element gehängt.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

/**
 * @param {object} params
 * @param {string|null} params.sessionId – Voice-Support-Session-ID
 * @param {'caller'|'callee'} params.role – 'caller' = Supporter, 'callee' = User
 * @param {boolean} params.enabled – Hook aktivieren (z. B. nur wenn Session aktiv)
 * @param {string|null} params.selfId – Eindeutige Peer-ID (Discord-ID)
 * @param {boolean} [params.micMuted] – Mic stummschalten
 */
export function useVoiceCall({ sessionId, role, enabled, selfId, micMuted = false }) {
  const [connectionState, setConnectionState] = useState('idle'); // idle | connecting | connected | failed
  const [micError, setMicError] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const channelRef = useRef(null);
  const offerSentRef = useRef(false);
  const pendingIceRef = useRef([]); // ICE-Candidates, die vor setRemoteDescription ankommen
  const remoteSetRef = useRef(false);

  // ─── Hilfsfunktion: Attach Remote Stream ───
  const attachRemoteStream = useCallback((stream) => {
    if (!remoteAudioRef.current) return;
    try {
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current.autoplay = true;
      remoteAudioRef.current.playsInline = true;
      // Ein bisschen Volume default
      remoteAudioRef.current.volume = 1.0;
      const p = remoteAudioRef.current.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          console.warn('[voice-call] remote audio play blocked:', err);
        });
      }
    } catch (e) {
      console.error('[voice-call] attachRemoteStream error', e);
    }
  }, []);

  // ─── Main Effect: Setup / Teardown ───
  useEffect(() => {
    if (!enabled || !sessionId || !selfId) {
      return;
    }

    let cancelled = false;
    const client = getSupabaseBrowser();
    if (!client) {
      setMicError('Supabase-Client nicht verfügbar');
      setConnectionState('failed');
      return;
    }

    let channel;
    let pc;

    const setup = async () => {
      try {
        setConnectionState('connecting');
        setMicError(null);
        offerSentRef.current = false;
        remoteSetRef.current = false;
        pendingIceRef.current = [];

        // 1) Mikrofon holen
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          });
        } catch (err) {
          console.error('[voice-call] getUserMedia error', err);
          setMicError(
            err?.name === 'NotAllowedError'
              ? 'Mikrofon-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.'
              : 'Mikrofon nicht verfügbar.'
          );
          setConnectionState('failed');
          return;
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;

        // Wenn wir bereits gemutet starten, direkt anwenden
        stream.getAudioTracks().forEach((t) => (t.enabled = !micMuted));

        // 2) RTCPeerConnection erstellen
        pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (remoteStream) {
            attachRemoteStream(remoteStream);
          }
        };

        pc.onconnectionstatechange = () => {
          const s = pc.connectionState;
          console.log('[voice-call] pc state:', s);
          if (s === 'connected') setConnectionState('connected');
          else if (s === 'failed' || s === 'closed') setConnectionState('failed');
          else if (s === 'disconnected') setConnectionState('connecting');
        };

        // 3) Signalling-Channel
        channel = client.channel(`vs_call_${sessionId}`, {
          config: {
            broadcast: { self: false },
            presence: { key: selfId },
          },
        });
        channelRef.current = channel;

        // ICE raussenden
        pc.onicecandidate = (event) => {
          if (event.candidate && channel) {
            try {
              channel.send({
                type: 'broadcast',
                event: 'ice',
                payload: { candidate: event.candidate, from: selfId },
              });
            } catch (e) {
              console.warn('[voice-call] send ice failed', e);
            }
          }
        };

        // ICE drain helper
        const drainPendingIce = async () => {
          const pending = pendingIceRef.current;
          pendingIceRef.current = [];
          for (const c of pending) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            } catch (e) {
              console.warn('[voice-call] drain addIce failed', e);
            }
          }
        };

        // Offer empfangen (nur Callee)
        channel.on('broadcast', { event: 'offer' }, async ({ payload }) => {
          if (role !== 'callee') return;
          if (!payload?.offer || payload.from === selfId) return;
          try {
            if (pc.signalingState !== 'stable') {
              console.log('[voice-call] got offer in non-stable state', pc.signalingState);
            }
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            remoteSetRef.current = true;
            await drainPendingIce();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            channel.send({
              type: 'broadcast',
              event: 'answer',
              payload: { answer, from: selfId },
            });
          } catch (e) {
            console.error('[voice-call] handle offer error', e);
            setConnectionState('failed');
          }
        });

        // Answer empfangen (nur Caller)
        channel.on('broadcast', { event: 'answer' }, async ({ payload }) => {
          if (role !== 'caller') return;
          if (!payload?.answer || payload.from === selfId) return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
            remoteSetRef.current = true;
            await drainPendingIce();
          } catch (e) {
            console.error('[voice-call] handle answer error', e);
            setConnectionState('failed');
          }
        });

        // ICE empfangen
        channel.on('broadcast', { event: 'ice' }, async ({ payload }) => {
          if (!payload?.candidate || payload.from === selfId) return;
          try {
            if (!remoteSetRef.current) {
              // Noch keine RemoteDescription – puffern
              pendingIceRef.current.push(payload.candidate);
              return;
            }
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.warn('[voice-call] addIceCandidate failed', e);
          }
        });

        // Wenn Gegenseite "hangup" sendet, schließen wir lokal
        channel.on('broadcast', { event: 'hangup' }, () => {
          console.log('[voice-call] got hangup from peer');
          setConnectionState('failed');
        });

        // Presence: wenn beide da sind → Caller startet Offer
        const trySendOffer = async () => {
          if (role !== 'caller') return;
          if (offerSentRef.current) return;
          if (!channel || !pc) return;
          const state = channel.presenceState();
          const peerCount = Object.keys(state).length;
          if (peerCount < 2) return;

          offerSentRef.current = true;
          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: false,
            });
            await pc.setLocalDescription(offer);
            channel.send({
              type: 'broadcast',
              event: 'offer',
              payload: { offer, from: selfId },
            });
            console.log('[voice-call] offer sent');
          } catch (e) {
            console.error('[voice-call] createOffer error', e);
            offerSentRef.current = false;
          }
        };

        channel.on('presence', { event: 'sync' }, () => {
          trySendOffer();
        });
        channel.on('presence', { event: 'join' }, () => {
          trySendOffer();
        });

        // 4) Subscribe + track self
        await channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            try {
              await channel.track({ role, selfId, ts: Date.now() });
            } catch (e) {
              console.warn('[voice-call] track failed', e);
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionState('failed');
          }
        });
      } catch (e) {
        console.error('[voice-call] setup error', e);
        setMicError(e?.message || 'Verbindungsfehler');
        setConnectionState('failed');
      }
    };

    setup();

    return () => {
      cancelled = true;
      // Hangup an die Gegenseite
      try {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'hangup',
            payload: { from: selfId },
          });
        }
      } catch {}

      try {
        if (pcRef.current) {
          pcRef.current.ontrack = null;
          pcRef.current.onicecandidate = null;
          pcRef.current.onconnectionstatechange = null;
          pcRef.current.close();
          pcRef.current = null;
        }
      } catch {}

      try {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
          localStreamRef.current = null;
        }
      } catch {}

      try {
        if (channelRef.current) {
          client.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      } catch {}

      try {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = null;
        }
      } catch {}

      offerSentRef.current = false;
      remoteSetRef.current = false;
      pendingIceRef.current = [];
      setConnectionState('idle');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, role, enabled, selfId]);

  // Mic-Mute anwenden
  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = !micMuted));
  }, [micMuted]);

  return { connectionState, micError, remoteAudioRef };
}
