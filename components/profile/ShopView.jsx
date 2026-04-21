import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShoppingCart, CreditCard, TrendingUp, Check, X, Clock, 
  Sparkles, Shield, Car, Briefcase, Wrench, FileText, Lock,
  Truck, Bike, Crosshair, Scale, Heart, Ambulance, Flame,
  Fish, Laptop, AlertTriangle, ShoppingBag, Trash2,
  Plus, Minus, KeyRound, Info, Loader2, CheckCircle2, Calculator, Coins,
  // Icons für Credit-Spend + Mystery Boxes
  Hash, RotateCcw, Receipt, Zap, Rocket, Award, ShieldPlus, Unlock,
  ShieldCheck, Dice5, Ticket, Crown, Gem, Package, Gift, Glasses, Bus, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Icon-Map für Credit-Spend Items (ersetzt Emojis)
const SPEND_ITEM_ICONS = {
  custom_kontonummer:   { Icon: Hash,         color: '#60A5FA' }, // Blau
  cooldown_reset:       { Icon: RotateCcw,    color: '#34D399' }, // Grün
  steuerbefreiung:      { Icon: Receipt,      color: '#A78BFA' }, // Violett
  double_xp:            { Icon: Sparkles,     color: '#FBBF24' }, // Gelb
  collect_boost:        { Icon: Rocket,       color: '#F97316' }, // Orange
  gehaltsbonus:         { Icon: Briefcase,    color: '#14B8A6' }, // Teal
  premium_badge:        { Icon: Award,        color: '#EAB308' }, // Gold
  schutzbrief_upgrade:  { Icon: ShieldPlus,   color: '#38BDF8' }, // Sky
  ueberweisungs_bypass: { Icon: Unlock,       color: '#22D3EE' }, // Cyan
  konto_schutz:         { Icon: ShieldCheck,  color: '#A3E635' }, // Lime
  zinsen_boost:         { Icon: TrendingUp,   color: '#10B981' }, // Emerald
  gluecksrad:           { Icon: Dice5,        color: '#EC4899' }, // Pink
  lotto_bundle:         { Icon: Ticket,       color: '#F43F5E' }, // Rose
  gehalt_multiplikator: { Icon: Flame,        color: '#EF4444' }, // Rot
  exklusiver_titel:     { Icon: Crown,        color: '#FACC15' }  // Amber
};

// Icon-Map für Mystery Boxes
const CRATE_ICONS = {
  bronze:  { Icon: Package, color: '#CD7F32' },
  silber:  { Icon: Package, color: '#C0C0C0' },
  gold:    { Icon: Gift,    color: '#FFD700' },
  diamond: { Icon: Gem,     color: '#22D3EE' }
};

// Shop-Aktionen (Single Source of Truth – shared mit Backend)
import {
  findActivePromotion,
  getActiveBannerPromotions,
  findActiveCreditBonus,
} from '@/lib/shop-promotions';
import { PromoBanner } from '@/components/shop/PromoBanner';

import { Label } from '@/components/ui/label';

// ──────────────────────────────────────────────────────────────
// Bot-Pending Overlay — sperrt die Karte mit Spinner während Verarbeitung
// ──────────────────────────────────────────────────────────────
const PENDING_OVERLAY_VARIANTS = {
  purchase:    { Icon: ShoppingBag,  label: 'Kauf wird verarbeitet …',      color: 'amber' },
  gift:        { Icon: Gift,         label: 'Geschenk wird versendet …',    color: 'amber' },
  credits:     { Icon: Coins,        label: 'Credits werden gutgeschrieben …', color: 'emerald' },
  bank_limit:  { Icon: TrendingUp,   label: 'Bank-Limit wird erhöht …',     color: 'cyan' },
  credit_spend:{ Icon: Sparkles,     label: 'Wird aktiviert …',             color: 'purple' },
  mystery_box: { Icon: Package,      label: 'Box wird geöffnet …',          color: 'pink' }
};

const OVERLAY_COLOR_MAP = {
  amber:   { border: 'rgba(245, 158, 11, 0.3)', ring: '#f59e0b', ringBg: 'rgba(245, 158, 11, 0.1)', icon: '#fbbf24', text: '#fcd34d' },
  emerald: { border: 'rgba(16, 185, 129, 0.3)', ring: '#10b981', ringBg: 'rgba(16, 185, 129, 0.1)', icon: '#34d399', text: '#6ee7b7' },
  cyan:    { border: 'rgba(6, 182, 212, 0.3)',  ring: '#06b6d4', ringBg: 'rgba(6, 182, 212, 0.1)',  icon: '#22d3ee', text: '#67e8f9' },
  purple:  { border: 'rgba(147, 51, 234, 0.3)', ring: '#9333ea', ringBg: 'rgba(147, 51, 234, 0.1)', icon: '#a855f7', text: '#c084fc' },
  pink:    { border: 'rgba(236, 72, 153, 0.3)', ring: '#ec4899', ringBg: 'rgba(236, 72, 153, 0.1)', icon: '#f472b6', text: '#f9a8d4' }
};

function ShopPendingOverlay({ queuedAt, isGift, variant }) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!queuedAt) return;
    const start = new Date(queuedAt).getTime();
    const tick = () => setElapsedSec(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [queuedAt]);

  const variantKey = variant || (isGift ? 'gift' : 'purchase');
  const meta = PENDING_OVERLAY_VARIANTS[variantKey] || PENDING_OVERLAY_VARIANTS.purchase;
  const colors = OVERLAY_COLOR_MAP[meta.color] || OVERLAY_COLOR_MAP.amber;
  const IconComp = meta.Icon;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-xl animate-in fade-in duration-200"
      style={{
        background: 'rgba(10, 11, 15, 0.88)',
        backdropFilter: 'blur(3px)',
        border: `1px solid ${colors.border}`
      }}
    >
      {/* Spinning Ring mit Icon in der Mitte */}
      <div className="relative w-14 h-14">
        <div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: colors.ringBg }}
        />
        <div
          className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: colors.ring, borderTopColor: 'transparent' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <IconComp className="w-5 h-5" style={{ color: colors.icon }} />
        </div>
      </div>

      <div className="text-center px-3 max-w-[90%]">
        <p className="text-xs font-semibold text-white">{meta.label}</p>
        <p className="text-[10px] text-white/60 mt-0.5 leading-snug">
          Bitte einen kurzen Moment Geduld.
        </p>
        <p className="text-[10px] mt-1.5 flex items-center justify-center gap-1" style={{ color: colors.text }}>
          <Clock className="w-2.5 h-2.5" />
          {elapsedSec}s in Warteschlange
        </p>
      </div>
    </div>
  );
}

export function ShopView({ user, userData, onRefresh }) {
  const [shopItems, setShopItems] = useState({});
  const [creditOptions, setCreditOptions] = useState([]);
  const [bankLimitUpgrades, setBankLimitUpgrades] = useState([]);
  const [creditSpendItems, setCreditSpendItems] = useState([]);
  const [creditCrates, setCreditCrates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Modal state für Credit-Spend mit Custom Input (Kontonummer / Titel)
  const [spendModal, setSpendModal] = useState(null); // {item, value}
  
  // Warenkorb State
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  
  // PIN Modal State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingPurchase, setPendingPurchase] = useState(null);

  // Verschenken Modal State
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftMode, setGiftMode] = useState(false); // Verschenken-Modus aktiv
  const [giftItemId, setGiftItemId] = useState(null);
  const [giftFirstName, setGiftFirstName] = useState('');
  const [giftLastName, setGiftLastName] = useState('');
  const [giftRecipient, setGiftRecipient] = useState(null); // Empfänger-Daten nach Prüfung
  const [giftError, setGiftError] = useState('');
  const [checkingRecipient, setCheckingRecipient] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // PENDING PURCHASES — Karten sperren bis Bot verarbeitet hat
  // pendingPurchases = { [itemId]: { queuedId, queuedAt, category, isGift } }
  // ═══════════════════════════════════════════════════════════════
  const [pendingPurchases, setPendingPurchases] = useState({});
  const pollTimeoutRef = useRef(null);
  const previousPendingKeys = useRef(new Set());

  const fetchPendingPurchases = useCallback(async () => {
    try {
      const res = await fetch('/api/shop/pending-purchases');
      if (!res.ok) return null;
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { return null; }

      const map = {};
      (data.pending || []).forEach(p => {
        // Bei mehreren Einträgen zum selben Item → neuester gewinnt
        if (!map[p.itemId] || new Date(p.queuedAt) > new Date(map[p.itemId].queuedAt)) {
          // Variant anhand Kategorie bestimmen (für Overlay-Icon/Text)
          const variant =
            p.category === 'credits' ? 'credits'
            : p.category === 'bank_limit' ? 'bank_limit'
            : p.category === 'credit_spend' ? 'credit_spend'
            : p.category === 'mystery_box' ? 'mystery_box'
            : p.isGift ? 'gift'
            : 'purchase';
          map[p.itemId] = {
            queuedId: p.queuedId,
            queuedAt: p.queuedAt,
            category: p.category,
            isGift: p.isGift,
            status: p.status,
            variant
          };
        }
      });
      return map;
    } catch {
      return null;
    }
  }, []);

  const schedulePollPurchases = useCallback((delay = 3000) => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    pollTimeoutRef.current = setTimeout(async () => {
      const fresh = await fetchPendingPurchases();
      if (fresh === null) {
        schedulePollPurchases(5000);
        return;
      }

      const newKeys = new Set(Object.keys(fresh));
      const oldKeys = previousPendingKeys.current;
      const removed = [...oldKeys].filter(k => !newKeys.has(k));

      if (removed.length > 0) {
        // Bot hat verarbeitet → Daten neu laden
        if (typeof onRefresh === 'function') {
          await onRefresh();
        }
        removed.forEach(itemId => {
          const item = shopItems[itemId];
          toast.success('Kauf abgeschlossen', {
            description: `${item?.name || itemId} – der Bot hat die Lieferung abgeschlossen.`
          });
        });
      }

      previousPendingKeys.current = newKeys;
      setPendingPurchases(fresh);

      if (newKeys.size > 0) {
        schedulePollPurchases(3000);
      }
    }, delay);
  }, [fetchPendingPurchases, onRefresh, shopItems]);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fresh = await fetchPendingPurchases();
      if (cancelled || !fresh) return;
      previousPendingKeys.current = new Set(Object.keys(fresh));
      setPendingPurchases(fresh);
      if (Object.keys(fresh).length > 0) schedulePollPurchases(3000);
    })();
    return () => {
      cancelled = true;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [fetchPendingPurchases, schedulePollPurchases]);

  // Helper: markiere Items als pending (optimistic update nach Kauf/Gift)
  const markItemsPending = (itemIds, opts = {}) => {
    const now = new Date().toISOString();
    const variant = opts.variant || (opts.isGift ? 'gift' : 'purchase');
    setPendingPurchases(prev => {
      const next = { ...prev };
      itemIds.forEach(itemId => {
        next[itemId] = {
          queuedId: `optimistic_${itemId}_${Date.now()}`,
          queuedAt: now,
          category: opts.category || shopItems[itemId]?.category || 'unknown',
          isGift: opts.isGift === true,
          variant,
          status: 'pending'
        };
      });
      return next;
    });
    previousPendingKeys.current = new Set([
      ...previousPendingKeys.current,
      ...itemIds
    ]);
    schedulePollPurchases(2500);
  };

  // Deaktiviere Body Scroll wenn Modal offen ist
  useEffect(() => {
    if (showCart || showPinModal || showGiftModal) {
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
    'führerschein_bus': Bus,
    'waffenschein': Shield,
    'jagdschein': Crosshair,
    'versicherung_rechtsschutz': Scale,
    'versicherung_pkw': Car,
    'versicherung_lkw': Truck,
    'versicherung_kranken': Heart,
    'versicherung_hars': Wrench,
    'versicherung_diebstahl': Shield,
    'vip_premium': Sparkles,
    'vip_platinum': Gem,
    'vip_ultimate': Zap,
    'vip_elite_plus': Award,
    'luxus_pass': Crown,
    'credits_free_pass': Gift,
    'credits_basic_pass': CreditCard,
    'credits_standard_pass': Star,
    'credits_elite_plus_pass': Crown,
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
    'credits_passes': { name: 'Credits Pässe', icon: CreditCard },
    'werkzeuge': { name: 'Werkzeuge', icon: Wrench },
    'schutzbriefe': { name: 'Schutzbriefe', icon: FileText }
  };

  const specialCategories = {
    'credits': { name: 'Credits kaufen', icon: CreditCard },
    'bank_limit': { name: 'Bank Limit', icon: TrendingUp },
    'credit_spend': { name: 'Credits-Extras', icon: Sparkles },
    'mystery_box': { name: 'Mystery Boxes', icon: ShoppingBag }
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
        setCreditSpendItems(data.creditSpendItems || []);
        setCreditCrates(data.creditCrates || []);
      }
    } catch (e) {
      console.error('Load shop error:', e);
      toast.error('Fehler beim Laden des Shops');
    } finally {
      setLoading(false);
    }
  };

  // Credit-Extra kaufen (Boost / Custom Kontonummer / Glücksrad etc.)
  const handleSpendCredit = (item, customValue = null) => {
    setSpendModal(null); // Schließe Spend-Modal zuerst
    openPinModal({ type: 'spend', item, customValue });
  };

  // Interne Funktion: Führt den Credit-Spend Kauf aus (nach PIN-Validierung)
  const _executeSpendCredit = async (item, customValue = null) => {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const res = await fetch('/api/shop/spend-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, customValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Kauf fehlgeschlagen');
      } else {
        toast.info(`${item.label} wird aktiviert …`);
        // Karte bis Bot-Verarbeitung sperren
        markItemsPending([item.id], {
          variant: 'credit_spend',
          category: 'credit_spend'
        });
      }
    } catch (e) {
      toast.error('Netzwerkfehler');
    } finally {
      setPurchasing(false);
    }
  };

  // Mystery Box öffnen (öffnet PIN-Modal)
  const handleOpenCrate = (crate) => {
    openPinModal({ type: 'crate', crate });
  };

  // Interne Funktion: Führt das Mystery Box Öffnen aus (nach PIN-Validierung)
  const _executeOpenCrate = async (crate) => {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const res = await fetch('/api/shop/open-crate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crateId: crate.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Box konnte nicht geöffnet werden');
      } else {
        toast.info(`${crate.name} wird geöffnet …`);
        // Karte bis Bot-Verarbeitung sperren
        markItemsPending([`crate_${crate.id}`], {
          variant: 'mystery_box',
          category: 'mystery_box'
        });
      }
    } catch (e) {
      toast.error('Netzwerkfehler');
    } finally {
      setPurchasing(false);
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
        const successfulItemIds = [];
        for (const item of cart) {
          const res = await fetch('/api/shop/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: item.id })
          });

          if (!res.ok) {
            const data = await res.json();
            toast.error(`Fehler bei ${item.name}: ${data.error}`);
          } else {
            successfulItemIds.push(item.id);
          }
        }
        if (successfulItemIds.length > 0) {
          // Sofort als pending markieren → Karten werden gesperrt
          markItemsPending(successfulItemIds, { isGift: false });
          toast.info(`${successfulItemIds.length} Item(s) gekauft — Bot liefert gleich aus.`);
        }
        clearCart();
        setShowCart(false);
      } else if (pendingPurchase.type === 'credits') {
        const option = creditOptions[pendingPurchase.optionIndex];
        const res = await fetch('/api/shop/purchase-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optionIndex: pendingPurchase.optionIndex })
        });

        const data = await res.json();
        if (res.ok) {
          toast.info(data.message || 'Credits werden gutgeschrieben …');
          if (option) {
            markItemsPending([`credits_${option.credits}`], {
              variant: 'credits',
              category: 'credits'
            });
          }
        } else {
          toast.error(data.error);
        }
      } else if (pendingPurchase.type === 'bank_limit') {
        const upgrade = bankLimitUpgrades[pendingPurchase.upgradeIndex];
        const res = await fetch('/api/shop/upgrade-bank-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upgradeIndex: pendingPurchase.upgradeIndex })
        });

        const data = await res.json();
        if (res.ok) {
          toast.info(data.message || 'Bank-Limit wird erhöht …');
          if (upgrade) {
            markItemsPending([`bank_limit_${upgrade.addLimit}`], {
              variant: 'bank_limit',
              category: 'bank_limit'
            });
          }
        } else {
          toast.error(data.error);
        }
      } else if (pendingPurchase.type === 'spend') {
        // Credit-Spend Items (Boosts, Custom Kontonummer, etc.)
        await _executeSpendCredit(pendingPurchase.item, pendingPurchase.customValue);
      } else if (pendingPurchase.type === 'crate') {
        // Mystery Box öffnen
        await _executeOpenCrate(pendingPurchase.crate);
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

  // Verschenken-Funktionen
  const openGiftMode = () => {
    setShowGiftModal(true);
    setGiftFirstName('');
    setGiftLastName('');
    setGiftRecipient(null);
    setGiftError('');
    setGiftMode(false);
  };

  const checkRecipient = async () => {
    if (!giftFirstName.trim() || !giftLastName.trim()) {
      setGiftError('Bitte Vor- und Nachname eingeben');
      return;
    }

    setCheckingRecipient(true);
    setGiftError('');

    try {
      const res = await fetch('/api/shop/check-recipient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: giftFirstName.trim(),
          lastName: giftLastName.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data.recipient) {
        setGiftRecipient(data.recipient);
        setGiftMode(true); // Aktiviere Verschenken-Modus
        setShowGiftModal(false); // Schließe Modal
        toast.success(`Verschenken-Modus aktiviert für: ${data.recipient.displayName}`);
      } else {
        setGiftError(data.error || 'Empfänger nicht gefunden');
        setGiftRecipient(null);
      }
    } catch (e) {
      console.error('[CHECK RECIPIENT] Error:', e);
      setGiftError('Fehler bei der Prüfung');
      setGiftRecipient(null);
    } finally {
      setCheckingRecipient(false);
    }
  };

  const cancelGiftMode = () => {
    setGiftMode(false);
    setGiftRecipient(null);
    setGiftFirstName('');
    setGiftLastName('');
    toast.info('Verschenken-Modus beendet');
  };

  const giftItem = (itemId) => {
    setGiftItemId(itemId);
    openPinModal({ type: 'gift' });
  };

  const executeGift = async () => {
    if (!giftRecipient) {
      setGiftError('Bitte zuerst Empfänger prüfen');
      return;
    }

    // PIN validieren
    const isValid = await validatePin();
    if (!isValid) return;

    setPurchasing(true);
    setShowPinModal(false);
    setShowGiftModal(false);

    try {
      const item = shopItems[giftItemId];
      const itemPrice = calculatePrice(item.price, giftItemId);

      const res = await fetch('/api/shop/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: giftItemId,
          recipientId: giftRecipient.id,
          price: itemPrice
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.info(`${item.name} an ${giftRecipient.displayName} gesendet — Bot liefert gleich aus.`);
        // Sofort als pending markieren → Karte wird gesperrt
        markItemsPending([giftItemId], { isGift: true });
        setGiftItemId(null);
        setGiftFirstName('');
        setGiftLastName('');
        setGiftRecipient(null);
        
        setTimeout(() => {
          if (onRefresh) onRefresh();
        }, 2000);
      } else {
        toast.error(data.error || 'Fehler beim Verschenken');
      }
    } catch (e) {
      console.error('[GIFT] Error:', e);
      toast.error('Fehler beim Verschenken');
    } finally {
      setPurchasing(false);
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
  
  // Hilfsfunktion: Prüfe ob User eine Lizenz hat (unterstützt String und Object Format)
  const hasLicense = (licenseId) => {
    if (!licenseId) return false;
    return userLicensesArray.some(l => {
      if (!l) return false; // Sicherheitscheck für null/undefined
      if (typeof l === 'string') return l === licenseId;
      if (typeof l === 'object') return (l.name === licenseId || l.id === licenseId);
      return false;
    });
  };
  
  // Hilfsfunktion: Hole Ablaufdatum einer Lizenz
  const getLicenseExpiry = (licenseId) => {
    if (!licenseId) return null;
    const license = userLicensesArray.find(l => {
      if (!l) return false;
      if (typeof l === 'string') return l === licenseId;
      if (typeof l === 'object') return (l.name === licenseId || l.id === licenseId);
      return false;
    });
    if (!license || typeof license === 'string') return null;
    return license.expiresAt || null;
  };
  
  // Hilfsfunktion: Hole aktiven Credits-Pass und dessen Vorteile
  const getActiveCreditsPass = () => {
    const now = Date.now();
    for (const l of userLicensesArray) {
      let licenseId = null;
      let expiresAt = null;
      
      if (typeof l === 'string') {
        licenseId = l;
      } else if (typeof l === 'object') {
        licenseId = l.id || l.name;
        expiresAt = l.expiresAt;
      }
      
      // Ist es ein Credits-Pass?
      const isCreditsPass = licenseId && licenseId.startsWith('credits_') && licenseId.includes('_pass');
      if (!isCreditsPass) continue;
      
      // Ist er noch aktiv?
      const isActive = !expiresAt || expiresAt > now;
      if (!isActive) continue;
      
      // Hole die Metadata aus shopItems
      const passItem = shopItems[licenseId];
      if (passItem && passItem.metadata) {
        return {
          id: licenseId,
          name: passItem.name,
          creditsSpendingDiscount: passItem.metadata.creditsSpendingDiscount || 0,
          creditsPurchaseBonus: passItem.metadata.creditsPurchaseBonus || 0
        };
      }
    }
    return null;
  };
  
  const hasVIPPremium = hasLicense('vip_premium');
  const hasVIPPlatinum = hasLicense('vip_platinum');
  const hasVIPUltimate = hasLicense('vip_ultimate');
  const hasVIPElitePlus = hasLicense('vip_elite_plus');
  const hasLuxusPass = hasLicense('luxus_pass');
  
  // VIP Hierarchie
  const vipHierarchy = {
    'vip_premium': 0,
    'vip_platinum': 1,
    'vip_ultimate': 2,
    'vip_elite_plus': 3,
    'luxus_pass': 4
  };
  
  let userHighestVIP = -1;
  if (hasLuxusPass) userHighestVIP = 4;
  else if (hasVIPElitePlus) userHighestVIP = 3;
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
  if (hasLuxusPass) vipDiscount = 0.50; // 50% Luxus-Pass
  else if (hasVIPElitePlus) vipDiscount = 0.35; // 35%
  else if (hasVIPUltimate) vipDiscount = 0.20; // 20%
  else if (hasVIPPlatinum) vipDiscount = 0.10; // 10%
  
  // ═══════════════════════════════════════════════════════════════
  // 🚀 PERFORMANCE: Memoize calculatePrice um unnötige Re-Renders zu vermeiden
  // ═══════════════════════════════════════════════════════════════
  const calculatePrice = useCallback((basePrice, itemId = null) => {
    // Credits bekommen NIE einen Rabatt
    const itemObj = itemId ? shopItems[itemId] : null;
    if (itemObj && itemObj.category === 'credits') return basePrice;

    const isVipItem = itemId && (itemId.startsWith('vip_') || itemId === 'luxus_pass');
    const isCreditsPass = itemId && itemId.startsWith('credits_') && itemId.includes('_pass');

    // 🎉 Aktions-Rabatt (kann AUCH auf VIP-Items greifen, wenn die Aktion es vorsieht)
    const activePromo = findActivePromotion(itemObj, itemId, userHighestVIP);
    const promoDiscount = activePromo ? activePromo.discount : 0;

    // VIP-Rabatt (greift NICHT auf VIP-Items oder Credits-Pässe)
    let vipDiscountPercent = 0;
    if (!isVipItem && !isCreditsPass) {
      if (hasLuxusPass) vipDiscountPercent = 0.50;
      else if (vipDiscount > 0) vipDiscountPercent = vipDiscount;
    }

    // Besserer Rabatt gewinnt (in der Praxis schließen sich Promo (non_vip) und
    // VIP-Rabatt aus, aber Math.max ist die sichere Variante)
    const bestDiscount = Math.max(vipDiscountPercent, promoDiscount);
    if (bestDiscount > 0) {
      return Math.floor(basePrice * (1 - bestDiscount));
    }
    return basePrice;
  }, [shopItems, userHighestVIP, hasLuxusPass, vipDiscount]);

  // 🚀 PERFORMANCE: Credit-Bonus Lookup memoized
  const creditBonusLookup = useCallback((creditsAmount) => {
    return findActiveCreditBonus(creditsAmount, userHighestVIP);
  }, [userHighestVIP]);

  // 🎉 Alle aktuell aktiven Aktionen ermitteln (Slider zeigt alle durch)
  // 🚀 PERFORMANCE: Memoize um unnötige Neuberechnungen zu vermeiden
  const activeBannerPromos = useMemo(() => {
    return getActiveBannerPromotions(userHighestVIP);
  }, [userHighestVIP]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🎉 Aktions-Banner (Slider bei mehreren aktiven Aktionen) */}
      <PromoBanner promos={activeBannerPromos} variant="shop" />

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
              {hasLuxusPass && '🎩 Luxus-Pass'}
              {hasVIPElitePlus && !hasLuxusPass && '🏆 VIP ELITE PLUS'}
              {hasVIPUltimate && !hasVIPElitePlus && !hasLuxusPass && '⚡ VIP Ultimate'}
              {hasVIPPlatinum && !hasVIPUltimate && !hasVIPElitePlus && !hasLuxusPass && '💎 VIP Platinum'}
              <span className="text-green-400 ml-2">-{(vipDiscount * 100).toFixed(0)}% auf alle Käufe</span>
            </p>
          </div>
        )}
      </div>

      {/* Warenkorb & Verschenken Buttons */}
      <div className="flex justify-end gap-3">
        {/* Verschenken-Modus Button */}
        {giftMode ? (
          <div className="flex items-center gap-3">
            <div 
              className="px-4 py-2 rounded-xl border"
              style={{
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(126, 34, 206, 0.05))',
                borderColor: 'rgba(147, 51, 234, 0.3)'
              }}
            >
              <p className="text-sm text-purple-300">
                <Heart className="w-4 h-4 inline mr-2" />
                Verschenken an: <span className="font-bold">{giftRecipient?.displayName}</span>
              </p>
            </div>
            <Button
              onClick={cancelGiftMode}
              variant="outline"
              className="rounded-xl h-12 px-4"
            >
              <X className="w-4 h-4 mr-2" />
              Beenden
            </Button>
          </div>
        ) : (
          <Button
            onClick={openGiftMode}
            className="rounded-xl h-12 px-6"
            style={{
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(126, 34, 206, 0.3))',
              border: '1px solid rgba(147, 51, 234, 0.4)',
              color: '#fff'
            }}
          >
            <Heart className="w-5 h-5 mr-2" />
            Verschenken
          </Button>
        )}
        
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
          {creditOptions.map((option, index) => {
            const pendingId = `credits_${option.credits}`;
            const pending = pendingPurchases[pendingId] || null;
            const isBotLocked = !!pending;
            
            // 🎉 Credit-Bonus-Aktion (für alle User, ab minCredits Schwelle)
            const bonusInfo = creditBonusLookup(option.credits);
            const hasPromoBonus = !!bonusInfo && !isBotLocked;
            
            // 💳 Credits-Pass Bonus (creditsPurchaseBonus)
            const activePass = getActiveCreditsPass();
            const passBonus = activePass && activePass.creditsPurchaseBonus > 0
              ? Math.floor(option.credits * activePass.creditsPurchaseBonus)
              : 0;
            
            // Gesamt-Credits berechnen
            let totalCredits = option.credits;
            let promoBonusCredits = 0;
            
            if (hasPromoBonus) {
              totalCredits = bonusInfo.totalCredits;
              promoBonusCredits = bonusInfo.bonusCredits;
            }
            
            // Pass-Bonus ZUSÄTZLICH zur Promo
            if (passBonus > 0) {
              totalCredits += passBonus;
            }
            
            const hasAnyBonus = promoBonusCredits > 0 || passBonus > 0;
            
            return (
            <div
              key={index}
              className={`p-4 rounded-xl border relative ${isBotLocked ? 'overflow-hidden pointer-events-none' : ''} ${hasPromoBonus ? 'promo-card' : ''}`}
              style={{
                background: hasPromoBonus
                  ? undefined
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
                borderColor: hasPromoBonus
                  ? undefined
                  : (isBotLocked ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
              }}
            >
              <div className="flex items-start justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2 min-w-0">
                  <Coins className="w-5 h-5 text-emerald-400 shrink-0" />
                  <h3 className="font-semibold text-white truncate">{option.label}</h3>
                </div>
                {hasPromoBonus && (
                  <span
                    className="promo-badge-animated text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md shrink-0 shadow-lg flex items-center gap-1"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(236, 72, 153, 0.85))',
                      color: '#fff',
                      border: '1px solid rgba(253, 224, 71, 0.7)',
                    }}
                    title={bonusInfo.promo.title}
                  >
                    <Sparkles className="w-3 h-3 promo-sparkle" strokeWidth={2.5} />
                    {bonusInfo.promo.badgeLabel || `+${Math.round(bonusInfo.promo.bonusPercent * 100)}%`}
                  </span>
                )}
              </div>
              
              {hasAnyBonus ? (
                <div className="relative z-10 mb-4">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-bold text-white">
                      {totalCredits} Credits
                    </span>
                    <span className="text-sm text-white/50 line-through">
                      {option.credits}
                    </span>
                  </div>
                  <div className="text-xs space-y-0.5 mt-1">
                    {promoBonusCredits > 0 && (
                      <div className="text-amber-300 font-semibold">
                        + {promoBonusCredits} Bonus
                      </div>
                    )}
                    {passBonus > 0 && (
                      <div className="text-purple-300 font-semibold">
                        + {passBonus} {activePass.name.replace('Credits ', '').replace(' Pass', '')}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-2xl font-bold text-white mb-4 relative z-10">{option.credits} Credits</p>
              )}
              
              <div className="flex items-center justify-between relative z-10">
                <span className="text-white/60 text-sm">{option.cost.toLocaleString('de-DE')}€</span>
                <Button
                  onClick={() => openPinModal({ type: 'credits', optionIndex: index })}
                  disabled={purchasing || userBalance < option.cost || isBotLocked}
                  size="sm"
                  className="rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff'
                  }}
                >
                  {isBotLocked ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Verarbeitung</>
                  ) : (
                    <><ShoppingBag className="w-4 h-4 mr-1" /> Kaufen</>
                  )}
                </Button>
              </div>
              {isBotLocked && (
                <ShopPendingOverlay
                  queuedAt={pending.queuedAt}
                  variant="credits"
                />
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Bank Limit Upgrades */}
      {selectedCategory === 'bank_limit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankLimitUpgrades.map((upgrade, index) => {
            const pendingId = `bank_limit_${upgrade.addLimit}`;
            const pending = pendingPurchases[pendingId] || null;
            const isBotLocked = !!pending;
            
            // 💳 Credits-Pass Rabatt (creditsSpendingDiscount)
            const activePass = getActiveCreditsPass();
            const discount = activePass && activePass.creditsSpendingDiscount > 0
              ? activePass.creditsSpendingDiscount
              : 0;
            
            const originalCost = upgrade.creditCost;
            const discountAmount = discount > 0 ? Math.floor(originalCost * discount) : 0;
            const finalCost = originalCost - discountAmount;
            
            return (
            <div
              key={index}
              className={`p-4 rounded-xl border relative ${isBotLocked ? 'overflow-hidden pointer-events-none' : ''}`}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
                borderColor: isBotLocked ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold text-white">{upgrade.label}</h3>
                </div>
              </div>
              <p className="text-sm text-white/60 mb-3">{upgrade.description}</p>
              
              {/* Credits-Pass Rabatt-Anzeige */}
              {discount > 0 && (
                <div className="mb-3 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300">
                      {activePass.name.replace('Credits ', '')} Rabatt
                    </span>
                  </div>
                  <div className="text-[11px] space-y-0.5 text-white/70">
                    <div>Kosten: {originalCost} Credits</div>
                    <div className="text-purple-300">- {Math.round(discount * 100)}% Rabatt: -{discountAmount} Credits</div>
                    <div className="text-green-400 font-bold">= {finalCost} Credits</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  {discount > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 line-through text-sm">{originalCost} Credits</span>
                      <span className="text-purple-400 font-bold">{finalCost} Credits</span>
                    </div>
                  ) : (
                    <span className="text-white/60 text-sm">{originalCost} Credits</span>
                  )}
                </div>
                <Button
                  onClick={() => openPinModal({ type: 'bank_limit', upgradeIndex: index })}
                  disabled={purchasing || userCredits < finalCost || isBotLocked}
                  size="sm"
                  className="rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff'
                  }}
                >
                  {isBotLocked ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Verarbeitung</>
                  ) : (
                    <><ShoppingBag className="w-4 h-4 mr-1" /> Kaufen</>
                  )}
                </Button>
              </div>
              {isBotLocked && (
                <ShopPendingOverlay
                  queuedAt={pending.queuedAt}
                  variant="bank_limit"
                />
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Credits-Extras (Spend Credits) */}
      {selectedCategory === 'credit_spend' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creditSpendItems.map((item) => {
            const needsInput = item.id === 'custom_kontonummer' || item.id === 'exklusiver_titel' || item.id === 'bank_pin_change';
            const buffs = userData?.activeBuffs || {};
            const now = Date.now();

            // Aktivitäts-Status
            const activeFlagMap = {
              double_xp: 'doubleXpUntil', collect_boost: 'collectBoostUntil',
              gehaltsbonus: 'gehaltsbonusUntil', steuerbefreiung: 'steuerfreiUntil',
              premium_badge: 'premiumBadgeUntil', ueberweisungs_bypass: 'gebuehrenBypassUntil',
              konto_schutz: 'kontoSchutzUntil', zinsen_boost: 'zinsenBoostUntil',
              exklusiver_titel: 'customTitleUntil'
            };
            const flagKey = activeFlagMap[item.id];
            const activeUntil = flagKey ? (buffs?.[flagKey] || 0) : 0;
            const isActive = activeUntil > now;

            // Cooldown-Items
            let cooldownLeft = 0;
            if (item.id === 'custom_kontonummer') {
              const last = buffs?.lastKontonummerChange || 0;
              const cd = 48 * 3600 * 1000;
              if (last && now - last < cd) cooldownLeft = cd - (now - last);
            } else if (item.id === 'cooldown_reset') {
              const last = buffs?.lastCooldownReset || 0;
              const cd = 24 * 3600 * 1000;
              if (last && now - last < cd) cooldownLeft = cd - (now - last);
            }
            const pending = item.id === 'gehalt_multiplikator' && !!buffs?.gehaltMultiplikatorNext;

            // Bot-Pending (Kauf läuft noch)
            const botPending = pendingPurchases[item.id] || null;
            const isBotLocked = !!botPending;

            // Dynamischer Preis: base * 1.10^purchases
            const purchases = buffs?.creditPurchases?.[item.id] || 0;
            let dynamicPrice = Math.ceil(item.creditCost * Math.pow(1.10, purchases));
            
            // 💳 Credits-Pass Rabatt (creditsSpendingDiscount)
            const activePass = getActiveCreditsPass();
            const discount = activePass && activePass.creditsSpendingDiscount > 0
              ? activePass.creditsSpendingDiscount
              : 0;
            
            const discountAmount = discount > 0 ? Math.floor(dynamicPrice * discount) : 0;
            const finalPrice = dynamicPrice - discountAmount;

            const blocked = isActive || cooldownLeft > 0 || pending || isBotLocked;
            const canAfford = userCredits >= dynamicPrice;
            const canBuy = !blocked && canAfford;

            const fmtHours = (ms) => {
              const h = Math.ceil(ms / (3600 * 1000));
              if (h >= 24) return `${Math.ceil(h/24)}d`;
              return `${h}h`;
            };

            const iconMeta = SPEND_ITEM_ICONS[item.id] || { Icon: Sparkles, color: '#ffffff' };
            const { Icon: ItemIcon, color: iconColor } = iconMeta;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex flex-col relative ${isBotLocked ? 'overflow-hidden pointer-events-none' : ''}`}
                style={{
                  background: blocked
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(255,255,255,0.01))'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))',
                  borderColor: isBotLocked
                    ? 'rgba(147, 51, 234, 0.4)'
                    : blocked
                      ? 'rgba(245, 158, 11, 0.25)'
                      : 'rgba(255, 255, 255, 0.08)'
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border"
                      style={{
                        background: `${iconColor}18`,
                        borderColor: `${iconColor}33`
                      }}
                    >
                      <ItemIcon className="w-4 h-4" style={{ color: iconColor }} />
                    </div>
                    <h3 className="font-semibold text-white truncate">{item.label}</h3>
                  </div>
                  {item.group && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 uppercase tracking-wider flex-shrink-0">
                      {item.group}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/60 mb-2 flex-1">{item.description}</p>

                {/* Credits-Pass Rabatt-Anzeige */}
                {discount > 0 && !blocked && (
                  <div className="mb-2 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span className="text-xs font-semibold text-purple-300">
                        {activePass.name.replace('Credits ', '')}
                      </span>
                    </div>
                    <div className="text-[10px] space-y-0.5 text-white/70">
                      <div>Kosten: {dynamicPrice} Credits</div>
                      <div className="text-purple-300">- {Math.round(discount * 100)}% Rabatt: -{discountAmount} Credits</div>
                      <div className="text-green-400 font-bold">= {finalPrice} Credits</div>
                    </div>
                  </div>
                )}

                {/* Status-Hinweis */}
                {isActive && (
                  <div className="mb-2 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-[11px] text-green-300 flex items-center gap-1">
                    ✓ Aktiv – läuft in {fmtHours(activeUntil - now)} ab
                  </div>
                )}
                {cooldownLeft > 0 && (
                  <div className="mb-2 px-2 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-[11px] text-orange-300 flex items-center gap-1">
                    ⏳ Cooldown: noch {fmtHours(cooldownLeft)}
                  </div>
                )}
                {pending && (
                  <div className="mb-2 px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-1">
                    💼 Ungenutzt vorhanden – erst /collect nutzen
                  </div>
                )}
                {!blocked && purchases > 0 && (
                  <div className="mb-2 text-[11px] text-white/40">
                    Bereits {purchases}× gekauft → Preis: +{((Math.pow(1.10, purchases) - 1) * 100).toFixed(0)}%
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    {discount > 0 && !blocked ? (
                      <>
                        <span className="text-white/80 text-sm font-medium flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-yellow-400" />
                          {finalPrice.toLocaleString('de-DE')} Credits
                        </span>
                        <span className="text-[10px] text-white/30 line-through">
                          {dynamicPrice.toLocaleString('de-DE')} Credits
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-white/80 text-sm font-medium flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-yellow-400" />
                          {dynamicPrice.toLocaleString('de-DE')} Credits
                        </span>
                        {dynamicPrice !== item.creditCost && (
                          <span className="text-[10px] text-white/30 line-through">
                            {item.creditCost.toLocaleString('de-DE')}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <Button
                    onClick={() => needsInput
                      ? setSpendModal({ item, value: '' })
                      : handleSpendCredit(item)}
                    disabled={purchasing || !canBuy}
                    size="sm"
                    className="rounded-lg"
                    style={{
                      background: canBuy
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))'
                        : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff'
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    {isBotLocked ? 'Verarbeitung' : isActive ? 'Aktiv' : cooldownLeft > 0 ? 'Cooldown' : pending ? 'Ungenutzt' : !canAfford ? 'Zu wenig' : 'Aktivieren'}
                  </Button>
                </div>
                {isBotLocked && (
                  <ShopPendingOverlay
                    queuedAt={botPending.queuedAt}
                    variant="credit_spend"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mystery Boxes */}
      {selectedCategory === 'mystery_box' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditCrates.map((crate) => {
            // 💳 Credits-Pass Rabatt (creditsSpendingDiscount)
            const activePass = getActiveCreditsPass();
            const discount = activePass && activePass.creditsSpendingDiscount > 0
              ? activePass.creditsSpendingDiscount
              : 0;
            
            const originalCost = crate.creditCost;
            const discountAmount = discount > 0 ? Math.floor(originalCost * discount) : 0;
            const finalCost = originalCost - discountAmount;
            
            const canAfford = userCredits >= finalCost;
            const iconMeta = CRATE_ICONS[crate.id] || { Icon: Package, color: '#ffffff' };
            const { Icon: CrateIcon } = iconMeta;
            const color = crate.color || iconMeta.color;

            const pendingId = `crate_${crate.id}`;
            const botPending = pendingPurchases[pendingId] || null;
            const isBotLocked = !!botPending;

            return (
              <div
                key={crate.id}
                className={`p-5 rounded-xl border relative overflow-hidden flex flex-col ${isBotLocked ? 'pointer-events-none' : ''}`}
                style={{
                  background: `linear-gradient(135deg, ${color}18, rgba(255,255,255,0.02))`,
                  borderColor: isBotLocked ? 'rgba(236, 72, 153, 0.5)' : `${color}55`
                }}
              >
                <div className="text-center mb-3">
                  <div
                    className="w-16 h-16 mx-auto mb-3 rounded-xl flex items-center justify-center border-2"
                    style={{
                      background: `${color}22`,
                      borderColor: `${color}66`,
                      boxShadow: `0 0 30px ${color}33`
                    }}
                  >
                    <CrateIcon className="w-9 h-9" style={{ color }} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-white text-lg">{crate.name}</h3>
                </div>
                <p className="text-xs text-white/60 text-center mb-3">{crate.description}</p>
                
                {/* Credits-Pass Rabatt-Anzeige */}
                {discount > 0 && (
                  <div className="mb-2 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-1 justify-center mb-1">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] font-semibold text-purple-300">
                        {activePass.name.replace('Credits ', '')}
                      </span>
                    </div>
                    <div className="text-[10px] space-y-0.5 text-white/70 text-center">
                      <div>{originalCost} Credits</div>
                      <div className="text-purple-300">-{Math.round(discount * 100)}%: -{discountAmount}</div>
                      <div className="text-green-400 font-bold">= {finalCost} Credits</div>
                    </div>
                  </div>
                )}
                
                <div className="mb-3 p-2 rounded-lg bg-white/[0.04] border border-white/10 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Max-Gewinn</div>
                  <div className="text-sm text-white font-semibold">
                    {crate.maxPayout.toLocaleString('de-DE')}€
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  {discount > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-white/80 text-sm font-medium flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-yellow-400" />
                        {finalCost.toLocaleString('de-DE')}
                      </span>
                      <span className="text-[10px] text-white/30 line-through">
                        {originalCost.toLocaleString('de-DE')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-white/80 text-sm font-medium flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-yellow-400" />
                      {originalCost.toLocaleString('de-DE')}
                    </span>
                  )}
                  <Button
                    onClick={() => handleOpenCrate(crate)}
                    disabled={purchasing || !canAfford || isBotLocked}
                    size="sm"
                    className="rounded-lg"
                    style={{
                      background: canAfford
                        ? `linear-gradient(135deg, ${color}44, ${color}22)`
                        : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${color}77`,
                      color: '#fff'
                    }}
                  >
                    {isBotLocked ? (
                      <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Öffnet…</>
                    ) : (
                      <><Gift className="w-4 h-4 mr-1" /> Öffnen</>
                    )}
                  </Button>
                </div>
                {isBotLocked && (
                  <ShopPendingOverlay
                    queuedAt={botPending.queuedAt}
                    variant="mystery_box"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Shop Items */}
      {selectedCategory !== 'credits' && selectedCategory !== 'bank_limit' && selectedCategory !== 'credit_spend' && selectedCategory !== 'mystery_box' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(([id, item]) => {
            const ItemIcon = itemIcons[id] || ShoppingBag;
            
            const hasItem = hasLicense(id); // Verwende die neue Hilfsfunktion
            
            // Credits-Pass System: Nur ein Pass gleichzeitig erlaubt
            const isCreditsPass = id.startsWith('credits_') && id.includes('_pass');
            const now = new Date();
            
            // Prüfe, ob User bereits einen AKTIVEN Credits-Pass hat (und finde welchen)
            let activeCreditsPassInfo = null;
            if (isCreditsPass) {
              for (const l of userLicensesArray) {
                let licenseId = null;
                let expiresAt = null;
                
                if (typeof l === 'string') {
                  licenseId = l;
                } else if (typeof l === 'object') {
                  licenseId = l.id || l.name;
                  expiresAt = l.expiresAt;
                }
                
                // Skip wenn es das gleiche Item ist
                if (licenseId === id) continue;
                
                // Ist es ein anderer Credits-Pass?
                const isOtherPass = licenseId && licenseId.startsWith('credits_') && licenseId.includes('_pass');
                if (!isOtherPass) continue;
                
                // Ist er noch aktiv?
                const isActive = !expiresAt || new Date(expiresAt) > now;
                if (isActive) {
                  activeCreditsPassInfo = {
                    id: licenseId,
                    expiresAt: expiresAt,
                    name: shopItems[licenseId]?.name || licenseId
                  };
                  break;
                }
              }
            }
            const hasActiveCreditsPass = !!activeCreditsPassInfo;
            
            // Free Pass Check: Kann nur einmal gekauft werden (auch wenn abgelaufen)
            const isFreePass = id === 'credits_free_pass';
            const alreadyHadFreePass = isFreePass && userLicensesArray.some(l => {
              if (typeof l === 'string') return l === 'credits_free_pass';
              if (typeof l === 'object') return (l.name === 'credits_free_pass' || l.id === 'credits_free_pass');
              return false;
            });
            
            const isVIPItem = id.startsWith('vip_') || id === 'luxus_pass';
            const canBuyThisVIP = canPurchaseVIP(id);
            // Im Gift-Mode ist der eigene VIP-Level irrelevant — nur die Empfänger-Hierarchie zählt
            const isLowerVIP = !giftMode && isVIPItem && !canBuyThisVIP && !hasItem;
            
            // Im Verschenken-Modus: Prüfe VIP-Upgrade-Logik
            let recipientCanReceiveVIP = true;
            let recipientHighestVIP = -1;
            
            if (giftMode && giftRecipient && isVIPItem) {
              // Ermittle höchstes VIP des Empfängers
              if (giftRecipient.licenses?.some(l => 
                (typeof l === 'string' && l === 'luxus_pass') || 
                (typeof l === 'object' && (l.name === 'luxus_pass' || l.id === 'luxus_pass'))
              )) {
                recipientHighestVIP = 4;
              } else if (giftRecipient.licenses?.some(l => 
                (typeof l === 'string' && l === 'vip_elite_plus') || 
                (typeof l === 'object' && (l.name === 'vip_elite_plus' || l.id === 'vip_elite_plus'))
              )) {
                recipientHighestVIP = 3;
              } else if (giftRecipient.licenses?.some(l => 
                (typeof l === 'string' && l === 'vip_ultimate') || 
                (typeof l === 'object' && (l.name === 'vip_ultimate' || l.id === 'vip_ultimate'))
              )) {
                recipientHighestVIP = 2;
              } else if (giftRecipient.licenses?.some(l => 
                (typeof l === 'string' && l === 'vip_platinum') || 
                (typeof l === 'object' && (l.name === 'vip_platinum' || l.id === 'vip_platinum'))
              )) {
                recipientHighestVIP = 1;
              } else if (giftRecipient.licenses?.some(l => 
                (typeof l === 'string' && l === 'vip_premium') || 
                (typeof l === 'object' && (l.name === 'vip_premium' || l.id === 'vip_premium'))
              )) {
                recipientHighestVIP = 0;
              }
              
              // Kann nur VIPs verschenken, die höher sind als das aktuelle VIP des Empfängers
              const vipLevel = vipHierarchy[id];
              recipientCanReceiveVIP = vipLevel > recipientHighestVIP;
            }
            
            // Im Verschenken-Modus: Prüfe ob Empfänger NICHT-VIP-Item hat
            const recipientHasItem = giftMode && !isVIPItem && giftRecipient?.licenses?.some(l => {
              if (!l) return false;
              if (typeof l === 'string') return l === id;
              if (typeof l === 'object') return (l.name === id || l.id === id);
              return false;
            });
            
            const isDisabledInGiftMode = giftMode && (recipientHasItem || (isVIPItem && !recipientCanReceiveVIP));
            
            // Im Gift-Mode: eigene Licenses irrelevant, es zählt nur die Empfänger-Logik
            const visuallyLocked = (!giftMode && hasItem) || isLowerVIP || isDisabledInGiftMode;

            // Bot-Pending: Kauf läuft noch → Karte komplett sperren mit Spinner-Overlay
            const itemPending = pendingPurchases[id] || null;
            const isBotLocked = !!itemPending;
            
            const originalPrice = item.price;
            const discountedPrice = calculatePrice(originalPrice, id);
            const hasDiscount = discountedPrice < originalPrice;
            // 🎉 Prüfen ob für dieses Item eine Aktion aktiv ist
            const activePromoForItem = findActivePromotion(item, id, userHighestVIP);
            // 🎉 Ist für diese Karte die Aktions-Optik aktiv? (nicht bei Locked/Besitz/Gift-Mode)
            const showPromoStyling = !!activePromoForItem && !hasItem && !visuallyLocked && !isBotLocked;

            return (
              <div
                key={id}
                className={`p-4 rounded-xl border relative ${isBotLocked ? 'overflow-hidden pointer-events-none' : ''} ${showPromoStyling ? 'promo-card' : ''}`}
                style={{
                  background: showPromoStyling
                    ? undefined  // promo-card CSS übernimmt (via !important)
                    : (visuallyLocked
                        ? 'linear-gradient(135deg, rgba(100, 100, 100, 0.15), rgba(80, 80, 80, 0.1))'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01))'),
                  borderColor: showPromoStyling
                    ? undefined  // promo-card CSS übernimmt
                    : (isBotLocked
                        ? 'rgba(245, 158, 11, 0.4)'
                        : visuallyLocked
                          ? 'rgba(150, 150, 150, 0.2)'
                          : 'rgba(255, 255, 255, 0.08)'),
                  opacity: visuallyLocked ? 0.7 : 1,
                  position: 'relative'
                }}
              >
                {/* Sperr-Overlay */}
                {visuallyLocked && (
                  <div 
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)'
                    }}
                  />
                )}

                {/* ═══ BOT-LOCKED OVERLAY: Kauf in Verarbeitung ═══ */}
                {isBotLocked && (
                  <ShopPendingOverlay
                    queuedAt={itemPending.queuedAt}
                    isGift={itemPending.isGift}
                  />
                )}
                
                {/* Badges */}
                {hasItem && !giftMode && isCreditsPass && (
                  <div className="absolute top-2 right-2 bg-green-500/20 border border-green-500/50 rounded-lg px-2.5 py-1.5 z-10 max-w-[180px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-green-300 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        ✅ Aktiv
                      </span>
                      {(() => {
                        const expiry = getLicenseExpiry(id);
                        if (expiry) {
                          const expiryDate = new Date(expiry);
                          const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                          return (
                            <span className="text-[9px] text-green-400/70 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              Noch {daysLeft} Tag{daysLeft !== 1 ? 'e' : ''} • Läuft bis {expiryDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
                {hasItem && !giftMode && !isCreditsPass && (
                  <div className="absolute top-2 right-2 bg-green-500/20 border border-green-500/50 rounded-lg px-2 py-1 z-10">
                    <span className="text-xs text-green-300 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Aktiv
                    </span>
                  </div>
                )}
                {hasActiveCreditsPass && !hasItem && !giftMode && (
                  <div className="absolute top-2 right-2 bg-orange-500/20 border border-orange-500/50 rounded-lg px-2.5 py-1.5 z-10 max-w-[180px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-orange-300 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Anderer Pass aktiv
                      </span>
                      <span className="text-[10px] text-orange-400/80 leading-tight">
                        {activeCreditsPassInfo.name.replace('Credits ', '')}
                      </span>
                      {activeCreditsPassInfo.expiresAt && (
                        <span className="text-[9px] text-orange-500/60 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          Läuft bis {new Date(activeCreditsPassInfo.expiresAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {alreadyHadFreePass && !hasItem && !hasActiveCreditsPass && !giftMode && (
                  <div className="absolute top-2 right-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-2 py-1 z-10">
                    <span className="text-xs text-yellow-300 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Bereits genutzt
                    </span>
                  </div>
                )}
                {recipientHasItem && giftMode && (
                  <div className="absolute top-2 right-2 bg-orange-500/20 border border-orange-500/50 rounded-lg px-2 py-1 z-10">
                    <span className="text-xs text-orange-300 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Hat Empfänger
                    </span>
                  </div>
                )}
                {isVIPItem && giftMode && !recipientCanReceiveVIP && recipientHighestVIP >= 0 && (
                  <div className="absolute top-2 right-2 bg-red-500/20 border border-red-500/50 rounded-lg px-2 py-1 z-10">
                    <span className="text-xs text-red-300 font-medium flex items-center gap-1">
                      <X className="w-3 h-3" />
                      Kein Upgrade
                    </span>
                  </div>
                )}
                {isVIPItem && giftMode && recipientCanReceiveVIP && recipientHighestVIP >= 0 && (
                  <div className="absolute top-2 right-2 bg-green-500/20 border border-green-500/50 rounded-lg px-2 py-1 z-10">
                    <span className="text-xs text-green-300 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Upgrade
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
                  {/* 🎉 Aktions-Badge (z.B. "-25% Aktion") */}
                  {activePromoForItem && !hasItem && (
                    <span
                      className="promo-badge-animated text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md shrink-0 shadow-lg flex items-center gap-1"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(236, 72, 153, 0.85))',
                        color: '#fff',
                        border: '1px solid rgba(253, 224, 71, 0.7)',
                      }}
                      title={activePromoForItem.title}
                    >
                      <Sparkles className="w-3 h-3 promo-sparkle" strokeWidth={2.5} />
                      {activePromoForItem.badgeLabel || `-${Math.round(activePromoForItem.discount * 100)}%`}
                    </span>
                  )}
                </div>
                
                {/* Credits-Pass Vorteile Badge-Style */}
                {isCreditsPass && item.metadata && (
                  <div className="mb-3 space-y-2 relative z-10">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Rabatt */}
                      {item.metadata.creditsSpendingDiscount > 0 && (
                        <div className="flex items-center gap-1.5 bg-purple-500/15 border border-purple-500/30 rounded-lg px-2 py-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-purple-300/70 leading-none">Rabatt</span>
                            <span className="text-xs font-bold text-purple-300">{Math.round(item.metadata.creditsSpendingDiscount * 100)}%</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Monatliche Credits */}
                      {item.metadata.monthlyCredits > 0 && (
                        <div className="flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/30 rounded-lg px-2 py-1.5">
                          <Coins className="w-3.5 h-3.5 text-blue-400" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-blue-300/70 leading-none">Pro Monat</span>
                            <span className="text-xs font-bold text-blue-300">{item.metadata.monthlyCredits}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Bonus Credits beim Kauf */}
                      {item.metadata.bonusCreditsOnPurchase > 0 && (
                        <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 rounded-lg px-2 py-1.5">
                          <Gift className="w-3.5 h-3.5 text-green-400" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-green-300/70 leading-none">Bonus</span>
                            <span className="text-xs font-bold text-green-300">+{item.metadata.bonusCreditsOnPurchase}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Kauf-Bonus */}
                      {item.metadata.creditsPurchaseBonus > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg px-2 py-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-amber-300/70 leading-none">Kauf-Bonus</span>
                            <span className="text-xs font-bold text-amber-300">+{Math.round(item.metadata.creditsPurchaseBonus * 100)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Normale Beschreibung für nicht-Credits-Items */}
                {!isCreditsPass && item.description && (
                  <div className="text-sm text-white/50 mb-3 relative z-10">
                    {item.description.includes('\n') ? (
                      <div className="space-y-1">
                        {item.description.split('\n').map((line, idx) => (
                          <div key={idx} className={line.startsWith('Vorteile:') ? 'font-semibold text-white/70 mb-1' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>{item.description}</p>
                    )}
                  </div>
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
                  <div className="flex gap-2">
                    {/* Im Verschenken-Modus: Verschenken-Button, sonst Warenkorb-Button */}
                    {giftMode ? (
                      <Button
                        onClick={() => giftItem(id)}
                        disabled={isDisabledInGiftMode || isLowerVIP || isBotLocked}
                        size="sm"
                        className="rounded-lg"
                        style={{
                          background: (isDisabledInGiftMode || isLowerVIP || isBotLocked)
                            ? 'linear-gradient(135deg, rgba(100, 100, 100, 0.3), rgba(80, 80, 80, 0.2))'
                            : 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(126, 34, 206, 0.3))',
                          border: '1px solid rgba(147, 51, 234, 0.4)',
                          color: (isDisabledInGiftMode || isLowerVIP || isBotLocked) ? 'rgba(255, 255, 255, 0.4)' : '#fff',
                          cursor: (isDisabledInGiftMode || isLowerVIP || isBotLocked) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        Verschenken
                      </Button>
                    ) : (
                      <Button
                        onClick={() => addToCart(id)}
                        disabled={hasItem || isLowerVIP || isBotLocked || alreadyHadFreePass || hasActiveCreditsPass}
                        size="sm"
                        className="rounded-lg"
                        style={{
                          background: (hasItem || isLowerVIP || isBotLocked || alreadyHadFreePass || hasActiveCreditsPass)
                            ? 'linear-gradient(135deg, rgba(100, 100, 100, 0.3), rgba(80, 80, 80, 0.2))'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: (hasItem || isLowerVIP || isBotLocked || alreadyHadFreePass || hasActiveCreditsPass) ? 'rgba(255, 255, 255, 0.4)' : '#fff',
                          cursor: (hasItem || isLowerVIP || isBotLocked || alreadyHadFreePass || hasActiveCreditsPass) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isBotLocked ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Verarbeitung
                          </>
                        ) : hasItem ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Gekauft
                          </>
                        ) : hasActiveCreditsPass ? (
                          <>
                            <Lock className="w-4 h-4 mr-1" />
                            Pass aktiv
                          </>
                        ) : alreadyHadFreePass ? (
                          <>
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Bereits genutzt
                          </>
                        ) : isLowerVIP ? (
                          <>
                            <Lock className="w-4 h-4 mr-1" />
                            Gesperrt
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Warenkorb
                          </>
                        )}
                      </Button>
                    )}
                  </div>
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
              {pendingPurchase?.type === 'spend' && pendingPurchase?.item?.id === 'bank_pin_change' 
                ? 'Aktuelle Bank-PIN eingeben'
                : 'Bank-PIN eingeben'}
            </h3>
            
            <p className="text-sm text-white/60 mb-6">
              {pendingPurchase?.type === 'spend' && pendingPurchase?.item?.id === 'bank_pin_change'
                ? 'Bitte gib deine AKTUELLE Bank-PIN ein, um die PIN-Änderung zu bestätigen.'
                : 'Bitte gib deine Bank-PIN ein, um den Kauf zu bestätigen.'}
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
                  onClick={pendingPurchase?.type === 'gift' ? executeGift : executePurchase}
                  disabled={purchasing || !pin}
                  className="flex-1 rounded-xl"
                  style={{
                    background: pendingPurchase?.type === 'gift'
                      ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(126, 34, 206, 0.3))'
                      : 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.3))',
                    border: pendingPurchase?.type === 'gift'
                      ? '1px solid rgba(147, 51, 234, 0.4)'
                      : '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#fff'
                  }}
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {pendingPurchase?.type === 'gift' ? 'Verschenke...' : 'Kaufe...'}
                    </>
                  ) : (
                    <>
                      {pendingPurchase?.type === 'gift' ? (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          Verschenken
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Bestätigen
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Verschenken Modal - Überweisung-Stil mit Portal */}
      {showGiftModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(40, 40, 40, 0.95), rgba(20, 20, 20, 0.98))',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-400" />
              Item verschenken
            </h3>
            
            <p className="text-sm text-white/60 mb-6">
              Gib Vor- und Nachname des Empfängers ein. Nach der Prüfung kannst du Items an diese Person verschenken.
            </p>

            <div className="space-y-4">
              {/* Vor- und Nachname Eingabe */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70 mb-2 block">Vorname</Label>
                  <Input
                    type="text"
                    value={giftFirstName}
                    onChange={(e) => {
                      setGiftFirstName(e.target.value);
                      setGiftError('');
                      setGiftRecipient(null);
                    }}
                    placeholder="Max"
                    className="bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/25 h-12"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-white/70 mb-2 block">Nachname</Label>
                  <Input
                    type="text"
                    value={giftLastName}
                    onChange={(e) => {
                      setGiftLastName(e.target.value);
                      setGiftError('');
                      setGiftRecipient(null);
                    }}
                    placeholder="Mustermann"
                    className="bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/25 h-12"
                  />
                </div>
              </div>

              {/* Prüfen Button */}
              <Button
                onClick={checkRecipient}
                disabled={checkingRecipient || !giftFirstName.trim() || !giftLastName.trim()}
                className="w-full rounded-xl h-11"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.3))',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#fff'
                }}
              >
                {checkingRecipient ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Prüfe...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Empfänger prüfen
                  </>
                )}
              </Button>

              {/* Empfänger gefunden */}
              {giftRecipient && (
                <div 
                  className="p-4 rounded-xl border"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05))',
                    borderColor: 'rgba(34, 197, 94, 0.3)'
                  }}
                >
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">Empfänger gefunden</span>
                  </div>
                  <p className="text-white text-sm">{giftRecipient.displayName}</p>
                  <p className="text-white/50 text-xs mt-1">Besitzt das Item noch nicht ✓</p>
                </div>
              )}

              {/* Fehler */}
              {giftError && (
                <div className="flex items-center gap-2 text-red-400 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{giftError}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowGiftModal(false);
                    setGiftItemId(null);
                    setGiftFirstName('');
                    setGiftLastName('');
                    setGiftRecipient(null);
                    setGiftError('');
                  }}
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={purchasing}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={() => {
                    if (!giftRecipient) {
                      setGiftError('Bitte zuerst Empfänger prüfen');
                      return;
                    }
                    // Aktiviere Verschenken-Modus und schließe Modal
                    setGiftMode(true);
                    setShowGiftModal(false);
                    toast.success(`Verschenken-Modus aktiviert für: ${giftRecipient.displayName}`);
                  }}
                  disabled={purchasing || !giftRecipient}
                  className="flex-1 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(126, 34, 206, 0.3))',
                    border: '1px solid rgba(147, 51, 234, 0.4)',
                    color: '#fff'
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verschenken aktivieren
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Spend-Credit Modal (Custom Kontonummer / Titel) */}
      {spendModal && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
          onClick={() => !purchasing && setSpendModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border p-6"
            style={{
              background: 'linear-gradient(135deg, #1a1a1a, #0f0f0f)',
              borderColor: 'rgba(255,255,255,0.1)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 min-w-0">
                {(() => {
                  const m = SPEND_ITEM_ICONS[spendModal.item.id] || { Icon: Sparkles, color: '#fff' };
                  const { Icon: IIcon } = m;
                  return (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border"
                      style={{ background: `${m.color}20`, borderColor: `${m.color}44` }}
                    >
                      <IIcon className="w-5 h-5" style={{ color: m.color }} />
                    </div>
                  );
                })()}
                <span className="truncate">{spendModal.item.label}</span>
              </h3>
              <button
                onClick={() => !purchasing && setSpendModal(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-white/60 mb-4">{spendModal.item.description}</p>

            {spendModal.item.id === 'custom_kontonummer' ? (
              <div className="mb-4">
                <Label className="text-xs text-white/60 mb-1 block">Neue Kontonummer (9 Ziffern)</Label>
                <Input
                  value={spendModal.value}
                  onChange={(e) => setSpendModal({ ...spendModal, value: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                  placeholder="123456789"
                  maxLength={9}
                  className="bg-white/5 border-white/10 text-white font-mono tracking-wider"
                />
                <p className="text-[11px] text-white/40 mt-1">Nur Ziffern, genau 9 Stellen. 48h Cooldown danach.</p>
              </div>
            ) : spendModal.item.id === 'bank_pin_change' ? (
              <div className="mb-4">
                <Label className="text-xs text-white/60 mb-1 block">Neue Bank-PIN (3 Ziffern)</Label>
                <Input
                  value={spendModal.value}
                  onChange={(e) => setSpendModal({ ...spendModal, value: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  placeholder="123"
                  maxLength={3}
                  type="password"
                  className="bg-white/5 border-white/10 text-white font-mono tracking-wider text-center text-2xl"
                />
                <p className="text-[11px] text-white/40 mt-1">Nur Ziffern, genau 3 Stellen. 48h Cooldown danach.</p>
              </div>
            ) : spendModal.item.id === 'exklusiver_titel' ? (
              <div className="mb-4">
                <Label className="text-xs text-white/60 mb-1 block">Dein Titel (2–20 Zeichen)</Label>
                <Input
                  value={spendModal.value}
                  onChange={(e) => setSpendModal({ ...spendModal, value: e.target.value.slice(0, 20) })}
                  placeholder="z.B. Der Boss"
                  maxLength={20}
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-[11px] text-white/40 mt-1">Wird 30 Tage vor deinem Namen angezeigt.</p>
              </div>
            ) : null}

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.04] border border-white/10 mb-4">
              <span className="text-sm text-white/60">Kosten</span>
              <span className="text-sm font-semibold text-white flex items-center gap-1">
                <Coins className="w-4 h-4 text-yellow-400" />
                {spendModal.item.creditCost.toLocaleString('de-DE')} Credits
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setSpendModal(null)}
                disabled={purchasing}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => handleSpendCredit(spendModal.item, spendModal.value)}
                disabled={purchasing || !spendModal.value || 
                  (spendModal.item.id === 'custom_kontonummer' && spendModal.value.length !== 9) || 
                  (spendModal.item.id === 'bank_pin_change' && spendModal.value.length !== 3) ||
                  (spendModal.item.id === 'exklusiver_titel' && spendModal.value.length < 2)}
                className="flex-1"
                style={{
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(124, 58, 237, 0.15))',
                  border: '1px solid rgba(124, 58, 237, 0.5)',
                  color: '#fff'
                }}
              >
                {purchasing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Aktivieren
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
