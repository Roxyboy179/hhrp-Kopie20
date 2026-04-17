'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Check, Loader2, Lock, Crown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SHOP_ITEMS } from '@/lib/shop-items';

export default function DecorationShop({ category, user }) {
  const [items, setItems] = useState([]);
  const [myItems, setMyItems] = useState({ ownedItems: [], activeDecoration: null, bankBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  // Check if user is VIP
  const isVIP = user?.licenses?.some(l => l?.startsWith('vip_'));

  useEffect(() => {
    loadItems();
    loadMyItems();
  }, [category]);

  const loadItems = () => {
    // Filter items by category
    const categoryItems = Object.values(SHOP_ITEMS).filter(item => item.category === category);
    setItems(categoryItems);
    setLoading(false);
  };

  const loadMyItems = async () => {
    try {
      const res = await fetch('/api/shop/my-items');
      const data = await res.json();
      if (res.ok) {
        setMyItems(data);
      }
    } catch (e) {
      console.error('Load items error:', e);
    }
  };

  const handlePurchase = async (itemId) => {
    setPurchasing(itemId);
    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message, { 
          description: `Neuer Kontostand: ${data.newBalance?.toLocaleString()} Credits` 
        });
        loadMyItems();
      } else {
        if (data.required) {
          toast.error('Nicht genug Geld', {
            description: `Du brauchst ${data.required?.toLocaleString()} Credits, aber hast nur ${data.balance?.toLocaleString()} Credits`
          });
        } else {
          toast.error('Fehler', { description: data.error });
        }
      }
    } catch (e) {
      toast.error('Fehler', { description: 'Kaufprozess fehlgeschlagen' });
    } finally {
      setPurchasing(null);
    }
  };

  const handleActivate = async (itemId) => {
    try {
      const res = await fetch('/api/profile/set-decoration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });

      if (res.ok) {
        toast.success('Dekoration aktiviert!');
        loadMyItems();
        // Reload page to show new decoration
        window.location.reload();
      } else {
        toast.error('Fehler beim Aktivieren');
      }
    } catch (e) {
      toast.error('Fehler');
    }
  };

  const handleDeactivate = async () => {
    try {
      const res = await fetch('/api/profile/set-decoration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: null })
      });

      if (res.ok) {
        toast.success('Dekoration entfernt!');
        loadMyItems();
        window.location.reload();
      }
    } catch (e) {
      toast.error('Fehler');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kontostand */}
      <div className="glass rounded-xl p-4 border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-white/50">Dein Kontostand</p>
            <p className="text-lg font-bold text-white">{myItems.bankBalance?.toLocaleString() || 0} Credits</p>
          </div>
        </div>
        {isVIP && (
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
            <div className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-300">VIP - Alles Gratis!</span>
            </div>
          </div>
        )}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const isOwned = myItems.ownedItems?.includes(item.id);
          const isActive = myItems.activeDecoration === item.id;
          const finalPrice = (isVIP && item.vipFree) ? 0 : item.price;
          const canAfford = myItems.bankBalance >= finalPrice;

          return (
            <div
              key={item.id}
              className={`glass rounded-xl p-4 border transition-all hover:scale-105 ${
                isActive 
                  ? 'border-green-500/50 bg-green-500/10' 
                  : isOwned
                  ? 'border-purple-500/30 bg-purple-500/5'
                  : 'border-white/[0.08]'
              }`}
            >
              {/* Preview */}
              <div className="aspect-square rounded-lg bg-gradient-to-br from-white/5 to-white/10 mb-3 flex items-center justify-center relative overflow-hidden">
                {/* Avatar Preview mit Item-Styling */}
                <div 
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"
                  style={item.css}
                />
                {isActive && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Name */}
              <h3 className="text-sm font-semibold text-white mb-1">{item.name}</h3>
              <p className="text-xs text-white/40 mb-3 line-clamp-2">{item.description}</p>

              {/* Price & Badges */}
              <div className="flex items-center justify-between mb-3">
                {finalPrice === 0 ? (
                  <div className="px-2 py-1 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                    <span className="text-xs font-bold text-yellow-300">GRATIS</span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-white">{finalPrice.toLocaleString()} C</span>
                )}
                {item.betaOnly && (
                  <Shield className="w-4 h-4 text-purple-400" />
                )}
              </div>

              {/* Actions */}
              {isOwned ? (
                <div className="space-y-2">
                  {isActive ? (
                    <Button
                      onClick={handleDeactivate}
                      variant="outline"
                      className="w-full bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30"
                      size="sm"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aktiv
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleActivate(item.id)}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      Aktivieren
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => handlePurchase(item.id)}
                  disabled={!canAfford && finalPrice > 0}
                  className={`w-full ${
                    finalPrice === 0
                      ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
                      : canAfford
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                      : 'bg-white/5 cursor-not-allowed'
                  }`}
                  size="sm"
                >
                  {purchasing === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : !canAfford && finalPrice > 0 ? (
                    <>
                      <Lock className="w-4 h-4 mr-1" />
                      Zu teuer
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      {finalPrice === 0 ? 'Kostenlos holen' : 'Kaufen'}
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">Keine Items in dieser Kategorie</p>
        </div>
      )}
    </div>
  );
}
