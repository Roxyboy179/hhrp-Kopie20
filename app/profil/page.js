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

function IDCard({ character, avatarUrl, userId }) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Berechne Geburtsdatum aus Alter - FEST basierend auf User-ID
  const calculateBirthDate = (age, userId) => {
    if (!age) return 'N/A';
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - age;
    
    // Verwende User-ID als Seed für konsistente "zufällige" Werte
    const seed = parseInt(userId?.slice(0, 8) || '12345678', 10);
    const day = (seed % 28) + 1; // Tag zwischen 1-28
    const month = (seed % 12) + 1; // Monat zwischen 1-12
    
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${birthYear}`;
  };

  const birthDate = calculateBirthDate(character?.age, userId);
  const issueDate = new Date(2020, 3, 15); // Beispiel: 15.04.2020

  return (
    <div className="w-full perspective-1000">
      <div 
        className="relative w-full aspect-[1.586/1] cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={`relative w-full h-full transition-transform duration-700 transform-style-3d`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* VORDERSEITE */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Wasserzeichen */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <span className="text-[160px] font-black tracking-wider rotate-[-20deg] select-none">
                HHRP
              </span>
            </div>

            {/* Decorative waves */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-700/20 rounded-full translate-y-24 -translate-x-24"></div>

            <div className="relative h-full p-5 sm:p-6 flex flex-col text-white">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">Bundesrepublik Deutschland</p>
                  <h2 className="text-base font-bold">PERSONALAUSWEIS</h2>
                </div>
                <img src="/icon-192.png" alt="HHRP" className="w-10 h-10 rounded-lg" />
              </div>

              {/* Content Grid */}
              <div className="flex gap-3 flex-1">
                {/* Photo */}
                <div className="w-20 h-24 bg-gray-700 rounded overflow-hidden flex-shrink-0 border-2 border-gray-600">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-1.5 text-xs">
                  <div>
                    <p className="text-[9px] opacity-60 uppercase">Nachname</p>
                    <p className="font-semibold text-sm">{character?.nachname || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] opacity-60 uppercase">Vorname</p>
                    <p className="font-semibold">{character?.vorname || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] opacity-60 uppercase">Geburtsdatum</p>
                      <p className="font-semibold text-[11px]">{birthDate}</p>
                    </div>
                    <div>
                      <p className="text-[9px] opacity-60 uppercase">Geschlecht</p>
                      <p className="font-semibold text-[11px]">{character?.geschlecht || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] opacity-60 uppercase">Wohnort</p>
                    <p className="font-semibold text-[11px]">{character?.herkunft || 'Hamburg'}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/20">
                <div className="text-[10px] opacity-70">
                  <span className="font-semibold">Erstellt am:</span> {issueDate.toLocaleDateString('de-DE')}
                </div>
                <div className="text-[9px] opacity-40">
                  Klicken zum Umdrehen
                </div>
              </div>
            </div>
          </div>

          {/* RÜCKSEITE */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            {/* Wasserzeichen */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <span className="text-[160px] font-black tracking-wider rotate-[20deg] select-none">
                HHRP
              </span>
            </div>

            {/* Decorative waves */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>

            <div className="relative h-full p-5 sm:p-6 flex flex-col justify-between text-white">
              {/* Barcode Area */}
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] opacity-60 uppercase mb-1.5">Ausweis-Nummer</p>
                  <p className="text-lg font-mono font-bold tracking-wider">{userId?.slice(0, 12) || 'N/A'}</p>
                </div>

                {/* Barcode */}
                <div className="bg-white/95 rounded-lg p-2">
                  <div className="flex gap-[1px] h-14">
                    {[...Array(30)].map((_, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-gray-800"
                        style={{ opacity: Math.random() > 0.3 ? 1 : 0.3 }}
                      ></div>
                    ))}
                  </div>
                  <p className="text-center text-[8px] text-gray-800 font-mono mt-1">{userId?.slice(0, 16) || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-[9px] opacity-60 uppercase mb-1">Ausgestellt am</p>
                  <p className="font-semibold text-sm">{issueDate.toLocaleDateString('de-DE')}</p>
                </div>

                <div>
                  <p className="text-[9px] opacity-60 uppercase mb-1">Ausstellende Behörde</p>
                  <p className="text-xs font-semibold">Hamburg Horizon RP</p>
                  <p className="text-[10px] opacity-50">Bürgerbüro Hamburg</p>
                </div>

                <div className="pt-2 border-t border-white/20">
                  <p className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Unbegrenzt gültig
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-white/20">
                <div className="flex items-center justify-between text-[9px] opacity-60 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" />
                    <span className="font-medium">HHRP ID</span>
                  </div>
                  <span className="opacity-40">Klicken zum Umdrehen</span>
                </div>
                <p className="text-[8px] opacity-40 leading-relaxed">
                  Dieser Ausweis ist Eigentum von Hamburg Horizon RP. Bei Verlust oder Diebstahl unverzüglich melden.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BankCard({ card, userName }) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  const bankNames = {
    'elite_federal': 'Elite Federal Bank',
    'hamburg_horizon': 'Hamburg Horizon Bank',
    'deutsche_bank': 'Deutsche Bank',
    'sparkasse': 'Sparkasse Hamburg'
  };

  const bankName = bankNames[card.bankId] || 'Hamburg Bank';

  const formatCardNumber = (num) => {
    if (!num) return '0000 0000 0000 0000';
    const str = num.toString();
    if (str.length <= 12) {
      return str.match(/.{1,4}/g)?.join(' ') || str;
    }
    const padded = str.padStart(16, '0');
    return padded.match(/.{1,4}/g)?.join(' ') || str;
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert!`);
  };

  return (
    <div className="w-full max-w-md mx-auto perspective-1000">
      <div 
        className="relative w-full aspect-[1.586/1] cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* 3D Container */}
        <div 
          className={`relative w-full h-full transition-transform duration-700 transform-style-3d`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* VORDERSEITE */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Wasserzeichen HHRP */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <span className="text-[160px] font-black tracking-wider rotate-[-20deg] select-none">
                HHRP
              </span>
            </div>

            {/* Decorative waves */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gray-700/20 rounded-full translate-y-32 -translate-x-32"></div>

            {/* Card Content */}
            <div className="relative h-full p-5 sm:p-6 flex flex-col justify-between text-white">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs font-semibold">{bankName}</span>
                  </div>
                  <p className="text-[10px] opacity-70">Hamburg Horizon RP</p>
                </div>
                {/* HHRP Logo statt Mastercard */}
                <div className="flex items-center gap-2">
                  <img src="/icon-192.png" alt="HHRP" className="w-10 h-10 rounded-lg" />
                </div>
              </div>

              {/* Chip & Contactless */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300/95 to-yellow-400/95 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[1px] p-1">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="bg-yellow-600/50 rounded-[1px]"></div>
                    ))}
                  </div>
                </div>
                {/* Contactless Icon */}
                <svg className="w-6 h-6 opacity-90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0"/>
                  <path d="M6.5 10.5c0-3.03 2.47-5.5 5.5-5.5v2c-1.93 0-3.5 1.57-3.5 3.5H6.5z"/>
                  <path d="M9 10.5c0-1.66 1.34-3 3-3v2c-.55 0-1 .45-1 1H9z"/>
                  <path d="M11.5 10.5c0-.28.22-.5.5-.5v1h-.5z"/>
                </svg>
              </div>

              {/* Card Number */}
              <div className="space-y-1">
                <div className="flex items-center justify-between group/copy">
                  <p className="text-xl sm:text-2xl font-mono tracking-[0.25em] font-light">
                    {formatCardNumber(card.accountNumber)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(card.accountNumber, 'Kartennummer');
                    }}
                    className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Details */}
              <div className="flex items-end justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] opacity-60 uppercase tracking-wider">Card Holder</p>
                  <p className="text-sm font-medium uppercase tracking-wider">{userName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] opacity-60">Erstellt am</p>
                  <p className="text-[10px] font-semibold">15.04.2020</p>
                </div>
              </div>
            </div>
          </div>

          {/* RÜCKSEITE */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            {/* Wasserzeichen HHRP */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <span className="text-[140px] font-black tracking-wider rotate-[20deg] select-none">
                HHRP
              </span>
            </div>

            {/* Card Content Back */}
            <div className="relative h-full flex flex-col text-white">
              {/* Magnetic Stripe */}
              <div className="w-full h-12 bg-gradient-to-b from-gray-900 to-black mt-4"></div>

              {/* Signature & CVV Area */}
              <div className="px-5 sm:px-6 py-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Signature Strip */}
                  <div>
                    <p className="text-[10px] opacity-60 mb-1.5 uppercase tracking-wide">Unterschrift</p>
                    <div className="bg-white/95 h-10 rounded flex items-center px-3">
                      <div className="flex-1 flex items-center">
                        <span className="text-sm text-gray-700 italic font-semibold">{userName?.slice(0, 20)}</span>
                      </div>
                    </div>
                  </div>

                  {/* PIN Box */}
                  <div className="bg-white/95 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Key className="w-3.5 h-3.5 text-slate-600" />
                          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide">Karten-PIN</p>
                        </div>
                        <p className="text-2xl font-mono font-bold text-slate-800 tracking-wider">{card.code || '•••'}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (card.code) copyToClipboard(card.code, 'PIN');
                        }}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                      Gib diesen Code niemals weiter
                    </p>
                  </div>

                  {/* Card Info */}
                  {(card.identification || card.transferNumber) && (
                    <div className="space-y-1.5 text-xs">
                      {card.identification && (
                        <div className="flex items-center justify-between py-2 border-t border-white/20">
                          <div className="flex items-center gap-1.5 opacity-70">
                            <Hash className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-wide">ID-Nr:</span>
                          </div>
                          <div className="flex items-center gap-2 group/copy">
                            <span className="font-mono font-semibold text-xs">{card.identification}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(card.identification, 'ID');
                              }}
                              className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                      {card.transferNumber && (
                        <div className="flex items-center justify-between py-2 border-t border-white/20">
                          <div className="flex items-center gap-1.5 opacity-70">
                            <Hash className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-wide">Transfer:</span>
                          </div>
                          <div className="flex items-center gap-2 group/copy">
                            <span className="font-mono font-semibold text-xs">{card.transferNumber}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(card.transferNumber, 'Transfer-Nr');
                              }}
                              className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center justify-between text-[10px] opacity-70 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="font-medium">{bankName}</span>
                    </div>
                    <button 
                      className="hover:opacity-100 transition-opacity flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Umdrehen</span>
                    </button>
                  </div>
                  <p className="text-[9px] opacity-50 leading-relaxed">
                    Diese Karte ist Eigentum von Hamburg Horizon RP. Bei Verlust oder Diebstahl bitte sofort melden.
                  </p>
                </div>
              </div>
            </div>
          </div>
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
    { id: 'cards', label: 'Meine Dokumente', icon: IdCard },
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
            {/* Daily Bonus Widget */}
            <div className="glass rounded-2xl p-6 border border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Täglicher Bonus</h3>
                    <p className="text-sm text-white/60">Hol dir €5.000 kostenlos jeden Tag ab!</p>
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/user/rewards/daily', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      });
                      const data = await res.json();
                      
                      if (res.ok) {
                        toast.success('🎁 Daily Bonus erhalten!', {
                          description: `Du hast €${data.amount} erhalten! Der Bot wird dir das Geld in Kürze gutschreiben.`
                        });
                        // Reload rewards
                        loadData();
                      } else {
                        toast.error('Fehler', { description: data.error || 'Daily Bonus konnte nicht abgeholt werden' });
                      }
                    } catch (error) {
                      toast.error('Fehler', { description: 'Netzwerkfehler' });
                    }
                  }}
                  disabled={claiming}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-8 py-6 text-lg"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Daily Bonus abholen
                </Button>
              </div>
            </div>

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
                  <h2 className="text-xl font-bold text-white">Meine Dokumente</h2>
                </div>

                {/* Grid: Bankkarte links, Personalausweis rechts */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Bankkarte */}
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Bankkarte
                    </h3>
                    <div className="max-w-md">
                      <BankCard 
                        card={cards[0]} 
                        userName={character?.name || user.username}
                      />
                    </div>
                  </div>

                  {/* Personalausweis */}
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                      <IdCard className="w-4 h-4" />
                      Personalausweis
                    </h3>
                    <div className="max-w-md">
                      <IDCard 
                        character={character}
                        avatarUrl={avatarUrl}
                        userId={user.id}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass rounded-2xl p-12 text-center border border-white/[0.08]">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-bold text-white mb-2">Keine Dokumente</h3>
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
