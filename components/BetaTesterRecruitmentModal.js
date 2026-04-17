'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BetaTesterRecruitmentModal({ user }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [betaTesterOpen, setBetaTesterOpen] = useState(false);

  useEffect(() => {
    checkBetaTesterStatus();
  }, []);

  const checkBetaTesterStatus = async () => {
    try {
      const res = await fetch('/api/bewerbung-settings');
      const data = await res.json();
      
      // Zeige Popup nur wenn:
      // 1. Beta Tester Bewerbungen offen sind
      // 2. User eingeloggt ist
      // 3. User noch KEIN Beta Tester ist
      // 4. User das Popup heute noch nicht geschlossen hat
      const isBetaTester = user?.roles?.includes('1494434149623136276');
      const hasSeenToday = localStorage.getItem('betaTesterPopupSeen') === new Date().toDateString();
      
      if (data.settings?.beta_tester_open && user && !isBetaTester && !hasSeenToday) {
        setBetaTesterOpen(true);
        // Warte 2 Sekunden bevor Popup erscheint
        setTimeout(() => setIsOpen(true), 2000);
      }
    } catch (e) {
      console.error('Fehler beim Laden der Beta Tester Settings:', e);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Speichere dass User das Popup heute gesehen hat
    localStorage.setItem('betaTesterPopupSeen', new Date().toDateString());
  };

  const handleApply = () => {
    handleClose();
    router.push('/bewerbung?type=beta_tester');
  };

  if (!isOpen || !betaTesterOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in-0 duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-purple-900/40 to-black border border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-500/20 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">
            Wir suchen Beta Tester
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            Sei einer der Ersten, die neue Features testen! Als Beta Tester hilfst du uns, 
            die Plattform zu verbessern und bekommst exklusiven Zugang zu kommenden Updates.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-8">
          {[
            'Exklusiver Zugang zu neuen Features',
            'Beta Tester Rolle & Badge',
            'Direkten Einfluss auf die Entwicklung',
            'Community-Events & Belohnungen'
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-white/80">
              <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleApply}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 rounded-xl text-base shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
          >
            Jetzt als Beta Tester bewerben
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <button
            onClick={handleClose}
            className="w-full text-white/50 hover:text-white/80 text-sm py-2 transition-colors"
          >
            Vielleicht später
          </button>
        </div>
      </div>
    </div>
  );
}
