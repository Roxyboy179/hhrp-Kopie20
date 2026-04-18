import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShoppingCart, CreditCard, TrendingUp, Check, X, Clock, 
  Sparkles, Shield, Car, Briefcase, Wrench, FileText, Lock,
  Truck, Bike, Crosshair, Scale, Heart, Ambulance, Flame,
  Fish, Laptop, AlertTriangle, ShoppingBag, Trash2,
  Plus, Minus, KeyRound, Info, Loader2, CheckCircle2, Calculator, Coins
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  // Deaktiviere Body Scroll wenn Modal offen ist
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

  // Icon Mapping für Items
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
      if (res.ok) {
        const data = await res.json();
        setShopItems(data.items);
        setCreditOptions(data.creditOptions);
        setBankLimitUpgrades(data.bankLimitUpgrades);
      }
    } catch (e) {
      console.error('Load shop error:', e);
      toast.error('Fehler beim Laden des Shops');
    } finally {
      setLoading(false);
    }
  };

  // Warenkorb Funktionen
  const addToCart = (itemId) => {
    const item = shopItems[itemId];
    if (!item) return;

    const itemExists = cart.some(cartItem => cartItem.id === itemId);
    if (itemExists) {
      toast.warning(`${item.name} ist bereits im Warenkorb`);
      return;
    }

    const originalPrice = item.price;
    const discountedPrice = calculatePrice(originalPrice, itemId); // ItemId mitgeben!

    const cartItem = {
      id: itemId,
      name: item.name,
      originalPrice: originalPrice,
      price: discountedPrice,
      hasDiscount: discountedPrice < originalPrice,
      type: 'item',
      icon: itemIcons[itemId]
    };

    setCart(prev => [...prev, cartItem]);
    toast.success(`${item.name} zum Warenkorb hinzugefügt`);
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    toast.info('Item entfernt');
  };

  const clearCart = () => {
    setCart([]);
    toast.info('Warenkorb geleert');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const cartOriginalTotal = cart.reduce((sum, item) => sum + item.originalPrice, 0);
  const cartSavings = cartOriginalTotal - cartTotal;

  // PIN Validierung & Kauf
  const openPinModal = (purchaseData) => {
    setPendingPurchase(purchaseData);
    setShowPinModal(true);
    setPin('');
    setPinError('');
  };

  const validatePin = async () => {
    if (!pin || pin.length < 3) {
      setPinError('PIN muss mindestens 3 Zeichen haben');
      return false;
    }

    // PIN-FIX: Verwende .code statt .pin!
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
      if (pendingPurchase.type === 'cart') {
        // Kaufe alle Items im Warenkorb
        for (const item of cart) {
          const res = await fetch('/api/shop/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: item.id })
          });

          if (!res.ok) {
            const data = await res.json();
            toast.error(`Fehler bei ${item.name}: ${data.error}`);
          }
        }
        toast.success(`${cart.length} Item(s) gekauft!`);
        clearCart();
        setShowCart(false);
      } else if (pendingPurchase.type === 'credits') {
        const res = await fetch('/api/shop/purchase-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optionIndex: pendingPurchase.optionIndex })
        });

        const data = await res.json();
        if (res.ok) {
          toast.success(data.message);
        } else {
          toast.error(data.error);
        }
      } else if (pendingPurchase.type === 'bank_limit') {
        const res = await fetch('/api/shop/upgrade-bank-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upgradeIndex: pendingPurchase.upgradeIndex })
        });

        const data = await res.json();
        if (res.ok) {
          toast.success(data.message);
        } else {
          toast.error(data.error);
        }
      }

      setTimeout(() => {
        if (onRefresh) onRefresh();
      }, 2000);
    } catch (e) {
      toast.error('Fehler beim Kauf');
    } finally {
      setPurchasing(false);
      setPendingPurchase(null);
    }
  };

  const filteredItems = Object.entries(shopItems).filter(([id, item]) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const userBalance = userData?.money?.bank || 0;
  const userCredits = userData?.credits || 0;
  const userBankLimit = userData?.bankLimit || 1000000;
  
  // VIP Status prüfen für Rabatte
  const userLicensesArray = userData?.licenses || [];
  
  const hasVIPPremium = userLicensesArray.includes('vip_premium');
  const hasVIPPlatinum = userLicensesArray.includes('vip_platinum');
  const hasVIPUltimate = userLicensesArray.includes('vip_ultimate');
  const hasVIPElitePlus = userLicensesArray.includes('vip_elite_plus');
  
  // VIP Hierarchie
  const vipHierarchy = {
    'vip_premium': 0,
    'vip_platinum': 1,
    'vip_ultimate': 2,
    'vip_elite_plus': 3
  };
  
  let userHighestVIP = -1;
  if (hasVIPElitePlus) userHighestVIP = 3;
  else if (hasVIPUltimate) userHighestVIP = 2;
  else if (hasVIPPlatinum) userHighestVIP = 1;
  else if (hasVIPPremium) userHighestVIP = 0;
  
  const canPurchaseVIP = (vipId) => {
    const vipLevel = vipHierarchy[vipId];
    if (vipLevel === undefined) return true;
    return vipLevel > userHighestVIP;
  };
  
  // VIP-Rabatte (korrekte Werte!)
  let vipDiscount = 0;
  if (hasVIPElitePlus) vipDiscount = 0.35; // 35%
  else if (hasVIPUltimate) vipDiscount = 0.20; // 20%
  else if (hasVIPPlatinum) vipDiscount = 0.10; // 10%
  
  const calculatePrice = (basePrice, itemId = null) => {
    // VIP-Items bekommen KEINEN VIP-Rabatt!
    if (itemId && itemId.startsWith('vip_')) {
      return basePrice;
    }
    
    if (vipDiscount > 0) {
      return Math.floor(basePrice * (1 - vipDiscount));
    }
    return basePrice;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner - Überweisung-Stil */}
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

      {/* Guthaben Info - Überweisung-Stil */}
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
            <p className="text-white font-bold text-lg">{userBalance.toLocaleString('de-DE')}€</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/50 mb-1">Credits</p>
            <p className="text-white font-bold text-lg">{userCredits}</p>
          </div>
        </div>
        {vipDiscount > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm text-white/70">
              {hasVIPElitePlus && '🏆 VIP ELITE PLUS'}
              {hasVIPUltimate && !hasVIPElitePlus && '⚡ VIP Ultimate'}
              {hasVIPPlatinum && !hasVIPUltimate && !hasVIPElitePlus && '💎 VIP Platinum'}
              <span className="text-green-400 ml-2">-{(vipDiscount * 100).toFixed(0)}% auf alle Käufe</span>
            </p>
          </div>
        )}
      </div>

      {/* Warenkorb Button */}
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

      {/* Kategorien - Überweisung-Stil */}
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

      {/* Credits kaufen */}
      {selectedCategory === 'credits' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creditOptions.map((option, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
                borderColor: 'rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">{option.label}</h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-4">{option.credits} Credits</p>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">{option.cost.toLocaleString('de-DE')}€</span>
                <Button
                  onClick={() => openPinModal({ type: 'credits', optionIndex: index })}
                  disabled={purchasing || userBalance < option.cost}
                  size="sm"
                  className="rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff'
                  }}
                >
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  Kaufen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bank Limit Upgrades */}
      {selectedCategory === 'bank_limit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankLimitUpgrades.map((upgrade, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
                borderColor: 'rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold text-white">{upgrade.label}</h3>
                </div>
              </div>
              <p className="text-sm text-white/60 mb-3">{upgrade.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">{upgrade.creditCost} Credits</span>
                <Button
                  onClick={() => openPinModal({ type: 'bank_limit', upgradeIndex: index })}
                  disabled={purchasing || userCredits < upgrade.creditCost}
                  size="sm"
                  className="rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff'
                  }}
                >
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  Kaufen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shop Items */}
      {selectedCategory !== 'credits' && selectedCategory !== 'bank_limit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(([id, item]) => {
            const ItemIcon = itemIcons[id] || ShoppingBag;
            
            const hasItem = userLicensesArray.includes(id);
            const isVIPItem = id.startsWith('vip_');
            const canBuyThisVIP = canPurchaseVIP(id);
            const isLowerVIP = isVIPItem && !canBuyThisVIP && !hasItem;
            
            const originalPrice = item.price;
            const discountedPrice = calculatePrice(originalPrice, id); // ItemId mitgeben!
            const hasDiscount = discountedPrice < originalPrice;
            
            return (
              <div
                key={id}
                className="p-4 rounded-xl border relative"
                style={{
                  background: (hasItem || isLowerVIP)
                    ? 'linear-gradient(135deg, rgba(100, 100, 100, 0.15), rgba(80, 80, 80, 0.1))' // Grauer für gesperrt
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
                  borderColor: (hasItem || isLowerVIP)
                    ? 'rgba(150, 150, 150, 0.2)' // Grauer Border für gesperrt
                    : 'rgba(255, 255, 255, 0.08)',
                  opacity: (hasItem || isLowerVIP) ? 0.7 : 1,
                  position: 'relative'
                }}
              >
                {/* Sperr-Overlay für besseren visuellen Effekt */}
                {(hasItem || isLowerVIP) && (
                  <div 
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)'
                    }}
                  />
                )}
                
                {/* Badges */}
                {hasItem && (
                  <div className="absolute top-2 right-2 bg-green-500/20 border border-green-500/50 rounded-lg px-2 py-1 z-10">
                    <span className="text-xs text-green-300 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Besitzt du
                    </span>
                  </div>
                )}
                {isLowerVIP && (
                  <div className="absolute top-2 right-2 bg-red-500/20 border border-red-500/50 rounded-lg px-2 py-1 z-10">
                    <span className="text-xs text-red-300 font-medium flex items-center gap-1">
                      <X className="w-3 h-3" />
                      Nicht verfügbar
                    </span>
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <ItemIcon className="w-5 h-5 text-white/70" />
                    <h3 className="font-semibold text-white">{item.name}</h3>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-white/50 mb-3 relative z-10">{item.description}</p>
                )}
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    {hasDiscount ? (
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 line-through text-sm">{originalPrice.toLocaleString('de-DE')}€</span>
                        <span className="text-green-400 font-bold">{discountedPrice.toLocaleString('de-DE')}€</span>
                      </div>
                    ) : (
                      <span className="text-white font-bold">{originalPrice.toLocaleString('de-DE')}€</span>
                    )}
                  </div>
                  <Button
                    onClick={() => addToCart(id)}
                    disabled={hasItem || isLowerVIP}
                    size="sm"
                    className="rounded-lg"
                    style={{
                      background: (hasItem || isLowerVIP)
                        ? 'linear-gradient(135deg, rgba(100, 100, 100, 0.3), rgba(80, 80, 80, 0.2))'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: (hasItem || isLowerVIP) ? 'rgba(255, 255, 255, 0.4)' : '#fff',
                      cursor: (hasItem || isLowerVIP) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {hasItem ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Gekauft
                      </>
                    ) : isLowerVIP ? (
                      <>
                        <Lock className="w-4 h-4 mr-1" />
                        Gesperrt
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Hinzufügen
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warenkorb Modal - Überweisung-Stil mit Portal */}
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
                  const Icon = item.icon || ShoppingBag;
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
                          {item.hasDiscount && (
                            <div className="flex items-center gap-2 text-sm mb-1">
                              <span className="text-white/40 line-through">{item.originalPrice.toLocaleString('de-DE')}€</span>
                              <span className="text-green-400 font-medium">{item.price.toLocaleString('de-DE')}€</span>
                            </div>
                          )}
                          {!item.hasDiscount && (
                            <p className="text-sm text-white/50">{item.price.toLocaleString('de-DE')}€</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
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
                  {cartSavings > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Ursprünglich</span>
                        <span className="text-white/60">{cartOriginalTotal.toLocaleString('de-DE')}€</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">VIP Rabatt</span>
                        <span className="text-green-400 font-medium">-{cartSavings.toLocaleString('de-DE')}€</span>
                      </div>
                      <div className="h-px bg-white/10 my-2" />
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white font-semibold">Gesamt</span>
                    <span className="text-white font-bold text-lg">{cartTotal.toLocaleString('de-DE')}€</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowCart(false);
                    openPinModal({ type: 'cart' });
                  }}
                  disabled={purchasing || cart.length === 0 || userBalance < cartTotal}
                  className="w-full h-12 text-base font-semibold rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.3))',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#fff'
                  }}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Jetzt kaufen
                </Button>
                
                {userBalance < cartTotal && (
                  <div className="flex items-center gap-2 text-red-400 text-sm justify-center">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Nicht genug Guthaben</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* PIN Modal - Überweisung-Stil mit Portal */}
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
              Bitte gib deine Bank-PIN ein, um den Kauf zu bestätigen.
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
