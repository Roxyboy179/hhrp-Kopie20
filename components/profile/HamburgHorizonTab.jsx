'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Trophy, Medal, Crown, Store, User as UserIcon, BarChart3,
  Search, Loader2, Sparkles, Award, TrendingUp, MessageCircle,
  Briefcase, MapPin, Cake, UserCircle2, ShoppingCart, RefreshCw,
  DollarSign, Wallet, PiggyBank, Package, Receipt, ScrollText,
  CreditCard, Star, Eye, AlertCircle
} from 'lucide-react';

const TABS = [
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, color: 'from-yellow-400 to-amber-600' },
  { id: 'marktplatz', label: 'Marktplatz', icon: Store, color: 'from-blue-400 to-cyan-600' },
  { id: 'charakter', label: 'Charaktere', icon: UserIcon, color: 'from-purple-400 to-pink-600' },
  { id: 'profil', label: 'Mein Profil', icon: BarChart3, color: 'from-emerald-400 to-teal-600' },
];

export default function HamburgHorizonTab({ currentUser }) {
  const [subTab, setSubTab] = useState('leaderboard');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass rounded-2xl p-5 border border-white/[0.08] bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Hamburg Horizon</h2>
            <p className="text-xs text-white/50">Bot-Funktionen direkt auf der Webseite</p>
          </div>
        </div>
      </div>

      {/* Subtabs */}
      <div className="glass rounded-2xl p-2 border border-white/[0.08] overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                  ${active
                    ? `bg-gradient-to-r ${t.color} text-white shadow-lg`
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05]'}`}
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
        <div className="glass rounded-2xl p-5 border border-yellow-400/20 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-orange-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-black text-white">#{me.rank}</span>
              </div>
              <div>
                <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">Dein Rang</div>
                <div className="text-lg font-bold text-white">Level {me.level}</div>
                <div className="text-xs text-white/60">
                  {(me.totalXp > 0 ? me.totalXp : me.xp).toLocaleString('de-DE')} XP gesamt
                  {me.messages > 0 && ` • ${me.messages.toLocaleString('de-DE')} Nachrichten`}
                </div>
              </div>
            </div>
            <button
              onClick={load}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
              title="Neu laden"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top 3 */}
      {list.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((idx, i) => {
            const e = list[idx];
            const position = idx + 1;
            const isGold = position === 1;
            const isSilver = position === 2;
            const medal = isGold ? '🥇' : isSilver ? '🥈' : '🥉';
            const gradient = isGold
              ? 'from-yellow-400 to-amber-600'
              : isSilver
                ? 'from-slate-300 to-slate-500'
                : 'from-orange-400 to-amber-700';
            return (
              <div
                key={e.discord_user_id}
                className={`glass rounded-2xl p-4 border border-white/[0.08] text-center ${isGold ? 'md:order-2 md:scale-105' : i === 0 ? 'md:order-1' : 'md:order-3'}`}
              >
                <div className="text-3xl mb-2">{medal}</div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${gradient} mb-2`}>
                  Rang {position}
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {e.character?.name || `User ${e.discord_user_id.slice(-4)}`}
                </div>
                <div className="text-xs text-white/60 mt-1">Level {e.level}</div>
                <div className="text-xs text-white/40">{e.xp.toLocaleString('de-DE')} XP</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Liste */}
      <div className="glass rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-white">Top {list.length}</h3>
          </div>
          <span className="text-xs text-white/50">{data.total} Spieler insgesamt</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {list.map((e) => {
            const isMe = currentUser?.id === e.discord_user_id;
            return (
              <div
                key={e.discord_user_id}
                className={`flex items-center gap-3 p-3 transition-colors ${isMe ? 'bg-yellow-500/5 hover:bg-yellow-500/10' : 'hover:bg-white/[0.03]'}`}
              >
                <div className="w-10 text-center">
                  {e.rank <= 3 ? (
                    <span className="text-xl">{e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : '🥉'}</span>
                  ) : (
                    <span className="text-sm font-bold text-white/50">#{e.rank}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold truncate ${isMe ? 'text-yellow-300' : 'text-white'}`}>
                      {e.character?.name || e.username || `User ${e.discord_user_id.slice(-4)}`}
                    </span>
                    {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 font-bold">DU</span>}
                    {e.character?.faction && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-300">{e.character.faction}</span>
                    )}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {(e.totalXp > 0 ? e.totalXp : e.xp).toLocaleString('de-DE')} XP gesamt
                    {e.messages > 0 && ` • ${e.messages.toLocaleString('de-DE')} Nachrichten`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    Lvl {e.level}
                  </div>
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <div className="p-8 text-center text-white/40">
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
      const params = new URLSearchParams({
        search,
        page: String(page),
        pageSize: String(pageSize)
      });
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
      <div className="glass rounded-2xl p-4 border border-white/[0.08]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Suche nach Item oder Verkäufer..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-400/50 focus:bg-white/[0.05] transition-all"
          />
        </div>
        {data?.success && (
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-white/50">
              {data.total} {data.total === 1 ? 'Angebot' : 'Angebote'} gefunden
            </span>
            <button
              onClick={load}
              className="text-xs text-blue-300 hover:text-blue-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Aktualisieren
            </button>
          </div>
        )}
      </div>

      {loading && !data && <LoadingCard />}

      {/* Listings */}
      {data?.success && (
        data.listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.listings.map(l => (
                <div
                  key={l.id}
                  className="group glass rounded-2xl p-4 border border-white/[0.08] hover:border-blue-400/30 hover:bg-white/[0.05] transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                      {l.itemEmoji || '📦'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{l.itemName}</h4>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-white/50">
                        <UserCircle2 className="w-3 h-3" />
                        <span className="truncate">{l.seller.characterName || 'Unbekannt'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between pt-3 border-t border-white/[0.06]">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">Preis</div>
                      <div className="text-lg font-black bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                        {l.price?.toLocaleString('de-DE')} €
                      </div>
                    </div>
                    {l.allowOffers && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
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
              <div className="glass rounded-2xl p-3 border border-white/[0.08] flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/70 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                >
                  ← Vorherige
                </button>
                <span className="text-xs text-white/60">
                  Seite {page} / {data.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/70 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
                >
                  Nächste →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="glass rounded-2xl p-12 border border-white/[0.08] text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h3 className="text-lg font-bold text-white mb-2">Keine Angebote</h3>
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

  // Eigenen Charakter als Default beim Mount
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
      <div className="glass rounded-2xl p-4 border border-white/[0.08]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Charakter suchen (mind. 2 Zeichen)..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400/50 focus:bg-white/[0.05] transition-all"
          />
          {searching && (
            <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/40 animate-spin" />
          )}
        </div>
        {results.length > 0 && (
          <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
            {results.map(r => (
              <button
                key={r.discord_user_id}
                onClick={() => { loadCharacter(r.discord_user_id); setResults([]); setQ(''); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left
                  ${selected === r.discord_user_id ? 'bg-purple-500/10 border border-purple-400/30' : 'hover:bg-white/[0.05]'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-sm font-bold text-white">
                  {(r.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{r.name}</div>
                  <div className="text-xs text-white/50">
                    {r.faction && <span>{r.faction} • </span>}
                    Level {r.level}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail */}
      {loading && <LoadingCard />}
      {!loading && detail?.error && (
        <div className="glass rounded-2xl p-12 border border-white/[0.08] text-center">
          <UserIcon className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h3 className="text-lg font-bold text-white mb-2">Kein Charakter</h3>
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
  const initial = (c.name || c.vorname || '?').charAt(0).toUpperCase();

  return (
    <div className="space-y-4">
      {/* Hero Card */}
      <div className="glass rounded-2xl p-6 border border-white/[0.08] bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-blue-500/10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-400 via-pink-500 to-blue-500 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-purple-500/30">
            {initial}
          </div>
          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
              <h2 className="text-2xl font-black text-white">{c.name || `${c.vorname || ''} ${c.nachname || ''}`.trim()}</h2>
              {isSelf && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-300 font-bold border border-purple-400/30">DU</span>}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-white/60 flex-wrap">
              {c.age && <span className="flex items-center gap-1"><Cake className="w-3 h-3" /> {c.age} Jahre</span>}
              {c.geschlecht && <span>{c.geschlecht}</span>}
              {c.herkunft && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.herkunft}</span>}
            </div>
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              {c.job && (
                <span className="px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 text-xs border border-amber-400/20 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> {c.job}
                </span>
              )}
              {c.faction && (
                <span className="px-2.5 py-1 rounded-full bg-blue-400/10 text-blue-300 text-xs border border-blue-400/20 flex items-center gap-1">
                  <Award className="w-3 h-3" /> {c.faction}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatMini icon={TrendingUp} label="Level" value={s.level} color="text-yellow-400" />
        <StatMini icon={Sparkles} label="XP" value={s.xp?.toLocaleString('de-DE')} color="text-purple-400" />
        <StatMini icon={MessageCircle} label="Nachrichten" value={s.messages?.toLocaleString('de-DE')} color="text-blue-400" />
        <StatMini icon={Store} label="Marktplatz" value={`${detail.activeListings} aktiv`} color="text-emerald-400" />
      </div>

      {/* Zusatz-Info */}
      <div className="glass rounded-2xl p-4 border border-white/[0.08]">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-white/60" />
          <h3 className="text-sm font-bold text-white">Besitz</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.03]">
            <div className="text-xs text-white/50">Lizenzen & Items</div>
            <div className="text-lg font-bold text-white">{detail.licensesCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03]">
            <div className="text-xs text-white/50">Aktive Listings</div>
            <div className="text-lg font-bold text-white">{detail.activeListings}</div>
          </div>
        </div>
      </div>

      {detail.last_sync && (
        <div className="text-xs text-white/30 text-center">
          Zuletzt synchronisiert: {new Date(detail.last_sync).toLocaleString('de-DE')}
        </div>
      )}
    </div>
  );
}

/* ---------------- MEIN PROFIL (erweitert) ---------------- */
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
      {/* Level Card - Hero */}
      <div className="glass rounded-2xl p-6 border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">Dein Level</div>
              <div className="flex items-end gap-2">
                <span className="text-6xl font-black bg-gradient-to-br from-emerald-300 to-teal-500 bg-clip-text text-transparent">
                  {data.stats.level}
                </span>
                {data.stats.rank && (
                  <div className="pb-2">
                    <div className="text-xs text-white/40">Rang</div>
                    <div className="text-xl font-bold text-white">#{data.stats.rank}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/50 mb-1">Gesamtvermögen</div>
              <div className="text-2xl font-black text-white">
                {totalMoney.toLocaleString('de-DE')} €
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-white/60 mb-2">
              <span>{data.stats.xp?.toLocaleString('de-DE')} XP</span>
              <span>{data.stats.xpNeeded?.toLocaleString('de-DE')} XP → Level {data.stats.level + 1}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700"
                style={{ width: `${data.stats.progressPct}%` }}
              />
            </div>
            <div className="text-right text-xs text-white/40 mt-1">{data.stats.progressPct}%</div>
          </div>
        </div>
      </div>

      {/* Kern-Stats 4er-Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBig icon={Wallet} label="Bank" value={`${data.money.bank?.toLocaleString('de-DE')} €`} color="from-blue-400 to-cyan-500" />
        <StatBig icon={DollarSign} label="Bar" value={`${data.money.cash?.toLocaleString('de-DE')} €`} color="from-green-400 to-emerald-500" />
        <StatBig icon={PiggyBank} label="Sparkonto" value={`${data.money.savings?.toLocaleString('de-DE')} €`} color="from-amber-400 to-orange-500" />
        <StatBig icon={Star} label="Credits" value={data.credits?.toLocaleString('de-DE')} color="from-purple-400 to-pink-500" />
      </div>

      {/* Charakter mini */}
      {data.character && (
        <div className="glass rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-xl font-bold text-white">
              {(data.character.name || data.character.vorname || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">
                {data.character.name || `${data.character.vorname || ''} ${data.character.nachname || ''}`.trim()}
              </div>
              <div className="text-xs text-white/50">
                {data.character.job && <span>{data.character.job}</span>}
                {data.character.job && data.character.faction && <span> • </span>}
                {data.character.faction && <span>{data.character.faction}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item-Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatMini icon={MessageCircle} label="Nachrichten" value={data.stats.messages?.toLocaleString('de-DE')} color="text-blue-400" />
        <StatMini icon={ScrollText} label="Lizenzen" value={data.licensesCount} color="text-amber-400" />
        <StatMini icon={Store} label="Aktive Listings" value={data.marketplaceActive} color="text-emerald-400" />
        <StatMini icon={ShoppingCart} label="Verkauft" value={data.marketplaceSold} color="text-green-400" />
        <StatMini icon={Receipt} label="Rechnungen" value={data.invoices} color="text-red-400" />
        <StatMini icon={CreditCard} label="Kredite" value={data.kredite} color="text-purple-400" />
      </div>

      {/* Achievements */}
      <div className="glass rounded-2xl p-5 border border-white/[0.08]">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h3 className="text-base font-bold text-white">Achievements</h3>
          <span className="text-xs text-white/50">({data.achievements.length} freigeschaltet)</span>
        </div>
        {data.achievements.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.achievements.map(a => (
              <div
                key={a.id}
                className="p-3 rounded-xl bg-gradient-to-br from-yellow-400/5 to-amber-500/5 border border-yellow-400/20 hover:border-yellow-400/40 transition-all"
              >
                <div className="text-2xl mb-1">{a.icon}</div>
                <div className="text-sm font-bold text-white">{a.name}</div>
                <div className="text-xs text-white/50">{a.desc}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40 text-center py-6">
            Noch keine Achievements. Spiel weiter, um welche freizuschalten!
          </p>
        )}
      </div>

      {data.lastSync && (
        <div className="text-xs text-white/30 text-center">
          Daten vom Bot zuletzt synchronisiert: {new Date(data.lastSync).toLocaleString('de-DE')}
        </div>
      )}
    </div>
  );
}

/* ---------------- Shared Mini-Components ---------------- */
function StatMini({ icon: Icon, label, value, color }) {
  return (
    <div className="glass rounded-xl p-3 border border-white/[0.08]">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-xs text-white/50 truncate">{label}</span>
      </div>
      <div className="text-lg font-bold text-white truncate">{value ?? '–'}</div>
    </div>
  );
}

function StatBig({ icon: Icon, label, value, color }) {
  return (
    <div className="glass rounded-2xl p-4 border border-white/[0.08] hover:border-white/20 transition-colors">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <div className="text-xl font-black text-white truncate">{value ?? '–'}</div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="glass rounded-2xl p-12 border border-white/[0.08] text-center">
      <Loader2 className="w-10 h-10 mx-auto mb-3 text-white/40 animate-spin" />
      <p className="text-sm text-white/50">Wird geladen...</p>
    </div>
  );
}

function ErrorCard({ msg, onRetry }) {
  return (
    <div className="glass rounded-2xl p-12 border border-red-400/20 text-center">
      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400/60" />
      <p className="text-sm text-white/70 mb-4">{msg}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white transition-all"
        >
          Erneut versuchen
        </button>
      )}
    </div>
  );
}
