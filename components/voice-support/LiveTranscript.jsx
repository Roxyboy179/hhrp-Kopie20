'use client';

// LiveTranscript – Zeigt Transkript-Bubbles während des Voice-Calls
import { useEffect, useRef } from 'react';
import { MessageSquare, User, Headphones } from 'lucide-react';

export function LiveTranscript({ messages = [], currentUserId, supporterAvatar }) {
  const scrollRef = useRef(null);

  // Auto-scroll zum neuesten
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div className="rounded-2xl bg-black/25 border border-white/[0.06] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-blue-300" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
            Live-Transkript
          </span>
        </div>
        {messages.length > 0 && (
          <span className="text-[10px] font-mono text-white/40">
            {messages.length} {messages.length === 1 ? 'Eintrag' : 'Einträge'}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="max-h-48 overflow-y-auto p-3 space-y-2 scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-2 text-xs text-white/40">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-blue-400" />
              </span>
              Wartet auf gesprochenen Text…
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = String(m.speakerId) === String(currentUserId);
            const time = m.timestamp
              ? new Date(m.timestamp).toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div
                key={m.id}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full overflow-hidden flex items-center justify-center ${
                    isMe
                      ? 'bg-blue-500/20 border border-blue-400/20'
                      : 'bg-emerald-500/20 border border-emerald-400/20'
                  }`}
                >
                  {!isMe && supporterAvatar ? (
                    <img
                      src={supporterAvatar}
                      alt={m.speakerName}
                      className="w-full h-full object-cover"
                    />
                  ) : isMe ? (
                    <User className="w-3.5 h-3.5 text-blue-300" />
                  ) : (
                    <Headphones className="w-3.5 h-3.5 text-emerald-300" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[80%] min-w-0 rounded-2xl px-3 py-2 ${
                    isMe
                      ? 'bg-blue-500/15 border border-blue-400/20 rounded-tr-sm'
                      : 'bg-white/[0.05] border border-white/[0.08] rounded-tl-sm'
                  }`}
                >
                  <div
                    className={`flex items-baseline gap-2 mb-0.5 ${
                      isMe ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <span
                      className={`text-[10px] font-semibold ${
                        isMe ? 'text-blue-200' : 'text-emerald-200'
                      }`}
                    >
                      {isMe ? 'Du' : m.speakerName || 'Supporter'}
                    </span>
                    {time && (
                      <span className="text-[9px] font-mono text-white/30 tabular-nums">
                        {time}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs leading-relaxed text-white/85 break-words ${
                      isMe ? 'text-right' : 'text-left'
                    }`}
                  >
                    {m.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {messages.length > 0 && (
        <div className="px-4 py-2 bg-white/[0.02] border-t border-white/[0.04]">
          <p className="text-[10px] text-white/30 text-center">
            Automatische Spracherkennung – kann Fehler enthalten
          </p>
        </div>
      )}
    </div>
  );
}
