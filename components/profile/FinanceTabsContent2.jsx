import React, { useState, useMemo } from 'react';
import { 
  Filter, Search, Download, ArrowLeftRight, ArrowUpRight, ArrowDownRight,
  Calendar, Target, Calculator, PiggyBank, Lightbulb, TrendingUp, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, subDays, isAfter, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';

// =============================================
// PHASE 3: ERWEITERTE TRANSAKTIONEN
// =============================================
export function ErweiterteTransaktionenView({ userData, filter, setFilter }) {
  const transactions = userData?.transactions || [];
  
  // Gefilterte und sortierte Transaktionen
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    // Datum-Filter
    if (filter.dateRange !== 'all') {
      const now = new Date();
      const cutoff = filter.dateRange === '7days' ? subDays(now, 7) :
                     filter.dateRange === '30days' ? subDays(now, 30) :
                     filter.dateRange === 'year' ? subDays(now, 365) :
                     null;
      
      if (cutoff) {
        filtered = filtered.filter(t => 
          t.timestamp && isAfter(new Date(t.timestamp), cutoff)
        );
      }
    }
    
    // Typ-Filter
    if (filter.type === 'income') {
      filtered = filtered.filter(t => t.amount > 0);
    } else if (filter.type === 'expense') {
      filtered = filtered.filter(t => t.amount < 0);
    }
    
    // Suche
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        (t.description?.toLowerCase().includes(term)) ||
        (t.type?.toLowerCase().includes(term))
      );
    }
    
    // Sortierung
    filtered.sort((a, b) => {
      if (filter.sortBy === 'date') {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return filter.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return filter.sortOrder === 'desc' 
          ? Math.abs(b.amount) - Math.abs(a.amount)
          : Math.abs(a.amount) - Math.abs(b.amount);
      }
    });
    
    return filtered;
  }, [transactions, filter]);
  
  // Export als CSV
  const exportCSV = () => {
    const headers = ['Datum', 'Typ', 'Beschreibung', 'Betrag'];
    const rows = filteredTransactions.map(t => [
      t.timestamp ? format(new Date(t.timestamp), 'dd.MM.yyyy HH:mm', { locale: de }) : 'N/A',
      t.type || 'Sonstiges',
      t.description || '-',
      `${t.amount.toLocaleString('de-DE')} €`
    ]);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transaktionen_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };
  
  const totalIncome = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  
  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="glass rounded-2xl p-6 border border-white/[0.08]">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Datum-Filter */}
          <div>
            <label className="text-xs text-white/50 mb-2 block">Zeitraum</label>
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter({ ...filter, dateRange: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm"
            >
              <option value="all">Alle</option>
              <option value="7days">Letzte 7 Tage</option>
              <option value="30days">Letzte 30 Tage</option>
              <option value="year">Letztes Jahr</option>
            </select>
          </div>
          
          {/* Typ-Filter */}
          <div>
            <label className="text-xs text-white/50 mb-2 block">Typ</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm"
            >
              <option value="all">Alle</option>
              <option value="income">Einnahmen</option>
              <option value="expense">Ausgaben</option>
            </select>
          </div>
          
          {/* Sortierung */}
          <div>
            <label className="text-xs text-white/50 mb-2 block">Sortierung</label>
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter({ ...filter, sortBy: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm"
            >
              <option value="date">Datum</option>
              <option value="amount">Betrag</option>
            </select>
          </div>
          
          {/* Suche */}
          <div>
            <label className="text-xs text-white/50 mb-2 block">Suche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={filter.searchTerm}
                onChange={(e) => setFilter({ ...filter, searchTerm: e.target.value })}
                placeholder="Beschreibung..."
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-white/30"
              />
            </div>
          </div>
        </div>
        
        {/* Export Button */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.08]">
          <div className="text-sm">
            <span className="text-white/50">{filteredTransactions.length} Transaktionen gefunden</span>
            <span className="mx-2 text-white/20">•</span>
            <span className="text-green-400">+{totalIncome.toLocaleString('de-DE')} €</span>
            <span className="mx-2 text-white/20">•</span>
            <span className="text-red-400">-{totalExpenses.toLocaleString('de-DE')} €</span>
          </div>
          <Button
            onClick={exportCSV}
            variant="outline"
            size="sm"
            className="border-white/10 hover:bg-white/5"
            disabled={filteredTransactions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV Export
          </Button>
        </div>
      </div>
      
      {/* Transaktions-Liste */}
      <div className="space-y-2">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction, index) => (
            <div
              key={index}
              className="glass rounded-xl p-4 border border-white/[0.08] hover:bg-white/[0.03] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    transaction.amount > 0 
                      ? 'bg-green-500/20' 
                      : 'bg-red-500/20'
                  }`}>
                    {transaction.amount > 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {transaction.description || 'Transaktion'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                      <span>{transaction.type || 'Sonstiges'}</span>
                      {transaction.timestamp && (
                        <>
                          <span>•</span>
                          <span>{format(new Date(transaction.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Betrag */}
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('de-DE')} €
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass rounded-2xl p-12 border border-white/[0.08] text-center">
            <Filter className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Keine Transaktionen gefunden</h3>
            <p className="text-white/50">Versuche, deine Filter anzupassen.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// PHASE 4: SPARKONTO-MANAGEMENT
// =============================================
export function SparkontoManagementView({ userData, savingsGoal, setSavingsGoal }) {
  const savings = userData?.money?.savings || 0;
  const savingsHistory = userData?.savingsHistory || [];
  
  const [goalInput, setGoalInput] = useState(savingsGoal || '');
  const [showGoalForm, setShowGoalForm] = useState(false);
  
  // Zinsen berechnen (angenommen 2% pro Jahr als Beispiel)
  const INTEREST_RATE = 0.02;
  const projectedInterest = (savings * INTEREST_RATE).toFixed(2);
  
  // Einzahlungs-Historie (simuliert basierend auf Transaktionen)
  const deposits = (userData?.transactions || [])
    .filter(t => t.type === 'savings_deposit' || (t.description?.includes('Sparkonto') && t.amount > 0))
    .slice(0, 10);
  
  const handleSetGoal = () => {
    const goal = parseFloat(goalInput);
    if (goal > 0) {
      setSavingsGoal(goal);
      setShowGoalForm(false);
    }
  };
  
  const goalProgress = savingsGoal ? ((savings / savingsGoal) * 100).toFixed(1) : 0;
  const remaining = savingsGoal ? savingsGoal - savings : 0;
  
  // Spar-Vorschläge
  const suggestions = [
    { amount: 100, days: remaining > 0 ? Math.ceil(remaining / 100) : 0 },
    { amount: 500, days: remaining > 0 ? Math.ceil(remaining / 500) : 0 },
    { amount: 1000, days: remaining > 0 ? Math.ceil(remaining / 1000) : 0 }
  ];
  
  return (
    <div className="space-y-6">
      {/* Sparkonto Übersicht */}
      <div className="glass rounded-3xl p-8 border border-white/[0.08] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <PiggyBank className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white/60">Sparkonto</h2>
              <p className="text-sm text-white/40">Dein Guthaben wächst</p>
            </div>
          </div>
          
          <div className="text-5xl md:text-6xl font-bold text-white mb-6">
            {savings.toLocaleString('de-DE')} €
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <p className="text-xs text-white/50 mb-1">Geschätzter Jahreszins</p>
              <p className="text-xl font-bold text-green-400">+{projectedInterest} €</p>
              <p className="text-xs text-white/40 mt-1">{(INTEREST_RATE * 100).toFixed(1)}% p.a.</p>
            </div>
            
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <p className="text-xs text-white/50 mb-1">Einzahlungen</p>
              <p className="text-xl font-bold text-white">{deposits.length}</p>
              <p className="text-xs text-white/40 mt-1">Gesamt</p>
            </div>
            
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <p className="text-xs text-white/50 mb-1">Ø Kontostand</p>
              <p className="text-xl font-bold text-white">{savings.toLocaleString('de-DE')} €</p>
              <p className="text-xs text-white/40 mt-1">30 Tage</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Spar-Ziel */}
      <div className="glass rounded-2xl p-6 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">Spar-Ziel</h3>
          </div>
          
          {!showGoalForm && (
            <Button
              onClick={() => setShowGoalForm(true)}
              variant="outline"
              size="sm"
              className="border-white/10 hover:bg-white/5"
            >
              {savingsGoal ? 'Ändern' : 'Ziel setzen'}
            </Button>
          )}
        </div>
        
        {showGoalForm ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-2 block">Ziel-Betrag (€)</label>
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="z.B. 50000"
                className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSetGoal} className="flex-1">
                Speichern
              </Button>
              <Button
                onClick={() => setShowGoalForm(false)}
                variant="outline"
                className="border-white/10 hover:bg-white/5"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        ) : savingsGoal ? (
          <div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-white/60">Fortschritt</span>
              <span className="font-semibold text-white">{goalProgress}%</span>
            </div>
            
            <div className="h-4 bg-white/[0.05] rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(goalProgress, 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Aktuell: {savings.toLocaleString('de-DE')} €</span>
              <span className="text-white/50">Ziel: {savingsGoal.toLocaleString('de-DE')} €</span>
            </div>
            
            {remaining > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-300">
                  <strong>Noch {remaining.toLocaleString('de-DE')} €</strong> bis zu deinem Ziel!
                </p>
              </div>
            )}
            
            {goalProgress >= 100 && (
              <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-300">
                  🎉 <strong>Glückwunsch!</strong> Du hast dein Spar-Ziel erreicht!
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-white/50 text-center py-8">Setze dir ein Spar-Ziel, um deinen Fortschritt zu tracken!</p>
        )}
      </div>
      
      {/* Spar-Vorschläge */}
      {savingsGoal && remaining > 0 && (
        <div className="glass rounded-2xl p-6 border border-white/[0.08]">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Spar-Vorschläge</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.amount} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <p className="text-2xl font-bold text-white mb-2">{suggestion.amount} €</p>
                <p className="text-sm text-white/60">pro Tag sparen</p>
                <div className="mt-3 pt-3 border-t border-white/[0.08]">
                  <p className="text-xs text-white/40">Ziel erreicht in</p>
                  <p className="text-sm font-semibold text-blue-400">{suggestion.days} Tagen</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Einzahlungs-Historie */}
      {deposits.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-white/[0.08]">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Einzahlungs-Historie
          </h3>
          
          <div className="space-y-2">
            {deposits.map((deposit, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{deposit.description || 'Einzahlung'}</p>
                    {deposit.timestamp && (
                      <p className="text-xs text-white/40">
                        {format(new Date(deposit.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm font-bold text-green-400">+{deposit.amount.toLocaleString('de-DE')} €</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Zinsen-Rechner */}
      <div className="glass rounded-2xl p-6 border border-white/[0.08]">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-white">Zinsen-Rechner</h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-sm text-white/60 mb-2">In 1 Jahr</p>
            <p className="text-2xl font-bold text-green-400">+{projectedInterest} €</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-sm text-white/60 mb-2">In 3 Jahren</p>
            <p className="text-2xl font-bold text-green-400">+{(savings * INTEREST_RATE * 3).toFixed(2)} €</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-sm text-white/60 mb-2">In 5 Jahren</p>
            <p className="text-2xl font-bold text-green-400">+{(savings * INTEREST_RATE * 5).toFixed(2)} €</p>
          </div>
        </div>
      </div>
    </div>
  );
}
