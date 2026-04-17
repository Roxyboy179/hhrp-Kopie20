'use client';

import { useState } from 'react';
import { Send, ArrowRight, AlertCircle, CheckCircle2, Loader2, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const BANKS = {
  hamburg_horizon: { name: 'HAMBURG HORIZON BANK', fee: 0.02, emoji: '🏦' },
  nordic_capital: { name: 'NORDIC CAPITAL BANK', fee: 0.03, emoji: '🏦' },
  metrova_trust: { name: 'METROVA TRUST BANK', fee: 0.015, emoji: '🏦' },
  elite_federal: { name: 'ELITE FEDERAL BANK', fee: 0.004, emoji: '🏦' }
};

const VIP_DISCOUNTS = {
  'premium': { label: 'VIP Premium', discount: 0.5, emoji: '⭐' },
  'platinum': { label: 'VIP Platinum', discount: 0.75, emoji: '💎' },
  'ultimate': { label: 'VIP Ultimate', discount: 0.9, emoji: '⚡' },
  'elite_plus': { label: 'VIP ELITE PLUS', discount: 1.0, emoji: '🏆' }
};

export function TransferMoneyView({ userData, onTransferComplete }) {
  const [kontonummer, setKontonummer] = useState('');
  const [betrag, setBetrag] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Bank und VIP Status aus userData
  console.log('[TRANSFER DEBUG] userData:', userData);
  
  // Kontonummer und Bank-Info aus cards
  const userCard = userData?.cards?.[0] || {};
  console.log('[TRANSFER DEBUG] userCard:', userCard);
  console.log('[TRANSFER DEBUG] userCard keys:', Object.keys(userCard));
  
  const senderAccountNumber = userCard.cardNumber || userCard.accountNumber || userCard.number || null;
  const bankId = userCard.bankId || userCard.bank || 'hamburg_horizon';
  const bank = BANKS[bankId] || BANKS['hamburg_horizon'];
  
  console.log('[TRANSFER DEBUG] senderAccountNumber:', senderAccountNumber);
  
  // VIP Status aus licenses Array ermitteln
  const licenses = userData?.licenses || [];
  let vipStatus = null;
  let vipDiscount = null;
  
  if (licenses.includes('vip_elite_plus')) {
    vipStatus = 'elite_plus';
    vipDiscount = VIP_DISCOUNTS['elite_plus'];
  } else if (licenses.includes('vip_ultimate')) {
    vipStatus = 'ultimate';
    vipDiscount = VIP_DISCOUNTS['ultimate'];
  } else if (licenses.includes('vip_platinum')) {
    vipStatus = 'platinum';
    vipDiscount = VIP_DISCOUNTS['platinum'];
  } else if (licenses.includes('vip_premium')) {
    vipStatus = 'premium';
    vipDiscount = VIP_DISCOUNTS['premium'];
  }
  
  console.log('[TRANSFER DEBUG] vipStatus:', vipStatus);

  // Gebühren berechnen
  const betragNum = parseFloat(betrag) || 0;
  let feeRate = bank.fee;
  
  if (vipDiscount) {
    feeRate = vipDiscount.discount === 1.0 ? 0 : feeRate * (1 - vipDiscount.discount);
  }
  
  const fee = Math.ceil(betragNum * feeRate);
  const totalCost = betragNum + fee;
  const feePercent = (feeRate * 100).toFixed(1).replace('.', ',');

  // Verfügbares Guthaben aus money.bank
  const availableBalance = userData?.money?.bank || 0;
  console.log('[TRANSFER DEBUG] availableBalance:', availableBalance);
  const hasEnoughMoney = availableBalance >= totalCost;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validierung
    if (!kontonummer || kontonummer.length !== 9) {
      toast.error('Ungültige Kontonummer', {
        description: 'Die Kontonummer muss 9 Ziffern haben.'
      });
      return;
    }

    if (betragNum < 1000) {
      toast.error('Betrag zu niedrig', {
        description: 'Der Mindestbetrag für eine Überweisung beträgt 1.000€.'
      });
      return;
    }

    if (betragNum > 1000000) {
      toast.error('Betrag zu hoch', {
        description: 'Der Maximalbetrag für eine Überweisung beträgt 1.000.000€.'
      });
      return;
    }

    if (!hasEnoughMoney) {
      toast.error('Nicht genug Guthaben', {
        description: `Du benötigst ${totalCost.toLocaleString('de-DE')}€ (inkl. ${fee.toLocaleString('de-DE')}€ Gebühr)`
      });
      return;
    }

    setShowConfirm(true);
  };

  const executeTransfer = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kontonummer,
          betrag: betragNum
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Überweisung fehlgeschlagen');
      }

      toast.success('Überweisung erfolgreich!', {
        description: `${betragNum.toLocaleString('de-DE')}€ wurden überwiesen.`
      });

      // Reset form
      setKontonummer('');
      setBetrag('');
      setShowConfirm(false);

      // Callback zum Neuladen der Daten
      if (onTransferComplete) {
        onTransferComplete();
      }
    } catch (error) {
      toast.error('Fehler', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div 
        className="p-4 rounded-xl border backdrop-blur-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white/70">
            <p className="font-medium text-white mb-1">Überweise Geld an andere Spieler</p>
            <p>Gib die 9-stellige Kontonummer des Empfängers ein. Die Gebühr wird automatisch berechnet.</p>
          </div>
        </div>
      </div>

      {/* Bank Info */}
      <div 
        className="p-4 rounded-xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/50 mb-1">Deine Bank</p>
            <p className="text-white font-medium">{bank.emoji} {bank.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/50 mb-1">Verfügbar</p>
            <p className="text-white font-bold text-lg">{availableBalance.toLocaleString('de-DE')}€</p>
          </div>
        </div>
        {vipDiscount && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm text-white/70">
              {vipDiscount.emoji} <span className="font-medium">{vipDiscount.label}</span>
              {vipDiscount.discount === 1.0 ? (
                <span className="text-green-400 ml-2">KEINE Gebühren</span>
              ) : (
                <span className="text-green-400 ml-2">-{(vipDiscount.discount * 100).toFixed(0)}% Gebühren</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Transfer Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Kontonummer */}
        <div>
          <Label className="text-white/70 mb-2 block">Empfänger Kontonummer</Label>
          <Input
            type="text"
            value={kontonummer}
            onChange={(e) => setKontonummer(e.target.value.replace(/\D/g, '').slice(0, 9))}
            placeholder="123456789"
            maxLength={9}
            className="bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/25 h-12 text-lg"
            required
          />
          <p className="text-xs text-white/40 mt-1">9-stellige Kontonummer des Empfängers</p>
        </div>

        {/* Betrag */}
        <div>
          <Label className="text-white/70 mb-2 block">Betrag (€)</Label>
          <Input
            type="number"
            value={betrag}
            onChange={(e) => setBetrag(e.target.value)}
            placeholder="Mindestens 1.000€"
            min="1000"
            max="1000000"
            step="1"
            className="bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/25 h-12 text-lg"
            required
          />
          <p className="text-xs text-white/40 mt-1">
            Limits: Min. 1.000€ - Max. 1.000.000€
          </p>
        </div>

        {/* Berechnung */}
        {betragNum > 0 && (
          <div 
            className="p-4 rounded-xl border space-y-2"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02))',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-white/60" />
              <p className="text-sm font-medium text-white">Berechnung</p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Betrag</span>
              <span className="text-white font-medium">{betragNum.toLocaleString('de-DE')}€</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Gebühr ({feePercent}%)</span>
              <span className="text-white font-medium">{fee.toLocaleString('de-DE')}€</span>
            </div>
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between">
              <span className="text-white font-semibold">Gesamt</span>
              <span className="text-white font-bold text-lg">{totalCost.toLocaleString('de-DE')}€</span>
            </div>
            {!hasEnoughMoney && (
              <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                <AlertCircle className="w-4 h-4" />
                <span>Nicht genug Guthaben</span>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !hasEnoughMoney || betragNum <= 0}
          className="w-full h-12 text-base font-semibold rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff'
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Wird überwiesen...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Überweisung prüfen
            </>
          )}
        </Button>
      </form>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.95), rgba(20, 20, 20, 0.98))',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4">Überweisung bestätigen</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-white/60">An Konto</span>
                <span className="text-white font-mono">{kontonummer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Betrag</span>
                <span className="text-white font-bold">{betragNum.toLocaleString('de-DE')}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Gebühr</span>
                <span className="text-white">{fee.toLocaleString('de-DE')}€</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between">
                <span className="text-white font-semibold">Gesamt</span>
                <span className="text-white font-bold text-lg">{totalCost.toLocaleString('de-DE')}€</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button
                onClick={executeTransfer}
                disabled={loading}
                className="flex-1 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.3))',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#fff'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Überweise...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Bestätigen
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
