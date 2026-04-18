'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShoppingCart, CreditCard, TrendingUp, Check, X, Clock, 
  Sparkles, Shield, Car, Briefcase, Wrench, FileText, Lock,
  Truck, Bike, Crosshair, Scale, Heart, Ambulance, Flame,
  Fish, Laptop, AlertTriangle, ShoppingBag, Trash2,
  Plus, Minus, KeyRound, Info, Loader2, CheckCircle2,
  DollarSign, Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const VIP_HIERARCHY = ['vip_premium', 'vip_platinum', 'vip_ultimate', 'vip_elite_plus'];

const VIP_DISCOUNTS = {
  'vip_premium': { label: 'VIP Premium', discount: 0.05, emoji: '⭐' },
  'vip_platinum': { label: 'VIP Platinum', discount: 0.10, emoji: '💎' },
  'vip_ultimate': { label: 'VIP Ultimate', discount: 0.15, emoji: '⚡' },
  'vip_elite_plus': { label: 'VIP ELITE PLUS', discount: 0.20, emoji: '🏆' }
};

export function ShopView({ user, userData, onRefresh }) {
  const [shopItems, setShopItems] = useState({});
  const [creditOptions, setCreditOptions] = useState([]);
  const [bankLimitUpgrades, setBankLimitUpgrades] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  
  // Warenkorb State
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  
  // PIN Modal State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingPurchase, setPendingPurchase] = useState(null);

  // Body Scroll Lock
  useEffect(() => {
    if (showCart || showPinModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCart, showPinModal]);

  // Icon Mapping
  const itemIcons = {
    'führerschein_pkw': Car,
    'führerschein_motorrad': Bike,
    'führerschein_lkw': Truck,
    'waffenschein': Shield,
    'jagdschein': Crosshair,
    'versicherung_rechtsschutz': Scale,
    'versicherung_pkw': Car,
    'versicherung_lkw': Truck,
    'versicherung_kranken': Heart,
    'versicherung_hars': Wrench,
    'versicherung_diebstahl': Shield,
    'vip_premium': Sparkles,
    'vip_platinum': Sparkles,
    'vip_ultimate': Sparkles,
    'vip_elite_plus': Sparkles,
    'werkzeug_angel': Fish,
    'werkzeug_hacking': Laptop,
    'schutzbrief_polizei': Shield,
    'schutzbrief_drk': Ambulance,
    'schutzbrief_feuerwehr': Flame,
    'schutzbrief_hars': Wrench
  };

  const categories = {
    'all': { name: 'Alle Items', icon: ShoppingCart },
    'führerscheine': { name: 'Führerscheine', icon: Car },
    'waffen': { name: 'Waffenscheine', icon: Shield },
    'versicherungen': { name: 'Versicherungen', icon: Briefcase },
    'vip_premiums': { name: 'VIP', icon: Sparkles },
    'werkzeuge': { name: 'Werkzeuge', icon: Wrench },
    'schutzbriefe': { name: 'Schutzbriefe', icon: FileText }
  };

  const specialCategories = {
    'credits': { name: 'Credits kaufen', icon: CreditCard },
    'bank_limit': { name: 'Bank Limit', icon: TrendingUp }
  };

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    try {
      const res = await fetch('/api/shop/items');
      const data = await res.json();
      
      if (data.items) {
        setShopItems(data.items);
        setCreditOptions(data.credits || []);
        setBankLimitUpgrades(data.bankLimits || []);
      }
    } catch (error) {
      console.error('[SHOP] Fehler beim Laden:', error);
      toast.error('Fehler beim Laden des Shops');
    } finally {
      setLoading(false);
    }
  };

  // VIP Status ermitteln
  const getUserVipStatus = () => {
    const licenses = userData?.licenses || [];
    if (licenses.includes('vip_elite_plus')) return 'vip_elite_plus';
    if (licenses.includes('vip_ultimate')) return 'vip_ultimate';
    if (licenses.includes('vip_platinum')) return 'vip_platinum';
    if (licenses.includes('vip_premium')) return 'vip_premium';
    return null;
  };

  const userVipStatus = getUserVipStatus();
  const vipDiscount = userVipStatus ? VIP_DISCOUNTS[userVipStatus] : null;

  // Prüfe ob User VIP kaufen kann
  const canBuyVip = (itemId) => {
    if (!itemId.startsWith('vip_')) return true;
    if (!userVipStatus) return true;
    
    const currentIndex = VIP_HIERARCHY.indexOf(userVipStatus);
    const targetIndex = VIP_HIERARCHY.indexOf(itemId);
    
    return targetIndex > currentIndex;
  };

  // Berechne Preis mit Rabatt
  const calculatePrice = (basePrice) => {
    if (!vipDiscount) return basePrice;
    return Math.floor(basePrice * (1 - vipDiscount.discount));
  };

  // Warenkorb Funktionen
  const addToCart = (item, type = 'item') => {
    // Prüfe VIP Hierarchie
    if (type === 'item' && item.id.startsWith('vip_') && !canBuyVip(item.id)) {
      toast.error('VIP Upgrade nicht möglich', {
        description: 'Du besitzt bereits einen höheren oder gleichen VIP Status.'
      });
      return;
    }

    // Prüfe ob bereits im Warenkorb
    const existingIndex = cart.findIndex(i => i.id === item.id && i.type === type);
    if (existingIndex !== -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity = (newCart[existingIndex].quantity || 1) + 1;
      setCart(newCart);
    } else {
      setCart([...cart, { ...item, type, quantity: 1 }]);
    }
    
    toast.success('In Warenkorb gelegt', {
      description: item.name
    });
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, delta) => {
    const newCart = [...cart];
    const newQuantity = (newCart[index].quantity || 1) + delta;
    
    if (newQuantity <= 0) {
      removeFromCart(index);
    } else {
      newCart[index].quantity = newQuantity;
      setCart(newCart);
    }
  };

  // Berechne Warenkorb Gesamt
  const calculateCartTotal = () => {
    let subtotal = 0;
    cart.forEach(item => {
      const quantity = item.quantity || 1;
      if (item.type === 'credit') {
        subtotal += item.price * quantity;
      } else if (item.type === 'bank_limit') {
        subtotal += item.cost * quantity;
      } else {
        subtotal += item.price * quantity;
      }
    });
    
    const discount = vipDiscount ? Math.floor(subtotal * vipDiscount.discount) : 0;
    const total = subtotal - discount;
    
    return { subtotal, discount, total };
  };

  const { subtotal, discount, total } = calculateCartTotal();

  // PIN Validierung
  const validatePin = async () => {
    if (!pin || pin.length < 3) {
      setPinError('PIN muss mindestens 3 Zeichen haben');
      return false;
    }

    const userPin = userData?.cards?.[0]?.code || 
                    userData?.bankAccount?.pin || 
                    '0000';
    
    const userPinStr = String(userPin);
    const pinStr = String(pin);
    
    if (pinStr !== userPinStr) {
      setPinError('Falsche PIN');
      return false;
    }

    return true;
  };

  const executePurchase = async () => {
    const isValid = await validatePin();
    if (!isValid) return;

    setPurchasing(true);
    setShowPinModal(false);

    try {
      // Kaufe alle Items im Warenkorb
      const purchases = cart.map(item => ({
        itemId: item.id,
        type: item.type,
        quantity: item.quantity || 1,
        price: item.type === 'credit' ? item.price : (item.type === 'bank_limit' ? item.cost : item.price)
      }));

      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          items: purchases,
          totalCost: total
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Kauf fehlgeschlagen');
      }

      toast.success('Kauf erfolgreich!', {
        description: `${cart.length} ${cart.length === 1 ? 'Item' : 'Items'} gekauft für ${total.toLocaleString('de-DE')}€`
      });

      setCart([]);
      setShowCart(false);
      setPin('');
      setPinError('');
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('[SHOP] Kauf Fehler:', error);
      toast.error('Fehler beim Kauf', {
        description: error.message
      });
    } finally {
      setPurchasing(false);
    }
  };

  const openPinModal = () => {
    if (cart.length === 0) {
      toast.error('Warenkorb ist leer');
      return;
    }

    const availableBalance = userData?.money?.bank || 0;
    if (total > availableBalance) {
      toast.error('Nicht genug Guthaben', {
        description: `Du benötigst ${total.toLocaleString('de-DE')}€`
      });
      return;
    }

    setShowPinModal(true);
    setPin('');
    setPinError('');
  };

  // Filtere Items nach Kategorie
  const getFilteredItems = () => {
    if (selectedCategory === 'credits') return [];
    if (selectedCategory === 'bank_limit') return [];
    if (selectedCategory === 'all') {
      return Object.entries(shopItems).flatMap(([cat, items]) => 
        items.map(item => ({ ...item, category: cat }))
      );
    }
    return (shopItems[selectedCategory] || []).map(item => ({ ...item, category: selectedCategory }));
  };

  const filteredItems = getFilteredItems();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

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
          <ShoppingBag className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white/70">
            <p className="font-medium text-white mb-1">Willkommen im HHRP Shop</p>
            <p>Kaufe Lizenzen, Versicherungen, VIP-Upgrades und mehr. VIP-Mitglieder erhalten automatische Rabatte!</p>
          </div>
        </div>
      </div>

      {/* Guthaben Info */}
      <div 
        className="p-4 rounded-xl border"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/50 mb-1">Dein Guthaben</p>
            <p className="text-white font-bold text-lg">{(userData?.money?.bank || 0).toLocaleString('de-DE')}€</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/50 mb-1">Credits</p>
            <p className="text-white font-bold text-lg">{userData?.credits || 0}</p>
          </div>
        </div>
        {vipDiscount && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm text-white/70">
              {vipDiscount.emoji} <span className="font-medium">{vipDiscount.label}</span>
              <span className="text-green-400 ml-2">-{(vipDiscount.discount * 100).toFixed(0)}% auf alle Käufe</span>
            </p>
          </div>
        )}
      </div>

      {/* Warenkorb Button (fixiert) */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowCart(true)}
          className="rounded-xl h-12 px-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff'
          }}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Warenkorb ({cart.length})
        </Button>
      </div>

      {/* Kategorien */}
      <div className="flex flex-wrap gap-2">
        {Object.entries({ ...categories, ...specialCategories }).map(([key, cat]) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                border: isActive 
                  ? '1px solid rgba(255, 255, 255, 0.25)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff'
              }}
            >
              <Icon className="w-4 h-4 inline mr-2" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Items Grid */}
      {selectedCategory === 'credits' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creditOptions.map((option) => (
            <div
              key={option.id}
              className="p-4 rounded-xl border"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
                borderColor: 'rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">{option.name}</h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-4">{option.amount.toLocaleString('de-DE')} Credits</p>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">{option.price.toLocaleString('de-DE')}€</span>
                <Button
                  onClick={() => addToCart(option, 'credit')}
                  size="sm"
                  className="rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff'
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Hinzufügen
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : selectedCategory === 'bank_limit' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankLimitUpgrades.map((upgrade) => (
            <div
              key={upgrade.id}
              className="p-4 rounded-xl border"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
                borderColor: 'rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold text-white">{upgrade.name}</h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-4">{upgrade.newLimit.toLocaleString('de-DE')}€</p>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">{upgrade.cost.toLocaleString('de-DE')}€</span>
                <Button
                  onClick={() => addToCart(upgrade, 'bank_limit')}
                  size="sm"
                  className="rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff'
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Hinzufügen
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const Icon = itemIcons[item.id] || ShoppingBag;
            const basePrice = item.price;
            const discountedPrice = calculatePrice(basePrice);
            const canBuy = canBuyVip(item.id);
            const hasDiscount = discountedPrice < basePrice;

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  opacity: canBuy ? 1 : 0.5
                }}
              >
                {!canBuy && (
                  <div className="absolute top-2 right-2 bg-red-500/20 border border-red-500/50 rounded-lg px-2 py-1">
                    <span className="text-xs text-red-300 font-medium">Nicht verfügbar</span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-white/70" />
                    <h3 className="font-semibold text-white">{item.name}</h3>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-white/50 mb-3">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    {hasDiscount ? (
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 line-through text-sm">{basePrice.toLocaleString('de-DE')}€</span>
                        <span className="text-green-400 font-bold">{discountedPrice.toLocaleString('de-DE')}€</span>
                      </div>
                    ) : (
                      <span className="text-white font-bold">{basePrice.toLocaleString('de-DE')}€</span>
                    )}
                  </div>
                  <Button
                    onClick={() => addToCart(item, 'item')}
                    disabled={!canBuy}
                    size="sm"
                    className="rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff'
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Hinzufügen
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warenkorb Modal */}
      {showCart && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-2xl rounded-2xl border shadow-2xl max-h-[80vh] flex flex-col"
            style={{
              background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.95), rgba(20, 20, 20, 0.98))',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-white" />
                <h3 className="text-xl font-bold text-white">Warenkorb ({cart.length})</h3>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">Dein Warenkorb ist leer</p>
                </div>
              ) : (
                cart.map((item, index) => {
                  const Icon = itemIcons[item.id] || ShoppingBag;
                  const itemPrice = item.type === 'credit' ? item.price : (item.type === 'bank_limit' ? item.cost : item.price);
                  const quantity = item.quantity || 1;
                  const lineTotal = itemPrice * quantity;

                  return (
                    <div
                      key={index}
                      className="p-4 rounded-xl border"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02))',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 text-white/70 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">{item.name}</h4>
                          <p className="text-sm text-white/50">{itemPrice.toLocaleString('de-DE')}€ × {quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(index, -1)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            <Minus className="w-4 h-4 text-white/60" />
                          </button>
                          <span className="text-white font-medium w-8 text-center">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, 1)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            <Plus className="w-4 h-4 text-white/60" />
                          </button>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors ml-2"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/10 flex justify-between">
                        <span className="text-sm text-white/50">Zwischensumme</span>
                        <span className="text-white font-bold">{lineTotal.toLocaleString('de-DE')}€</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer mit Summe */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/10 space-y-4">
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
                    <span className="text-white/60">Zwischensumme</span>
                    <span className="text-white font-medium">{subtotal.toLocaleString('de-DE')}€</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">VIP Rabatt (-{(vipDiscount.discount * 100).toFixed(0)}%)</span>
                      <span className="text-green-400 font-medium">-{discount.toLocaleString('de-DE')}€</span>
                    </div>
                  )}
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex justify-between">
                    <span className="text-white font-semibold">Gesamt</span>
                    <span className="text-white font-bold text-lg">{total.toLocaleString('de-DE')}€</span>
                  </div>
                </div>

                <Button
                  onClick={openPinModal}
                  disabled={purchasing || cart.length === 0}
                  className="w-full h-12 text-base font-semibold rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.3))',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#fff'
                  }}
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Wird gekauft...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Jetzt kaufen
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* PIN Modal */}
      {showPinModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.95), rgba(20, 20, 20, 0.98))',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Bank-PIN eingeben
            </h3>
            
            <p className="text-sm text-white/60 mb-6">
              Bitte gib deine 3-stellige Bank-PIN ein, um den Kauf zu bestätigen.
            </p>

            <div className="space-y-4">
              <div>
                <Label className="text-white/70 mb-2 block">Bank-PIN</Label>
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError('');
                  }}
                  placeholder="•••"
                  maxLength={4}
                  className="bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/25 h-12 text-lg text-center tracking-widest"
                  autoFocus
                />
                {pinError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{pinError}</span>
                  </div>
                )}
              </div>

              <div 
                className="p-3 rounded-lg border"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
                  borderColor: 'rgba(255, 255, 255, 0.08)'
                }}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/60">Zu zahlen</span>
                  <span className="text-white font-bold">{total.toLocaleString('de-DE')}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Dein Guthaben</span>
                  <span className="text-white">{(userData?.money?.bank || 0).toLocaleString('de-DE')}€</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowPinModal(false);
                    setPin('');
                    setPinError('');
                  }}
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={purchasing}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={executePurchase}
                  disabled={purchasing || !pin}
                  className="flex-1 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.3))',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#fff'
                  }}
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kaufe...
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
        </div>,
        document.body
      )}
    </div>
  );
}
