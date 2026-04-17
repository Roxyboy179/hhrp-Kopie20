import { useState, useEffect } from 'react';
import { ShoppingCart, CreditCard, TrendingUp, Check, X, Clock, Sparkles, Shield, Car, Briefcase, Wrench, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function ShopView({ user, userData, onRefresh }) {
  const [shopItems, setShopItems] = useState({});
  const [creditOptions, setCreditOptions] = useState([]);
  const [bankLimitUpgrades, setBankLimitUpgrades] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const categories = {
    'all': { name: 'Alle Items', icon: ShoppingCart, color: 'blue' },
    'führerscheine': { name: 'Führerscheine', icon: Car, color: 'green' },
    'waffen': { name: 'Waffenscheine', icon: Shield, color: 'red' },
    'versicherungen': { name: 'Versicherungen', icon: Briefcase, color: 'blue' },
    'vip_premiums': { name: 'VIP', icon: Sparkles, color: 'purple' },
    'werkzeuge': { name: 'Werkzeuge', icon: Wrench, color: 'yellow' },
    'schutzbriefe': { name: 'Schutzbriefe', icon: FileText, color: 'orange' },
    'credits': { name: 'Credits', icon: CreditCard, color: 'emerald' },
    'bank_limit': { name: 'Bank Limit', icon: TrendingUp, color: 'cyan' }
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

  const purchaseItem = async (itemId) => {
    setPurchasing(true);

    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setTimeout(() => {
          onRefresh();
        }, 2000);
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Fehler beim Kauf');
    } finally {
      setPurchasing(false);
    }
  };

  const purchaseCredits = async (optionIndex) => {
    setPurchasing(true);

    try {
      const res = await fetch('/api/shop/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionIndex })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setTimeout(() => {
          onRefresh();
        }, 2000);
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Fehler beim Kauf');
    } finally {
      setPurchasing(false);
    }
  };

  const upgradeBankLimit = async (upgradeIndex) => {
    setPurchasing(true);

    try {
      const res = await fetch('/api/shop/upgrade-bank-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upgradeIndex })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setTimeout(() => {
          onRefresh();
        }, 2000);
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error('Fehler beim Upgrade');
    } finally {
      setPurchasing(false);
    }
  };

  const filteredItems = Object.entries(shopItems).filter(([id, item]) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const userBalance = userData?.data?.money?.bank || 0;
  const userCredits = userData?.data?.credits || 0;
  const userBankLimit = userData?.data?.bankLimit || 1000000;

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
          <div className="text-sm text-white/50 mb-1">Bank Guthaben</div>
          <div className="text-2xl font-bold text-green-400">
            {userBalance.toLocaleString('de-DE')}€
          </div>
        </div>
        <div className="glass rounded-xl p-4 border border-white/[0.08]">
          <div className="text-sm text-white/50 mb-1">Credits</div>
          <div className="text-2xl font-bold text-cyan-400">
            {userCredits.toLocaleString('de-DE')}
          </div>
        </div>
        <div className="glass rounded-xl p-4 border border-white/[0.08]">
          <div className="text-sm text-white/50 mb-1">Bank Limit</div>
          <div className="text-2xl font-bold text-blue-400">
            {userBankLimit.toLocaleString('de-DE')}€
          </div>
        </div>
      </div>

      {/* Categories */}
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
                  <div className="text-3xl font-bold text-cyan-400">{option.credits}</div>
                  <div className="text-sm text-white/50">Credits</div>
                  {option.discount > 0 && (
                    <div className="mt-2 inline-block bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                      -{option.discount}% Rabatt
                    </div>
                  )}
                </div>
                <div className="text-center mb-4">
                  <div className="text-xl font-bold text-white">
                    {option.cost.toLocaleString('de-DE')}€
                  </div>
                </div>
                <button
                  onClick={() => purchaseCredits(index)}
                  disabled={purchasing || userBalance < option.cost}
                  className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-2 rounded-lg transition-all disabled:cursor-not-allowed text-sm"
                >
                  {userBalance < option.cost ? 'Zu wenig Geld' : 'Kaufen'}
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
                  onClick={() => upgradeBankLimit(index)}
                  disabled={purchasing || userCredits < upgrade.creditCost}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-2 rounded-lg transition-all disabled:cursor-not-allowed text-sm"
                >
                  {userCredits < upgrade.creditCost ? 'Zu wenig Credits' : 'Upgrade'}
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
            {filteredItems.map(([id, item]) => (
              <div key={id} className="glass rounded-xl p-6 border border-white/[0.08] hover:border-white/20 transition-all">
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-3xl">{item.emoji}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-1">{item.name}</h4>
                    <p className="text-sm text-white/50">{item.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xl font-bold text-green-400">
                    {item.price.toLocaleString('de-DE')}€
                  </div>
                  {item.duration > 0 && (
                    <div className="flex items-center gap-1 text-sm text-white/50">
                      <Clock className="w-4 h-4" />
                      {item.duration}d
                    </div>
                  )}
                </div>

                {item.isSchutzbrief && (
                  <div className="mb-4 text-sm text-yellow-400 font-bold">
                    ⚡ {item.maxNutzungen}x Nutzungen
                  </div>
                )}

                <button
                  onClick={() => purchaseItem(id)}
                  disabled={purchasing || userBalance < item.price}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-2 rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {userBalance < item.price ? 'Zu wenig Geld' : 'Kaufen'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredItems.length === 0 && selectedCategory !== 'credits' && selectedCategory !== 'bank_limit' && (
        <div className="text-center py-12 text-white/50">
          Keine Items in dieser Kategorie
        </div>
      )}
    </div>
  );
}
