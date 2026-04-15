'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { 
  Wallet, CreditCard, Trophy, Gift, User, Award, Clock, TrendingUp, 
  Check, Loader2, FileText, Calendar, Mail, ExternalLink, LayoutDashboard, IdCard, ClipboardList,
  Building2, Hash, Key, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getDiscordAvatarUrl } from '@/lib/discord-utils';

function SkeletonCard({ className = "" }) {
  return (
    <div className={`glass rounded-xl p-6 border border-white/[0.08] animate-pulse ${className}`}>
      <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-white/10 rounded w-2/3"></div>
    </div>
  );
}

function BankCard({ card, userName }) {
  const bankNames = {
    'elite_federal': 'Elite Federal Bank',
    'hamburg_horizon': 'Hamburg Horizon Bank',
    'deutsche_bank': 'Deutsche Bank',
    'sparkasse': 'Sparkasse Hamburg'
  };

  const bankColors = {
    'elite_federal': 'from-slate-700 via-slate-600 to-slate-800',
    'hamburg_horizon': 'from-slate-700 via-slate-600 to-slate-800',
    'deutsche_bank': 'from-slate-700 via-slate-600 to-slate-800',
    'sparkasse': 'from-slate-700 via-slate-600 to-slate-800'
  };

  const bankName = bankNames[card.bankId] || 'Hamburg Bank';
  const gradient = bankColors[card.bankId] || 'from-gray-700 via-gray-600 to-gray-800';

  const formatCardNumber = (num) => {
    if (!num) return '0000 0000 0000 0000';
    const str = num.toString();
    // Wenn die Nummer kürzer als 16 Zeichen ist, zeige sie direkt formatiert
    if (str.length <= 12) {
      return str.match(/.{1,4}/g)?.join(' ') || str;
    }
    // Sonst formatiere als 4x4 Gruppen
    const padded = str.padStart(16, '0');
    return padded.match(/.{1,4}/g)?.join(' ') || str;
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert!`);
  };

  return (
    <div className="relative w-full aspect-[1.586/1] perspective-1000">
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} shadow-2xl overflow-hidden`}>
        {/* Wasserzeichen HHRP */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <span className="text-[120px] font-black tracking-wider rotate-[-20deg] select-none">
            HHRP
          </span>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-24 -translate-x-24"></div>

        {/* Card Content */}
        <div className="relative h-full p-6 flex flex-col justify-between text-white">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-5 h-5" />
                <span className="text-sm font-semibold opacity-90">{bankName}</span>
              </div>
              <p className="text-xs opacity-60">Hamburg Horizon RP</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
              <CreditCard className="w-6 h-6 text-yellow-900" />
            </div>
          </div>

          {/* Chip */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-11 rounded-md bg-gradient-to-br from-yellow-400/90 to-yellow-500/90 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1px] p-1">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-yellow-600/40 rounded-[1px]"></div>
                ))}
              </div>
            </div>
            <div className="text-xs opacity-70">Kontaktlos</div>
          </div>

          {/* Card Number */}
          <div className="space-y-1">
            <p className="text-xs opacity-60">Kartennummer</p>
            <div className="flex items-center justify-between group">
              <p className="text-xl font-mono tracking-wider font-semibold">
                {formatCardNumber(card.accountNumber)}
              </p>
              <button
                onClick={() => copyToClipboard(card.accountNumber, 'Kartennummer')}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card Details */}
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-xs opacity-60">Karteninhaber</p>
              <p className="text-sm font-semibold uppercase tracking-wide">{userName}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-xs opacity-60">PIN</p>
              <div className="flex items-center gap-2 group">
                <p className="text-sm font-mono font-semibold">{card.code || '•••'}</p>
                {card.code && (
                  <button
                    onClick={() => copyToClipboard(card.code, 'PIN')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info - Back side effect */}
          {(card.identification || card.transferNumber) && (
            <div className="mt-2 pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
              {card.identification && (
                <div className="flex items-center gap-1.5 group">
                  <Key className="w-3.5 h-3.5 opacity-60" />
                  <span className="opacity-60">ID:</span>
                  <span className="font-mono">{card.identification}</span>
                  <button
                    onClick={() => copyToClipboard(card.identification, 'ID')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
              {card.transferNumber && (
                <div className="flex items-center gap-1.5 group">
                  <Hash className="w-3.5 h-3.5 opacity-60" />
                  <span className="opacity-60">Transfer:</span>
                  <span className="font-mono">{card.transferNumber}</span>
                  <button
                    onClick={() => copyToClipboard(card.transferNumber, 'Transfer-Nr')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [bewerbungen, setBewerbungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      //Lade alles parallel im Hintergrund
      const [userRes, rewardsRes, bewerbungenRes] = await Promise.all([
        fetch('/api/user/data', { cache: 'no-store' }),
        fetch('/api/user/rewards', { cache: 'no-store' }),
        fetch('/api/bewerbungen/me', { cache: 'no-store' })
      ]);

      if (userRes.ok) {
        const json = await userRes.json();
        // Daten sind direkt in json.data.data
        const actualData = json.data?.data || json.data || null;
        setUserData(actualData);
        console.log('User data loaded:', actualData);
      }

      if (rewardsRes.ok) {
        const json = await rewardsRes.json();
        setRewards(json.rewards || []);
      }

      if (bewerbungenRes.ok) {
        const json = await bewerbungenRes.json();
        setBewerbungen(json.bewerbungen || []);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (rewardId) => {
    try {
      setClaiming(rewardId);
      
      const res = await fetch('/api/user/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Reward beansprucht!', {
          description: data.message || 'Der Bot wird dir das Geld in Kürze gutschreiben.'
        });
        setRewards(rewards.filter(r => r.id !== rewardId));
      } else {
        toast.error('Fehler', { description: data.error });
      }
    } catch (error) {
      toast.error('Fehler beim Beanspruchen');
    } finally {
      setClaiming(null);
    }
  };

  if (authLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  const avatarUrl = getDiscordAvatarUrl(user, 256);
  const money = userData?.money || {};
  const character = userData?.character || {};
  
  // licenses und cards sind bereits Arrays von der Sync-Funktion
  const licenses = Array.isArray(userData?.licenses) ? userData.licenses : [];
  const cards = Array.isArray(userData?.cards) ? userData.cards : [];
  const stats = userData?.stats || {};

  const totalMoney = (money.cash || 0) + (money.bank || 0) + (money.savings || 0);

  const statusColors = {
    'Eingereicht': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'In Bearbeitung': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Angenommen': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Abgelehnt': 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: LayoutDashboard },
    { id: 'cards', label: 'Bankkarten', icon: IdCard },
    { id: 'applications', label: 'Bewerbungen', icon: ClipboardList }
  ];

  return (
    <div className="min-h-screen px-4 py-8 pt-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header mit Discord Avatar */}
        <div className="glass rounded-2xl p-6 border border-white/[0.08]">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={user.username}
                className="w-20 h-20 rounded-full ring-2 ring-white/10"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold">
                {user.username?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{user.username}</h1>
              <p className="text-white/40 text-sm">Discord ID: {user.id}</p>
            </div>
            {userData?.lastSync && (
              <div className="text-right">
                <p className="text-xs text-white/30">Letzte Sync</p>
                <p className="text-xs text-white/50">
                  {new Date(userData.lastSync).toLocaleString('de-DE')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass rounded-2xl p-2 border border-white/[0.08]">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rewards Section */}
        {rewards.length > 0 && (
          <div className="glass rounded-2xl p-6 border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Verfügbare Rewards</h2>
              <span className="px-2 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-bold">
                {rewards.length}
              </span>
            </div>
            <div className="space-y-3">
              {rewards.map(reward => (
                <div 
                  key={reward.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-green-400">
                        €{reward.amount.toLocaleString()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                        {reward.reward_type}
                      </span>
                    </div>
                    {reward.description && (
                      <p className="text-sm text-white/50">{reward.description}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleClaimReward(reward.id)}
                    disabled={claiming === reward.id}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    {claiming === reward.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Wird beansprucht...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Jetzt claimen
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Money Overview */}
            {loading ? (
              <div className="grid md:grid-cols-3 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="glass rounded-xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Bargeld</p>
                      <p className="text-2xl font-bold text-white">
                        €{(money.cash || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Bank</p>
                      <p className="text-2xl font-bold text-white">
                        €{(money.bank || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Gesamt</p>
                      <p className="text-2xl font-bold text-white">
                        €{totalMoney.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Character Info */}
              {loading ? (
                <SkeletonCard />
              ) : character && Object.keys(character).length > 0 ? (
                <div className="glass rounded-2xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-6 h-6 text-white/60" />
                    <h2 className="text-xl font-bold text-white">Charakter</h2>
                  </div>
                  <div className="space-y-3">
                    {character.name && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Name</span>
                        <span className="text-white font-medium">{character.name}</span>
                      </div>
                    )}
                    {character.vorname && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Vorname</span>
                        <span className="text-white font-medium">{character.vorname}</span>
                      </div>
                    )}
                    {character.nachname && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Nachname</span>
                        <span className="text-white font-medium">{character.nachname}</span>
                      </div>
                    )}
                    {character.age && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Alter</span>
                        <span className="text-white font-medium">{character.age}</span>
                      </div>
                    )}
                    {character.geschlecht && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Geschlecht</span>
                        <span className="text-white font-medium">{character.geschlecht}</span>
                      </div>
                    )}
                    {character.herkunft && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Herkunft</span>
                        <span className="text-white font-medium">{character.herkunft}</span>
                      </div>
                    )}
                    {character.job && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Job</span>
                        <span className="text-white font-medium">{character.job}</span>
                      </div>
                    )}
                    {character.faction && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Fraktion</span>
                        <span className="text-white font-medium">{character.faction}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Stats */}
              {loading ? (
                <SkeletonCard />
              ) : stats && Object.keys(stats).length > 0 ? (
                <div className="glass rounded-2xl p-6 border border-white/[0.08]">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="w-6 h-6 text-white/60" />
                    <h2 className="text-xl font-bold text-white">Statistiken</h2>
                  </div>
                  <div className="space-y-3">
                    {stats.level !== undefined && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Level</span>
                        <span className="text-white font-medium">Level {stats.level}</span>
                      </div>
                    )}
                    {stats.xp !== undefined && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">XP</span>
                        <span className="text-white font-medium">{stats.xp.toLocaleString()}</span>
                      </div>
                    )}
                    {stats.messages !== undefined && (
                      <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                        <span className="text-white/50 text-sm">Nachrichten</span>
                        <span className="text-white font-medium">{stats.messages.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Licenses */}
            {licenses.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/[0.08]">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-6 h-6 text-white/60" />
                  <h2 className="text-xl font-bold text-white">Lizenzen & Versicherungen</h2>
                  <span className="px-2 py-1 rounded-full bg-white/10 text-white/50 text-xs">
                    {licenses.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {licenses.map((license, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm"
                    >
                      {license.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* No Data Placeholder */}
            {!loading && !userData && (
              <div className="glass rounded-2xl p-12 text-center border border-white/[0.08]">
                <Clock className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-bold text-white mb-2">Keine Daten verfügbar</h3>
                <p className="text-white/40 max-w-md mx-auto">
                  Deine Daten werden vom Bot synchronisiert. Spiele im Server und deine Daten erscheinen hier!
                </p>
              </div>
            )}
          </>
        )}

        {/* Bankkarten Tab */}
        {activeTab === 'cards' && (
          <div className="space-y-6">
            {loading ? (
              <SkeletonCard />
            ) : cards.length > 0 ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-6 h-6 text-white/60" />
                  <h2 className="text-xl font-bold text-white">Meine Bankkarten</h2>
                  <span className="px-2 py-1 rounded-full bg-white/10 text-white/50 text-xs">
                    {cards.length}
                  </span>
                </div>

                {/* Karten Grid - Zentriert */}
                <div className="max-w-2xl mx-auto">
                  {cards.map((card, i) => (
                    <BankCard 
                      key={i} 
                      card={card} 
                      userName={character?.name || user.username}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="glass rounded-2xl p-12 text-center border border-white/[0.08]">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-bold text-white mb-2">Keine Bankkarten</h3>
                <p className="text-white/40 max-w-md mx-auto">
                  Du hast noch keine Bankkarten. Erstelle eine im Discord Bot!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bewerbungen Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {loading ? (
              <SkeletonCard />
            ) : bewerbungen.length > 0 ? (
              <div className="glass rounded-2xl p-6 border border-white/[0.08]">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-white/60" />
                  <h2 className="text-xl font-bold text-white">Meine Bewerbungen</h2>
                  <span className="px-2 py-1 rounded-full bg-white/10 text-white/50 text-xs">
                    {bewerbungen.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {bewerbungen.map((bew) => (
                    <div 
                      key={bew.id}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{bew.typ === 'normal' ? 'Team-Bewerbung' : bew.typ === 'praktikum' ? 'Praktikum' : 'Uprank'}</h3>
                          <p className="text-xs text-white/40">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(bew.eingereichtAm).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[bew.status] || 'bg-white/10 text-white/50 border-white/20'}`}>
                          {bew.status}
                        </span>
                      </div>
                      {bew.bearbeitetVon && (
                        <p className="text-xs text-white/30">
                          Bearbeitet von: {bew.bearbeitetVon}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass rounded-2xl p-12 text-center border border-white/[0.08]">
                <FileText className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-bold text-white mb-2">Keine Bewerbungen</h3>
                <p className="text-white/40 max-w-md mx-auto mb-4">
                  Du hast noch keine Bewerbungen eingereicht.
                </p>
                <Button
                  onClick={() => router.push('/bewerbung')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Jetzt bewerben
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
