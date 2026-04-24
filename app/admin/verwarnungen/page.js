'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Search, AlertTriangle, Loader2, User, Hash, Calendar, FileText } from 'lucide-react';

const inputClass = "bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/25 focus:border-white/30 focus:ring-white/10 rounded-xl h-11";

const cardStyle = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export default function VerwarnungenPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        if (!data.admin) {
          router.push('/admin');
          return;
        }
        // Level 1-4 können alle zugreifen
        setAdmin(data.admin);
        setLoading(false);
      } catch (e) {
        console.error(e);
        toast.error('Fehler beim Laden');
        router.push('/admin');
      }
    })();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error('Bitte Suchbegriff eingeben');
      return;
    }

    setSearching(true);
    setHasSearched(true);
    
    try {
      const res = await fetch(`/api/admin/verwarnungen-suche?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      
      if (res.ok) {
        setSearchResults(data.results || []);
        if (data.results.length === 0) {
          toast.info('Keine Ergebnisse gefunden');
        } else {
          toast.success(`${data.results.length} Benutzer gefunden`);
        }
      } else {
        toast.error(data.error || 'Fehler bei der Suche');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Fehler bei der Suche');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050506' }}>
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#050506' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
            Verwarnungen Suche
          </h1>
          <p className="text-white/50 text-sm">
            Suche nach Benutzern mit Verwarnungen (Vorname, Nachname, Discord User ID, Discord ID)
          </p>
        </div>

        {/* Suchformular */}
        <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Vorname, Nachname, Discord User ID oder Discord ID eingeben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={inputClass}
                disabled={searching}
              />
            </div>
            <Button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="h-11 px-6 rounded-xl font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 8px 20px -6px rgba(0,0,0,0.6)',
                color: 'black',
              }}
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Suche...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Suchen
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Suchergebnisse */}
        {hasSearched && (
          <div className="space-y-4">
            {searchResults.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={cardStyle}>
                <Search className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 text-lg">Keine Benutzer mit Verwarnungen gefunden</p>
                <p className="text-white/30 text-sm mt-2">Versuche einen anderen Suchbegriff</p>
              </div>
            ) : (
              searchResults.map((user, index) => (
                <div
                  key={index}
                  className="rounded-2xl p-6 backdrop-blur-sm"
                  style={cardStyle}
                >
                  {/* User Header */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center border"
                        style={{
                          background: 'rgba(234,179,8,0.1)',
                          borderColor: 'rgba(234,179,8,0.25)',
                        }}
                      >
                        <User className="w-6 h-6 text-yellow-300" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">
                          {user.vorname} {user.nachname}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-white/40 text-xs flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            User ID: {user.discordUserId}
                          </span>
                          {user.discordId && (
                            <span className="text-white/40 text-xs">
                              Discord ID: {user.discordId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-lg border"
                      style={{
                        background: user.warningCount >= 3 ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.10)',
                        borderColor: user.warningCount >= 3 ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.22)',
                      }}
                    >
                      <span
                        className="text-sm font-bold"
                        style={{ color: user.warningCount >= 3 ? 'rgba(252,165,165,0.95)' : 'rgba(253,224,71,0.95)' }}
                      >
                        {user.warningCount} Verwarnung{user.warningCount !== 1 ? 'en' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Verwarnungen Liste */}
                  <div className="space-y-3">
                    {user.warnings.map((warning, wIndex) => (
                      <div
                        key={wIndex}
                        className="rounded-xl p-4 border"
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          borderColor: 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <span className="text-white/90 font-medium text-sm">
                              Verwarnung #{wIndex + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/40 text-xs">
                            <Calendar className="w-3 h-3" />
                            {formatDate(warning.timestamp)}
                          </div>
                        </div>
                        
                        {warning.reason && (
                          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-white/5">
                            <FileText className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" />
                            <p className="text-white/60 text-xs leading-relaxed">{warning.reason}</p>
                          </div>
                        )}
                        
                        {warning.warnedBy && (
                          <div className="mt-2 text-white/30 text-xs">
                            Ausgestellt von: {warning.warnedBy}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="rounded-2xl p-12 text-center" style={cardStyle}>
            <AlertTriangle className="w-16 h-16 text-yellow-400/30 mx-auto mb-4" />
            <p className="text-white/50 text-lg">Verwende die Suche oben</p>
            <p className="text-white/30 text-sm mt-2">
              Du kannst nach Vorname, Nachname, Discord User ID oder Discord ID suchen
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
