import React, { useState, useMemo } from 'react';
import { 
  CreditCard, Calendar, Clock, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Filter, Search, Download, Target, Calculator,
  PiggyBank, Lightbulb, BarChart2, DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, subDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

// Chart Colors
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// =============================================
// PHASE 1: KREDITE DETAIL-ÜBERSICHT
// =============================================
export function KrediteDetailView({ userData }) {
  const kredite = userData?.kredite || [];
  
  const aktiveKredite = kredite.filter(k => k.status === 'aktiv');
  const pendingKredite = kredite.filter(k => k.status === 'pending');
  const abgeschlosseneKredite = kredite.filter(k => k.status === 'abgeschlossen');
  
  const totalSchulden = aktiveKredite.reduce((sum, k) => sum + (k.rueckzahlungsBetrag || 0), 0);
  
  const renderKreditCard = (kredit) => {
    const daysLeft = kredit.rueckzahlungsDatum 
      ? differenceInDays(new Date(kredit.rueckzahlungsDatum), new Date())
      : 0;
    
    const isOverdue = daysLeft < 0;
    const isUrgent = daysLeft <= 3 && daysLeft >= 0;
    
    const progress = kredit.betrag > 0 
      ? ((kredit.betrag / kredit.rueckzahlungsBetrag) * 100).toFixed(1)
      : 0;
    
    return (
      <div 
        key={kredit.kreditId}
        className={`glass rounded-2xl p-6 border ${
          isOverdue ? 'border-red-500/30 bg-red-500/5' :
          isUrgent ? 'border-yellow-500/30 bg-yellow-500/5' :
          'border-white/[0.08]'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              kredit.status === 'aktiv' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
              kredit.status === 'pending' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
              'bg-gradient-to-br from-green-500 to-emerald-500'
            }`}>
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Kredit #{kredit.kreditId}</h3>
              <p className="text-sm text-white/50">Kontonr: {kredit.kontonummer}</p>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            kredit.status === 'aktiv' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
            kredit.status === 'pending' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            {kredit.status === 'aktiv' ? 'AKTIV' :
             kredit.status === 'pending' ? 'AUSSTEHEND' :
             'ABGESCHLOSSEN'}
          </div>
        </div>
        
        {/* Beträge */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-xs text-white/50 mb-1">Kreditbetrag</p>
            <p className="text-lg font-bold text-white">{kredit.betrag?.toLocaleString('de-DE')} €</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-xs text-white/50 mb-1">Gebühr</p>
            <p className="text-lg font-bold text-orange-400">+{kredit.gebuehr?.toLocaleString('de-DE')} €</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-xs text-red-400/60 mb-1">Rückzahlung</p>
            <p className="text-lg font-bold text-red-400">{kredit.rueckzahlungsBetrag?.toLocaleString('de-DE')} €</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-xs text-white/50 mb-1">Zinssatz</p>
            <p className="text-lg font-bold text-white">
              {kredit.betrag > 0 ? ((kredit.gebuehr / kredit.betrag) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
        
        {/* Countdown & Status */}
        {kredit.status === 'aktiv' && kredit.rueckzahlungsDatum && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/60">Fälligkeit</span>
              <span className={`font-semibold ${
                isOverdue ? 'text-red-400' :
                isUrgent ? 'text-yellow-400' :
                'text-white'
              }`}>
                {isOverdue 
                  ? `${Math.abs(daysLeft)} Tage überfällig!`
                  : `in ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tagen'}`
                }
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverdue ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  isUrgent ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-green-500 to-emerald-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Daten */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-white/60">
            <Calendar className="w-4 h-4" />
            <span>Beantragt: {kredit.beantragtAm ? format(new Date(kredit.beantragtAm), 'dd.MM.yyyy', { locale: de }) : 'N/A'}</span>
          </div>
          {kredit.rueckzahlungsDatum && (
            <div className="flex items-center gap-2 text-white/60">
              <Clock className="w-4 h-4" />
              <span>Fällig: {format(new Date(kredit.rueckzahlungsDatum), 'dd.MM.yyyy', { locale: de })}</span>
            </div>
          )}
        </div>
        
        {/* Früh-Rückzahlung Hinweis */}
        {kredit.status === 'aktiv' && !kredit.fruehRueckgezahlt && (
          <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-300">Früh-Rückzahlung möglich!</p>
                <p className="text-xs text-blue-400/60 mt-1">Zahle deinen Kredit früher zurück und spare Zinsen.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Zusammenfassung */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6 border border-orange-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60">Aktive Kredite</p>
              <p className="text-2xl font-bold text-white">{aktiveKredite.length}</p>
            </div>
          </div>
          <p className="text-sm text-orange-400 font-semibold">
            Gesamt: {totalSchulden.toLocaleString('de-DE')} €
          </p>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60">Ausstehend</p>
              <p className="text-2xl font-bold text-white">{pendingKredite.length}</p>
            </div>
          </div>
          <p className="text-sm text-blue-400">Warten auf Genehmigung</p>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60">Abgeschlossen</p>
              <p className="text-2xl font-bold text-white">{abgeschlosseneKredite.length}</p>
            </div>
          </div>
          <p className="text-sm text-green-400">Erfolgreich zurückgezahlt</p>
        </div>
      </div>
      
      {/* Kredite Listen */}
      {aktiveKredite.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-400" />
            Aktive Kredite
          </h3>
          <div className="grid gap-4">
            {aktiveKredite.map(renderKreditCard)}
          </div>
        </div>
      )}
      
      {pendingKredite.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Ausstehende Kredite
          </h3>
          <div className="grid gap-4">
            {pendingKredite.map(renderKreditCard)}
          </div>
        </div>
      )}
      
      {abgeschlosseneKredite.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Abgeschlossene Kredite
          </h3>
          <div className="grid gap-4">
            {abgeschlosseneKredite.slice(0, 3).map(renderKreditCard)}
          </div>
        </div>
      )}
      
      {kredite.length === 0 && (
        <div className="glass rounded-2xl p-12 border border-white/[0.08] text-center">
          <CreditCard className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Keine Kredite</h3>
          <p className="text-white/50">Du hast aktuell keine Kredite.</p>
        </div>
      )}
    </div>
  );
}

// =============================================
// PHASE 2: FINANZ-STATISTIKEN
// =============================================
export function FinanzStatistikenView({ userData }) {
  const transactions = userData?.transactions || [];
  
  // Berechne Statistiken
  const stats = useMemo(() => {
    const income = transactions.filter(t => t.amount > 0);
    const expenses = transactions.filter(t => t.amount < 0);
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
    
    const largestIncome = income.length > 0 
      ? Math.max(...income.map(t => t.amount))
      : 0;
    
    const largestExpense = expenses.length > 0
      ? Math.abs(Math.min(...expenses.map(t => t.amount)))
      : 0;
    
    // Kategorien gruppieren
    const categories = {};
    transactions.forEach(t => {
      const category = t.type || 'Sonstiges';
      if (!categories[category]) {
        categories[category] = { income: 0, expense: 0, count: 0 };
      }
      categories[category].count++;
      if (t.amount > 0) {
        categories[category].income += t.amount;
      } else {
        categories[category].expense += Math.abs(t.amount);
      }
    });
    
    // Letzte 30 Tage Trend
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTransactions = transactions.filter(t => {
        if (!t.timestamp) return false;
        const tDate = format(new Date(t.timestamp), 'yyyy-MM-dd');
        return tDate === dateStr;
      });
      
      const income = dayTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const expense = Math.abs(dayTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
      
      last30Days.push({
        date: format(date, 'dd.MM'),
        Einnahmen: income,
        Ausgaben: expense,
        Netto: income - expense
      });
    }
    
    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      largestIncome,
      largestExpense,
      avgDaily: transactions.length > 0 ? (totalIncome - totalExpenses) / 30 : 0,
      transactionCount: transactions.length,
      categories: Object.entries(categories).map(([name, data]) => ({
        name,
        ...data,
        total: data.income + data.expense
      })),
      last30Days
    };
  }, [transactions]);
  
  const categoryData = stats.categories.sort((a, b) => b.total - a.total).slice(0, 5);
  
  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <p className="text-xs text-white/50">Einnahmen</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.totalIncome.toLocaleString('de-DE')} €</p>
        </div>
        
        <div className="glass rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <p className="text-xs text-white/50">Ausgaben</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.totalExpenses.toLocaleString('de-DE')} €</p>
        </div>
        
        <div className="glass rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-white/50">Bilanz</p>
          </div>
          <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.balance.toLocaleString('de-DE')} €
          </p>
        </div>
        
        <div className="glass rounded-2xl p-4 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-white/50">Ø Pro Tag</p>
          </div>
          <p className={`text-2xl font-bold ${stats.avgDaily >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.avgDaily.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
          </p>
        </div>
      </div>
      
      {/* Einnahmen vs Ausgaben Chart */}
      <div className="glass rounded-2xl p-6 border border-white/[0.08]">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          Einnahmen vs. Ausgaben (30 Tage)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={stats.last30Days}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="#fff" opacity={0.5} />
            <YAxis stroke="#fff" opacity={0.5} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Area type="monotone" dataKey="Einnahmen" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
            <Area type="monotone" dataKey="Ausgaben" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Kategorien Pie Chart */}
      {categoryData.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-white/[0.08]">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-purple-400" />
            Top Transaktions-Kategorien
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPie>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
              </RechartsPie>
            </ResponsiveContainer>
            
            <div className="space-y-3">
              {categoryData.map((cat, index) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{cat.name}</p>
                    <p className="text-xs text-white/50">{cat.count} Transaktionen</p>
                  </div>
                  <p className="text-sm font-bold text-white">{cat.total.toLocaleString('de-DE')} €</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Top Transaktionen */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60">Größte Einnahme</p>
              <p className="text-2xl font-bold text-green-400">{stats.largestIncome.toLocaleString('de-DE')} €</p>
            </div>
          </div>
        </div>
        
        <div className="glass rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-white/60">Größte Ausgabe</p>
              <p className="text-2xl font-bold text-red-400">{stats.largestExpense.toLocaleString('de-DE')} €</p>
            </div>
          </div>
        </div>
      </div>
      
      {stats.transactionCount === 0 && (
        <div className="glass rounded-2xl p-12 border border-white/[0.08] text-center">
          <BarChart2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Keine Transaktionen</h3>
          <p className="text-white/50">Es wurden noch keine Transaktionen aufgezeichnet.</p>
        </div>
      )}
    </div>
  );
}

// Weiter in Teil 2...
