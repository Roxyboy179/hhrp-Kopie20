'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { 
  Wallet, CreditCard, Trophy, Gift, User, Award, Clock, TrendingUp, 
  Check, Loader2, FileText, Calendar, Mail, ExternalLink
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

export default function ProfilPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [bewerbungen, setBewerbungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);

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
  const licenses = userData?.licenses || [];
  const cards = userData?.cards || [];
  const stats = userData?.stats || {};

  const totalMoney = (money.cash || 0) + (money.bank || 0) + (money.savings || 0);

  const statusColors = {
    'Eingereicht': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'In Bearbeitung': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Angenommen': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Abgelehnt': 'bg-red-500/20 text-red-300 border-red-500/30'
  };

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

        {/* Bewerbungen Section */}
        {bewerbungen.length > 0 && (
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
                {character.age && (
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                    <span className="text-white/50 text-sm">Alter</span>
                    <span className="text-white font-medium">{character.age}</span>
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

        {/* Licenses & Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {licenses.length > 0 && (
            <div className="glass rounded-2xl p-6 border border-white/[0.08]">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-white/60" />
                <h2 className="text-xl font-bold text-white">Lizenzen</h2>
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
                    {license}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cards.length > 0 && (
            <div className="glass rounded-2xl p-6 border border-white/[0.08]">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-white/60" />
                <h2 className="text-xl font-bold text-white">Karten</h2>
                <span className="px-2 py-1 rounded-full bg-white/10 text-white/50 text-xs">
                  {cards.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {cards.map((card, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm"
                  >
                    {card}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

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
      </div>
    </div>
  );
}
