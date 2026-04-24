'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Search, AlertTriangle, Loader2, User, Hash, Calendar, FileText } from 'lucide-react';

const inputClass = "bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/25 focus:border-white/30 focus:ring-white/10 rounded-xl h-11";

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
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('API Error:', errorData);
        toast.error(errorData.error || 'Fehler bei der Suche');
        setSearchResults([]);
        setSearching(false);
        return;
      }

      const data = await res.json();
      console.log('Search results:', data);
      
      setSearchResults(data.results || []);
      if (data.results.length === 0) {
        toast.info('Keine Ergebnisse gefunden');
      } else {
        toast.success(`${data.results.length} Benutzer gefunden`);
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0b' }}>
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-8" style={{ background: '#0a0a0b' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 sm:w-9 sm:h-9 text-yellow-400" />
            Verwarnungen Suche
          </h1>
          <p className="text-white/40 text-sm sm:text-[15px]">
            Suche nach Benutzern mit Verwarnungen (Vorname, Nachname, Discord User ID, Discord Username)
          </p>
        </div>

        {/* Suchformular */}
        <div 
          className="glass rounded-2xl p-5 sm:p-6 mb-6"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Vorname, Nachname, Discord User ID oder Discord Username eingeben..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={inputClass}
                disabled={searching}
              />
            </div>
            <Button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="h-11 px-8 rounded-xl font-semibold transition-all disabled:opacity-50"
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
              <div 
                className="glass rounded-2xl p-12 text-center"
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                <Search className="w-16 h-16 text-white/15 mx-auto mb-4" />
                <p className="text-white/40 text-lg font-medium">Keine Benutzer mit Verwarnungen gefunden</p>
                <p className="text-white/25 text-sm mt-2">Versuche einen anderen Suchbegriff</p>
              </div>
            ) : (
              searchResults.map((user, index) => (
                <div 
                  key={index} 
                  className="glass rounded-2xl p-5 sm:p-6"
                  style={{
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  {/* User Header */}
                  <div className="flex items-start justify-between mb-5 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center border"
                        style={{
                          background: 'rgba(234,179,8,0.08)',
                          borderColor: 'rgba(234,179,8,0.2)',
                        }}
                      >
                        <User className="w-6 h-6 text-yellow-300/90" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">
                          {user.vorname} {user.nachname}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-white/30 text-xs flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {user.discordUserId}
                          </span>
                          {user.discordId && (
                            <span className="text-white/30 text-xs">
                              @{user.discordId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-lg border"
                      style={{
                        background: user.warningCount >= 3 ? 'rgba(239,68,68,0.10)' : 'rgba(234,179,8,0.08)',
                        borderColor: user.warningCount >= 3 ? 'rgba(239,68,68,0.25)' : 'rgba(234,179,8,0.20)',
                      }}
                    >
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: user.warningCount >= 3 ? 'rgba(252,165,165,0.95)' : 'rgba(253,224,71,0.95)' }}
                      >
                        {user.warningCount} {user.warningCount === 1 ? 'Verwarnung' : 'Verwarnungen'}
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
                          borderColor: 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400/90 flex-shrink-0 mt-0.5" />
                            <span className="text-white/80 font-semibold text-sm">
                              Verwarnung #{wIndex + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/30 text-xs tabular-nums">
                            <Calendar className="w-3 h-3" />
                            {formatDate(warning.timestamp)}
                          </div>
                        </div>
                        
                        {warning.reason && (
                          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-white/5">
                            <FileText className="w-3.5 h-3.5 text-white/25 flex-shrink-0 mt-0.5" />
                            <p className="text-white/50 text-xs leading-relaxed">{warning.reason}</p>
                          </div>
                        )}
                        
                        {warning.warnedBy && (
                          <div className="mt-2 text-white/25 text-xs">
                            Ausgestellt von: <span className="text-white/40">{warning.warnedBy}</span>
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
          <div 
            className="glass rounded-2xl p-12 text-center"
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <AlertTriangle className="w-16 h-16 text-yellow-400/20 mx-auto mb-4" />
            <p className="text-white/40 text-lg font-medium">Verwende die Suche oben</p>
            <p className="text-white/25 text-sm mt-2">
              Du kannst nach Vorname, Nachname, Discord User ID oder Discord Username suchen
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
