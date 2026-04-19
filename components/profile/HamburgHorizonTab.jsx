'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Trophy, Store, User as UserIcon, BarChart3,
  Search, Loader2, Sparkles, Award, TrendingUp, MessageCircle,
  Briefcase, MapPin, Cake, ShoppingCart, RefreshCw,
  DollarSign, Wallet, PiggyBank, Package, Receipt, ScrollText,
  CreditCard, Star, AlertCircle, Crown
} from 'lucide-react';

const SUBTABS = [
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'marktplatz', label: 'Marktplatz', icon: Store },
  { id: 'charakter', label: 'Charaktere', icon: UserIcon },
  { id: 'profil', label: 'Mein Profil', icon: BarChart3 },
];

// --- Gemeinsamer subtiler Container-Style im Stil von TransferMoneyView ---
const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
  borderColor: 'rgba(255, 255, 255, 0.1)'
};
const CARD_STYLE_SUBTLE = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
  borderColor: 'rgba(255, 255, 255, 0.08)'
};
const CARD_STYLE_ACTIVE = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))',
  borderColor: 'rgba(255, 255, 255, 0.15)'
};

export default function HamburgHorizonTab({ currentUser }) {
  const [subTab, setSubTab] = useState('leaderboard');

  return (
    <div className="space-y-6">
      {/* Info Banner (wie TransferMoneyView) */}
      <div
        className="p-4 rounded-xl border backdrop-blur-sm"
        style={CARD_STYLE}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white/70">
            <p className="font-medium text-white mb-1">Hamburg Horizon – Bot-Funktionen</p>
            <p>Leaderboard, Marktplatz, Charakter-Profile und deine Statistiken – alles direkt von unserem Discord-Bot.</p>
          </div>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div
        className="p-2 rounded-xl border overflow-x-auto"
        style={CARD_STYLE_SUBTLE}
      >
        <div className="flex gap-1 min-w-max">
          {SUBTABS.map(t => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                  ${active
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'}`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {subTab === 'leaderboard' && <LeaderboardView currentUser={currentUser} />}
      {subTab === 'marktplatz' && <MarktplatzView />}
      {subTab === 'charakter' && <CharakterView currentUser={currentUser} />}
      {subTab === 'profil' && <MeinProfilView currentUser={currentUser} />}
    </div>
  );
}

/* ---------------- Avatar Helper ---------------- */
function Avatar({ src, name, size = 40, className = '' }) {
  const [error, setError] = useState(false);
  const initial = (name || '?').charAt(0).toUpperCase();

  if (!src || error) {
    return (
      <div
        className={`rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/80 font-semibold flex-shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || 'User'}
      onError={() => setError(true)}
      className={`rounded-full border border-white/10 object-cover flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/* ---------------- LEADERBOARD ---------------- */
function LeaderboardView({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/hh/leaderboard?limit=100', { cache: 'no-store' });
      const j = await r.json();
      setData(j);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingCard />;
  if (!data?.success) return <ErrorCard msg="Leaderboard konnte nicht geladen werden" onRetry={load} />;

  const list = data.leaderboard || [];
  const me = data.me;

  return (
    <div className="space-y-4">
      {/* Mein Rang Card */}
      {me && (
        <div
          className="p-4 rounded-xl border"
          style={CARD_STYLE_ACTIVE}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar src={me.avatar} name={me.displayName || me.username || me.character?.name} size={56} />
                <div className="absolute -bottom-1 -right-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
                  #{me.rank}
                </div>
              </div>
              <div>
                <p className="text-sm text-white/50 mb-0.5">Dein Rang</p>
                <p className="text-white font-semibold">
                  {me.character?.name || me.displayName || me.username || 'Spieler'}
                </p>
                <p className="text-xs text-white/50">
                  Level {me.level} • {(me.totalXp > 0 ? me.totalXp : me.xp).toLocaleString('de-DE')} XP
                </p>
              </div>
            </div>
            <button
              onClick={load}
              className="p-2 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white transition-all"
              title="Neu laden"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {list.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((idx, i) => {
            const e = list[idx];
            const position = idx + 1;
            const isGold = position === 1;
            const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉';
            return (
              <div
                key={e.discord_user_id}
                className={`p-4 rounded-xl border text-center ${isGold ? 'order-2 -mt-2' : i === 0 ? 'order-1' : 'order-3'}`}
                style={isGold ? CARD_STYLE_ACTIVE : CARD_STYLE_SUBTLE}
              >
                <div className="flex justify-center mb-2">
                  <div className="relative">
                    <Avatar
                      src={e.avatar}
                      name={e.displayName || e.character?.name}
                      size={isGold ? 64 : 52}
                    />
                    <div className="absolute -top-1 -right-1 text-2xl">{medal}</div>
                  </div>
                </div>
                <p className="text-xs text-white/50">Rang {position}</p>
                <p className="text-sm font-semibold text-white truncate mt-1">
                  {e.character?.name || e.displayName || e.username || 'User'}
                </p>
                <p className="text-xs text-white/60 mt-1">Level {e.level}</p>
                <p className="text-xs text-white/40">
                  {(e.totalXp > 0 ? e.totalXp : e.xp).toLocaleString('de-DE')} XP
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Liste */}
      <div className="rounded-xl border overflow-hidden" style={CARD_STYLE_SUBTLE}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-white/60" />
            <h3 className="font-semibold text-white">Top {list.length}</h3>
          </div>
          <span className="text-xs text-white/50">{data.total} Spieler insgesamt</span>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {list.map((e) => {
            const isMe = currentUser?.id === e.discord_user_id;
            return (
              <div
                key={e.discord_user_id}
                className={`flex items-center gap-3 p-3 transition-colors ${isMe ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'}`}
              >
                <div className="w-8 text-center flex-shrink-0">
                  {e.rank <= 3 ? (
                    <span className="text-xl">{e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : '🥉'}</span>
                  ) : (
                    <span className="text-sm font-semibold text-white/40">#{e.rank}</span>
                  )}
                </div>
                <Avatar src={e.avatar} name={e.displayName || e.character?.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold truncate ${isMe ? 'text-white' : 'text-white/90'}`}>
                      {e.character?.name || e.displayName || e.username || `User ${e.discord_user_id.slice(-4)}`}
                    </span>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-semibold border border-white/10">
                        DU
                      </span>
                    )}
                    {e.character?.faction && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/60 border border-white/10">
                        {e.character.faction}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {(e.totalXp > 0 ? e.totalXp : e.xp).toLocaleString('de-DE')} XP gesamt
                    {e.messages > 0 && ` • ${e.messages.toLocaleString('de-DE')} Nachrichten`}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-white/50">Level</div>
                  <div className="text-lg font-bold text-white">{e.level}</div>
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <div className="p-8 text-center text-white/40 text-sm">
              Noch keine Einträge im Leaderboard
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- MARKTPLATZ ---------------- */
function MarktplatzView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 24;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page: String(page), pageSize: String(pageSize) });
      const r = await fetch(`/api/hh/marketplace?${params}`, { cache: 'no-store' });
      const j = await r.json();
      setData(j);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="p-4 rounded-xl border" style={CARD_STYLE_SUBTLE}>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Suche nach Item, Charakter oder Discord-Name..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
          />
        </div>
        {data?.success && (
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-white/50">
              {data.total} {data.total === 1 ? 'Angebot' : 'Angebote'} gefunden
            </span>
            <button
              onClick={load}
              className="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Aktualisieren
            </button>
          </div>
        )}
      </div>

      {loading && !data && <LoadingCard />}

      {data?.success && (
        data.listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.listings.map(l => (
                <div
                  key={l.id}
                  className="p-4 rounded-xl border transition-all hover:border-white/20"
                  style={CARD_STYLE_SUBTLE}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {l.itemEmoji || '📦'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white truncate">{l.itemName}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Avatar src={l.seller.avatar} name={l.seller.characterName || l.seller.discordUsername} size={20} />
                        <span className="text-xs text-white/60 truncate">
                          {l.seller.characterName || l.seller.discordUsername || 'Unbekannt'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between pt-3 border-t border-white/[0.06]">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Preis</div>
                      <div className="text-lg font-bold text-white">
                        {l.price?.toLocaleString('de-DE')} €
                      </div>
                    </div>
                    {l.allowOffers && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/[0.04] text-white/60 border border-white/10">
                        Angebote ok
                      </span>
                    )}
                  </div>
                  {l.createdAt && (
                    <div className="mt-2 text-[10px] text-white/30">
                      {new Date(l.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="p-3 rounded-xl border flex items-center justify-between" style={CARD_STYLE_SUBTLE}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.04] text-white/70 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                >
                  ← Vorherige
                </button>
                <span className="text-xs text-white/60">
                  Seite {page} / {data.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.04] text-white/70 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                >
                  Nächste →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 rounded-xl border text-center" style={CARD_STYLE_SUBTLE}>
            <ShoppingCart className="w-14 h-14 mx-auto mb-4 text-white/20" />
            <h3 className="text-base font-semibold text-white mb-2">Keine Angebote</h3>
            <p className="text-sm text-white/40">
              {search ? 'Keine Treffer für deine Suche.' : 'Aktuell sind keine Items im Marktplatz.'}
            </p>
          </div>
        )
      )}
    </div>
  );
}

/* ---------------- CHARAKTER SEARCH + DETAIL ---------------- */
function CharakterView({ currentUser }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (currentUser?.id && !selected) {
      loadCharacter(currentUser.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/hh/character-search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
        const j = await r.json();
        setResults(j.results || []);
      } catch (e) { console.error(e); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const loadCharacter = async (userId) => {
    setLoading(true);
    setSelected(userId);
    try {
      const r = await fetch(`/api/hh/character/${userId}`, { cache: 'no-store' });
      const j = await r.json();
      setDetail(j);
    } catch (e) {
      console.error(e);
      setDetail({ error: 'Fehler beim Laden' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="p-4 rounded-xl border" style={CARD_STYLE_SUBTLE}>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Charakter oder Discord-Name suchen (mind. 2 Zeichen)..."
            className="w-full pl-10 pr-10 py-2.5 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all"
          />
          {searching && (
            <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/40 animate-spin" />
          )}
        </div>
        {results.length > 0 && (
          <div className="mt-3 space-y-1 max-h-72 overflow-y-auto">
            {results.map(r => (
              <button
                key={r.discord_user_id}
                onClick={() => { loadCharacter(r.discord_user_id); setResults([]); setQ(''); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left hover:bg-white/[0.05] border border-transparent hover:border-white/10"
              >
                <Avatar src={r.avatar} name={r.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{r.name}</div>
                  <div className="text-xs text-white/50 truncate">
                    {r.discordUsername && <span>@{r.discordUsername} • </span>}
                    {r.faction && <span>{r.faction} • </span>}
                    Level {r.level}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <LoadingCard />}
      {!loading && detail?.error && (
        <div className="p-12 rounded-xl border text-center" style={CARD_STYLE_SUBTLE}>
          <UserIcon className="w-14 h-14 mx-auto mb-4 text-white/20" />
          <h3 className="text-base font-semibold text-white mb-2">Kein Charakter</h3>
          <p className="text-sm text-white/40">{detail.error}</p>
        </div>
      )}
      {!loading && detail?.success && <CharakterCard detail={detail} isSelf={currentUser?.id === selected} />}
    </div>
  );
}

function CharakterCard({ detail, isSelf }) {
  const c = detail.character;
  const s = detail.stats;
  const d = detail.discord;

  return (
    <div className="space-y-4">
      {/* Hero Card */}
      <div className="p-6 rounded-xl border" style={CARD_STYLE}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Avatar
            src={d?.avatar}
            name={c.name || c.vorname}
            size={96}
            className="shadow-xl"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
              <h2 className="text-2xl font-bold text-white">
                {c.name || `${c.vorname || ''} ${c.nachname || ''}`.trim()}
              </h2>
              {isSelf && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-semibold border border-white/10">
                  DU
                </span>
              )}
            </div>
            {d?.discordUsername && (
              <p className="text-sm text-white/50 mb-2">@{d.discordUsername}</p>
            )}
            <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-white/60 flex-wrap">
              {c.age && <span className="flex items-center gap-1"><Cake className="w-3 h-3" /> {c.age} Jahre</span>}
              {c.geschlecht && <span>{c.geschlecht}</span>}
              {c.herkunft && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.herkunft}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              {c.job && (
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] text-white/80 text-xs border border-white/10 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> {c.job}
                </span>
              )}
              {c.faction && (
                <span className="px-2.5 py-1 rounded-full bg-white/[0.04] text-white/80 text-xs border border-white/10 flex items-center gap-1">
                  <Award className="w-3 h-3" /> {c.faction}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatMini icon={TrendingUp} label="Level" value={s.level} />
        <StatMini icon={Sparkles} label="XP gesamt" value={(s.totalXp > 0 ? s.totalXp : s.xp)?.toLocaleString('de-DE')} />
        <StatMini icon={MessageCircle} label="Nachrichten" value={s.messages?.toLocaleString('de-DE') || '0'} />
        <StatMini icon={Store} label="Marktplatz" value={`${detail.activeListings} aktiv`} />
      </div>

      {/* Zusatz-Info */}
      <div className="p-4 rounded-xl border" style={CARD_STYLE_SUBTLE}>
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-white/60" />
          <h3 className="text-sm font-semibold text-white">Besitz</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="text-xs text-white/50 mb-1">Lizenzen & Items</div>
            <div className="text-lg font-bold text-white">{detail.licensesCount}</div>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="text-xs text-white/50 mb-1">Aktive Listings</div>
            <div className="text-lg font-bold text-white">{detail.activeListings}</div>
          </div>
        </div>
      </div>

      {detail.last_sync && (
        <p className="text-xs text-white/30 text-center">
          Zuletzt synchronisiert: {new Date(detail.last_sync).toLocaleString('de-DE')}
        </p>
      )}
    </div>
  );
}

/* ---------------- MEIN PROFIL ---------------- */
function MeinProfilView({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/hh/my-profile', { cache: 'no-store' });
      const j = await r.json();
      setData(j);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingCard />;
  if (!data?.success) return <ErrorCard msg="Profil konnte nicht geladen werden" onRetry={load} />;

  const totalMoney = (data.money?.cash || 0) + (data.money?.bank || 0) + (data.money?.savings || 0);

  return (
    <div className="space-y-4">
      {/* Hero: Avatar, Level, Rang */}
      <div className="p-6 rounded-xl border" style={CARD_STYLE}>
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <Avatar src={data.user?.avatar} name={data.user?.username} size={80} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl font-bold text-white">{data.user?.username}</h2>
              {data.stats.rank && data.stats.rank <= 3 && (
                <Crown className="w-5 h-5 text-yellow-400" />
              )}
            </div>
            {data.character && (
              <p className="text-sm text-white/60 mb-2">
                Charakter: {data.character.name || `${data.character.vorname || ''} ${data.character.nachname || ''}`.trim()}
              </p>
            )}
            <div className="flex items-center justify-center sm:justify-start gap-4 text-sm">
              <div>
                <span className="text-white/50">Level </span>
                <span className="text-white font-bold">{data.stats.level}</span>
              </div>
              {data.stats.rank && (
                <div>
                  <span className="text-white/50">Rang </span>
                  <span className="text-white font-bold">#{data.stats.rank}</span>
                  <span className="text-white/40 text-xs"> / {data.stats.totalUsers}</span>
                </div>
              )}
              <div>
                <span className="text-white/50">Vermögen </span>
                <span className="text-white font-bold">{totalMoney.toLocaleString('de-DE')}€</span>
              </div>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-5 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/60 mb-2">
            <span>{data.stats.xp?.toLocaleString('de-DE')} XP</span>
            <span>noch {(data.stats.xpNeeded - data.stats.xp).toLocaleString('de-DE')} XP → Level {data.stats.level + 1}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-white/40 rounded-full transition-all duration-700"
              style={{ width: `${data.stats.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Geld Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBig icon={Wallet} label="Bank" value={`${data.money.bank?.toLocaleString('de-DE')} €`} />
        <StatBig icon={DollarSign} label="Bar" value={`${data.money.cash?.toLocaleString('de-DE')} €`} />
        <StatBig icon={PiggyBank} label="Sparkonto" value={`${data.money.savings?.toLocaleString('de-DE')} €`} />
        <StatBig icon={Star} label="Credits" value={data.credits?.toLocaleString('de-DE')} />
      </div>

      {/* Item Stats Grid */}
      <div className="p-4 rounded-xl border" style={CARD_STYLE_SUBTLE}>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-white/60" />
          <h3 className="text-sm font-semibold text-white">Statistiken</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatMini icon={MessageCircle} label="Nachrichten" value={data.stats.messages?.toLocaleString('de-DE') || '0'} />
          <StatMini icon={ScrollText} label="Lizenzen" value={data.licensesCount} />
          <StatMini icon={Store} label="Listings" value={data.marketplaceActive} />
          <StatMini icon={ShoppingCart} label="Verkauft" value={data.marketplaceSold} />
          <StatMini icon={Receipt} label="Rechnungen" value={data.invoices} />
          <StatMini icon={CreditCard} label="Kredite" value={data.kredite} />
        </div>
      </div>

      {/* Achievements */}
      <div className="p-5 rounded-xl border" style={CARD_STYLE_SUBTLE}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-white/60" />
            <h3 className="text-base font-semibold text-white">Achievements</h3>
          </div>
          <span className="text-xs text-white/50">{data.achievements.length} freigeschaltet</span>
        </div>
        {data.achievements.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.achievements.map(a => (
              <div
                key={a.id}
                className="p-3 rounded-lg border transition-all hover:border-white/20"
                style={CARD_STYLE_SUBTLE}
              >
                <div className="text-2xl mb-1">{a.icon}</div>
                <div className="text-sm font-semibold text-white">{a.name}</div>
                <div className="text-xs text-white/50">{a.desc}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40 text-center py-4">
            Noch keine Achievements. Spiel weiter, um welche freizuschalten!
          </p>
        )}
      </div>

      {data.lastSync && (
        <p className="text-xs text-white/30 text-center">
          Daten vom Bot zuletzt synchronisiert: {new Date(data.lastSync).toLocaleString('de-DE')}
        </p>
      )}
    </div>
  );
}

/* ---------------- Shared Mini-Components ---------------- */
function StatMini({ icon: Icon, label, value }) {
  return (
    <div className="p-3 rounded-lg border" style={CARD_STYLE_SUBTLE}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-white/50" />
        <span className="text-xs text-white/50 truncate">{label}</span>
      </div>
      <div className="text-lg font-semibold text-white truncate">{value ?? '–'}</div>
    </div>
  );
}

function StatBig({ icon: Icon, label, value }) {
  return (
    <div className="p-4 rounded-xl border transition-colors hover:border-white/20" style={CARD_STYLE_SUBTLE}>
      <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-white/80" />
      </div>
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <div className="text-lg font-bold text-white truncate">{value ?? '–'}</div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="p-12 rounded-xl border text-center" style={CARD_STYLE_SUBTLE}>
      <Loader2 className="w-10 h-10 mx-auto mb-3 text-white/40 animate-spin" />
      <p className="text-sm text-white/50">Wird geladen...</p>
    </div>
  );
}

function ErrorCard({ msg, onRetry }) {
  return (
    <div className="p-12 rounded-xl border text-center" style={CARD_STYLE_SUBTLE}>
      <AlertCircle className="w-10 h-10 mx-auto mb-3 text-white/40" />
      <p className="text-sm text-white/60 mb-4">{msg}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-sm text-white transition-all"
        >
          Erneut versuchen
        </button>
      )}
    </div>
  );
}
