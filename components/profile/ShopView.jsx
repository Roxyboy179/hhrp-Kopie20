import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShoppingCart, CreditCard, TrendingUp, Check, X, Clock, 
  Sparkles, Shield, Car, Briefcase, Wrench, FileText, Lock,
  Truck, Bike, Crosshair, Scale, Heart, Ambulance, Flame,
  Fish, Laptop, AlertTriangle, ShoppingBag, Trash2,
  Plus, Minus, KeyRound, Info
} from 'lucide-react';
import { toast } from 'sonner';

export function ShopView({ user, userData, onRefresh }) {
  const [shopItems, setShopItems] = useState({});
  const [creditOptions, setCreditOptions] = useState([]);
  const [bankLimitUpgrades, setBankLimitUpgrades] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  
  // Debug: Zeige userData
  useEffect(() => {
    console.log('[SHOP] userData prop:', userData);
    console.log('[SHOP] userData DIREKT:', {
      bank: userData?.money?.bank,
      credits: userData?.credits,
      bankLimit: userData?.bankLimit,
      licenses: userData?.licenses
    });
  }, [userData]);
  
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
    
    // Cleanup
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
    'all': { name: 'Alle Items', icon: ShoppingCart, color: 'blue' },
    'führerscheine': { name: 'Führerscheine', icon: Car, color: 'green' },
    'waffen': { name: 'Waffenscheine', icon: Shield, color: 'red' },
    'versicherungen': { name: 'Versicherungen', icon: Briefcase, color: 'blue' },
    'vip_premiums': { name: 'VIP', icon: Sparkles, color: 'purple' },
    'werkzeuge': { name: 'Werkzeuge', icon: Wrench, color: 'yellow' },
    'schutzbriefe': { name: 'Schutzbriefe', icon: FileText, color: 'orange' }
  };

  // Separate Kategorie für Credits & Upgrades
  const specialCategories = {
    'credits': { name: 'Credits kaufen', icon: CreditCard, color: 'emerald' },
    'bank_limit': { name: 'Bank Limit', icon: TrendingUp, color: 'cyan' }
  };

  useEffect(() => {
    loadShopData();
    // Debug: Log userData
    if (userData) {
      console.log('[SHOP] UserData:', {
        bank: userData?.money?.bank,
        credits: userData?.credits,
        bankLimit: userData?.bankLimit
      });
    }
  }, [userData]);

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
  const addToCart = (itemId, itemType = 'item') => {
    const item = shopItems[itemId];
    if (!item) return;

    // Prüfe ob Item bereits im Warenkorb ist
    const itemExists = cart.some(cartItem => cartItem.id === itemId);
    if (itemExists) {
      toast.warning(`${item.name} ist bereits im Warenkorb`);
      return;
    }

    // Berechne Preis mit VIP-Rabatt
    const originalPrice = item.price;
    const discountedPrice = calculatePrice(originalPrice);

    const cartItem = {
      id: itemId,
      name: item.name,
      originalPrice: originalPrice,
      price: discountedPrice, // Mit Rabatt!
      hasDiscount: discountedPrice < originalPrice,
      type: itemType,
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

    // Validiere PIN gegen userData (aus Bot-Daten)
    // Prüfe erst cards[0].pin, dann bankAccount.pin
    const userPin = userData?.cards?.[0]?.pin || 
                    userData?.bankAccount?.pin || 
                    '0000';
    
    // Vergleiche als String (PIN kann Zahl oder String sein)
    if (pin !== String(userPin)) {
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
      } else if (pendingPurchase.type === 'item') {
        const res = await fetch('/api/shop/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: pendingPurchase.itemId })
        });

        const data = await res.json();
        if (res.ok) {
          toast.success(data.message);
        } else {
          toast.error(data.error);
        }
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
        onRefresh();
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
  // Licenses ist ein ARRAY in Supabase!
  const userLicensesArray = userData?.licenses || [];
  const userLicenses = {};
  userLicensesArray.forEach(license => {
    userLicenses[license] = { active: true }; // Konvertiere zu Object für einfachere Prüfung
  });
  
  const hasVIPPremium = userLicensesArray.includes('vip_premium');
  const hasVIPPlatinum = userLicensesArray.includes('vip_platinum');
  const hasVIPUltimate = userLicensesArray.includes('vip_ultimate');
  const hasVIPElitePlus = userLicensesArray.includes('vip_elite_plus');
  
  // Berechne VIP-Rabatt
  let vipDiscount = 0;
  if (hasVIPElitePlus) vipDiscount = 0.35; // 35%
  else if (hasVIPUltimate) vipDiscount = 0.20; // 20%
  else if (hasVIPPlatinum) vipDiscount = 0.10; // 10%
  
  // Funktion: Berechne Preis mit VIP-Rabatt
  const calculatePrice = (basePrice) => {
    if (vipDiscount > 0) {
      return Math.floor(basePrice * (1 - vipDiscount));
    }
    return basePrice;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/70">Lade Shop...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-green-400" />
            <div className="text-sm text-white/50">Bank Guthaben</div>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {userBalance.toLocaleString('de-DE')}€
          </div>
        </div>
        <div className="glass rounded-xl p-4 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            <div className="text-sm text-white/50">Credits</div>
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {userCredits.toLocaleString('de-DE')}
          </div>
        </div>
        <div className="glass rounded-xl p-4 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <div className="text-sm text-white/50">Bank Limit</div>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {userBankLimit.toLocaleString('de-DE')}€
          </div>
        </div>
      </div>

      {/* VIP Rabatt Info */}
      {vipDiscount > 0 && (
        <div className="glass rounded-xl p-4 border border-purple-500/30 bg-purple-500/10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <div>
              <div className="font-bold text-purple-400">VIP Rabatt aktiv!</div>
              <div className="text-sm text-white/70">
                Du erhältst {Math.round(vipDiscount * 100)}% Rabatt auf alle Shop-Items
                {hasVIPElitePlus && ' (VIP Elite Plus)'}
                {hasVIPUltimate && ' (VIP Ultimate)'}
                {hasVIPPlatinum && ' (VIP Platinum)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warenkorb Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCart(true)}
          className="relative glass rounded-xl px-4 py-2 border border-white/[0.08] hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Warenkorb
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Categories für normale Shop-Items */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3 text-white/80">🛍️ Shop Kategorien</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Object.entries(categories).map(([key, cat]) => {
            const Icon = cat.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === key
                    ? 'bg-blue-500 text-white'
                    : 'glass border border-white/[0.08] hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Separate Sektion für Credits & Upgrades */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3 text-white/80">💎 Credits & Upgrades</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Object.entries(specialCategories).map(([key, cat]) => {
            const Icon = cat.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  selectedCategory === key
                    ? 'bg-emerald-500 text-white'
                    : 'glass border border-emerald-500/30 hover:bg-emerald-500/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Credits kaufen */}
      {selectedCategory === 'credits' && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Credits kaufen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {creditOptions.map((option, index) => (
              <div key={index} className="glass rounded-xl p-6 border border-emerald-500/30 hover:border-emerald-400/50 transition-all">
                <div className="text-center mb-4">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-cyan-400" />
                  <div className="text-3xl font-bold text-cyan-400">{option.credits}</div>
                  <div className="text-sm text-white/50">Credits</div>
                  {option.discount > 0 && (
                    <div className="mt-2 inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                      -{option.discount}% Rabatt
                    </div>
                  )}
                </div>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-white">
                    {option.cost.toLocaleString('de-DE')}€
                  </div>
                </div>
                <button
                  onClick={() => openPinModal({ type: 'credits', optionIndex: index })}
                  disabled={purchasing || userBalance < option.cost}
                  className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-2 rounded-lg transition-all disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {userBalance < option.cost ? 'Zu wenig Geld' : 'Mit PIN kaufen'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bank Limit Upgrades */}
      {selectedCategory === 'bank_limit' && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Bank Limit erhöhen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankLimitUpgrades.map((upgrade, index) => (
              <div key={index} className="glass rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all">
                <div className="text-center mb-4">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-cyan-400" />
                  <div className="text-2xl font-bold text-cyan-400">
                    +{upgrade.addLimit.toLocaleString('de-DE')}€
                  </div>
                  <div className="text-sm text-white/50">Limit Erhöhung</div>
                </div>
                <div className="text-center mb-4">
                  <div className="text-lg font-bold text-white">
                    {upgrade.creditCost.toLocaleString('de-DE')} Credits
                  </div>
                </div>
                <button
                  onClick={() => openPinModal({ type: 'bank_limit', upgradeIndex: index })}
                  disabled={purchasing || userCredits < upgrade.creditCost}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-2 rounded-lg transition-all disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {userCredits < upgrade.creditCost ? 'Zu wenig Credits' : 'Mit PIN kaufen'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop Items */}
      {selectedCategory !== 'credits' && selectedCategory !== 'bank_limit' && (
        <div>
          <h3 className="text-xl font-bold mb-4">
            {categories[selectedCategory].name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(([id, item]) => {
              const ItemIcon = itemIcons[id] || ShoppingCart;
              
              // Prüfe ob User dieses Item bereits hat (licenses ist Array in Supabase!)
              const hasItem = userLicensesArray.includes(id);
              const isActive = hasItem;
              const expiresAt = null; // TODO: Ablaufdatum
              const isExpired = false;
              
              // Berechne Preis mit VIP-Rabatt
              const originalPrice = item.price;
              const discountedPrice = calculatePrice(originalPrice);
              const hasDiscount = discountedPrice < originalPrice;
              
              return (
                <div key={id} className="glass rounded-xl p-6 border border-white/[0.08] hover:border-white/20 transition-all relative">
                  {/* Bereits gekauft Badge */}
                  {hasItem && !isExpired && (
                    <div className="absolute top-3 right-3 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Besitzt du
                    </div>
                  )}
                  
                  {isExpired && (
                    <div className="absolute top-3 right-3 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Abgelaufen
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-blue-500/20">
                      <ItemIcon className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-1">{item.name}</h4>
                      <p className="text-sm text-white/50 line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                  
                  {/* Detaillierte Info */}
                  <div className="space-y-2 mb-4 p-3 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/50">Preis:</span>
                      <div className="flex items-center gap-2">
                        {hasDiscount && (
                          <span className="text-white/30 line-through text-xs">
                            {originalPrice.toLocaleString('de-DE')}€
                          </span>
                        )}
                        <span className="font-bold text-green-400">
                          {discountedPrice.toLocaleString('de-DE')}€
                        </span>
                        {hasDiscount && (
                          <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-bold">
                            -{Math.round(vipDiscount * 100)}% VIP
                          </span>
                        )}
                      </div>
                    </div>
                    {item.duration > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Laufzeit:</span>
                        <span className="text-white flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.duration} Tage
                        </span>
                      </div>
                    )}
                    {expiresAt && !isExpired && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Läuft ab:</span>
                        <span className="text-yellow-400 text-xs">
                          {expiresAt.toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    )}
                    {item.isSchutzbrief && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/50">Nutzungen:</span>
                        <span className="text-yellow-400 font-bold">
                          {hasItem?.nutzungen || item.maxNutzungen}/{item.maxNutzungen}x
                        </span>
                      </div>
                    )}
                    {item.autoRenewable && (
                      <div className="flex items-center gap-1 text-xs text-blue-400">
                        <Info className="w-3 h-3" />
                        Automatisch verlängerbar
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => addToCart(id)}
                      disabled={hasItem && !isExpired}
                      className="flex-1 glass border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Warenkorb
                    </button>
                    <button
                      onClick={() => openPinModal({ type: 'item', itemId: id })}
                      disabled={purchasing || userBalance < discountedPrice || (hasItem && !isExpired)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-2 rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                    >
                      <Lock className="w-4 h-4" />
                      {hasItem && !isExpired ? 'Besitzt du' : isExpired ? 'Erneuern' : 'Kaufen'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredItems.length === 0 && selectedCategory !== 'credits' && selectedCategory !== 'bank_limit' && (
        <div className="text-center py-12 text-white/50">
          Keine Items in dieser Kategorie
        </div>
      )}

      {/* Warenkorb als ECHTES Popup/Modal - mit Portal */}
      {showCart && createPortal(
        <>
          {/* Dunkler Overlay Hintergrund */}
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9998]"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setShowCart(false)}
          />
          
          {/* Modal Content - ZENTRIERT */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div 
              className="glass rounded-2xl p-6 border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6" />
                  Warenkorb ({cart.length})
                </h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                Warenkorb ist leer
              </div>
            ) : (
              <>
                {/* Scrollbarer Items-Bereich */}
                <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2">
                  {cart.map((item, index) => {
                    const ItemIcon = item.icon || ShoppingCart;
                    return (
                      <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <ItemIcon className="w-6 h-6 text-blue-400" />
                        <div className="flex-1">
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="flex items-center gap-2 text-sm">
                            {item.hasDiscount && (
                              <>
                                <span className="text-white/30 line-through">
                                  {item.originalPrice.toLocaleString('de-DE')}€
                                </span>
                                <span className="text-green-400 font-bold">
                                  {item.price.toLocaleString('de-DE')}€
                                </span>
                                <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-bold">
                                  -{Math.round(vipDiscount * 100)}% VIP
                                </span>
                              </>
                            )}
                            {!item.hasDiscount && (
                              <span className="text-green-400 font-bold">
                                {item.price.toLocaleString('de-DE')}€
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-all text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/30 mb-6">
                  {cartSavings > 0 && (
                    <div className="flex items-center justify-between text-sm mb-2 text-white/70">
                      <span>Original:</span>
                      <span className="line-through">{cartOriginalTotal.toLocaleString('de-DE')}€</span>
                    </div>
                  )}
                  {cartSavings > 0 && (
                    <div className="flex items-center justify-between text-sm mb-2 text-green-400">
                      <span>Ersparnis:</span>
                      <span className="font-bold">-{cartSavings.toLocaleString('de-DE')}€</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Gesamt:</span>
                    <span className="text-green-400">{cartTotal.toLocaleString('de-DE')}€</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={clearCart}
                    className="flex-1 glass border border-white/10 hover:bg-white/10 text-white font-bold py-3 rounded-lg transition-all"
                  >
                    Leeren
                  </button>
                  <button
                    onClick={() => {
                      setShowCart(false);
                      openPinModal({ type: 'cart' });
                    }}
                    disabled={userBalance < cartTotal}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Lock className="w-5 h-5" />
                    {userBalance < cartTotal ? 'Zu wenig Guthaben' : 'Mit PIN kaufen'}
                  </button>
                </div>
              </>
            )}
          </div>
          </div>
        </>,
        document.body
      )}

      {/* PIN Modal als ECHTES Popup - mit Portal */}
      {showPinModal && createPortal(
        <>
          {/* Dunkler Overlay Hintergrund */}
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9998]"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => {
              setShowPinModal(false);
              setPendingPurchase(null);
              setPin('');
              setPinError('');
            }}
          />
          
          {/* Modal Content - ZENTRIERT */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div 
              className="glass rounded-2xl p-6 border border-white/20 max-w-md w-full pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <KeyRound className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold">PIN eingeben</h3>
            </div>

            <p className="text-white/70 mb-6">
              Bitte gib deine Shop-PIN ein um den Kauf zu bestätigen.
            </p>

            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setPinError('');
              }}
              placeholder="PIN eingeben"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 mb-2"
              autoFocus
            />

            {pinError && (
              <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
                <AlertTriangle className="w-4 h-4" />
                {pinError}
              </div>
            )}

            <div className="text-xs text-white/50 mb-6">
              Deine Karten-PIN (aus deinem Bot-Profil)
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPendingPurchase(null);
                  setPin('');
                  setPinError('');
                }}
                className="flex-1 glass border border-white/10 hover:bg-white/10 text-white font-bold py-3 rounded-lg transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={executePurchase}
                disabled={!pin || purchasing}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <>Wird gekauft...</>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Bestätigen
                  </>
                )}
              </button>
            </div>
          </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
