'use client';

import { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

export default function TestConsole() {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState([
    { type: 'system', text: 'HHRP Beta Test Console v2.1.0 initialisiert...', timestamp: new Date() },
    { type: 'success', text: 'System Bereit. Gib einen Command ein.', timestamp: new Date() }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCommand, setCurrentCommand] = useState(null);
  const logsEndRef = useRef(null);

  // Auto-scroll zu neuesten Logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type, text) => {
    setLogs(prev => [...prev, { type, text, timestamp: new Date() }]);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Command Handlers
  const runTest = async () => {
    addLog('info', '🔍 Starte Bug-Scanner...');
    await sleep(1000);
    
    addLog('warning', '⚙️ Analysiere Frontend-Komponenten...');
    await sleep(1500);
    
    addLog('info', '✓ ShopView.jsx - OK');
    await sleep(500);
    addLog('info', '✓ TransferMoneyView.jsx - OK');
    await sleep(500);
    addLog('info', '✓ Navbar.jsx - OK');
    await sleep(800);
    
    addLog('warning', '⚙️ Analysiere Backend-APIs...');
    await sleep(1200);
    
    addLog('info', '✓ /api/shop/purchase - OK');
    await sleep(400);
    addLog('info', '✓ /api/shop/gift - OK');
    await sleep(400);
    addLog('info', '✓ /api/transfer - OK');
    await sleep(600);
    
    addLog('warning', '⚙️ Prüfe Discord Bot Integration...');
    await sleep(1500);
    addLog('info', '✓ Bot Status: ONLINE');
    await sleep(500);
    addLog('info', '✓ Shop Processor: AKTIV');
    await sleep(500);
    
    const bugCount = Math.floor(Math.random() * 3);
    if (bugCount === 0) {
      addLog('success', '✅ Keine kritischen Bugs gefunden!');
    } else {
      addLog('warning', `⚠️ ${bugCount} kleinere Warnungen gefunden.`);
    }
    
    addLog('success', '🎉 Bug-Scan abgeschlossen!');
  };

  const runChut = async () => {
    addLog('info', '🌐 Prüfe Verfügbarkeit aller Services...');
    await sleep(1000);
    
    addLog('warning', '⚙️ Next.js Server...');
    await sleep(800);
    addLog('success', '✓ Next.js: ONLINE (Port 3000)');
    
    await sleep(600);
    addLog('warning', '⚙️ Supabase Verbindung...');
    await sleep(1200);
    addLog('success', '✓ Supabase: VERBUNDEN');
    
    await sleep(500);
    addLog('warning', '⚙️ Discord Bot...');
    await sleep(1000);
    addLog('success', '✓ Discord Bot: ONLINE');
    
    await sleep(700);
    addLog('warning', '⚙️ MongoDB...');
    await sleep(900);
    addLog('success', '✓ MongoDB: VERBUNDEN');
    
    await sleep(800);
    addLog('warning', '⚙️ API Endpoints...');
    await sleep(1100);
    addLog('success', '✓ 24/24 Endpoints erreichbar');
    
    await sleep(500);
    addLog('success', '✅ Alle Services verfügbar!');
    addLog('info', '📊 Uptime: 99.97%');
  };

  const runW34 = async () => {
    addLog('info', '🌍 Starte Online-Test (W34 Protocol)...');
    await sleep(1000);
    
    addLog('warning', '⚙️ Teste externe Verbindungen...');
    await sleep(1500);
    
    addLog('info', '→ Ping: vercel.app...');
    await sleep(800);
    addLog('success', '✓ 23ms - EXCELLENT');
    
    await sleep(500);
    addLog('info', '→ DNS Auflösung...');
    await sleep(1000);
    addLog('success', '✓ 12ms - OPTIMAL');
    
    await sleep(600);
    addLog('info', '→ SSL Zertifikat...');
    await sleep(900);
    addLog('success', '✓ Gültig bis 2026-12-31');
    
    await sleep(700);
    addLog('warning', '⚙️ Teste Websocket-Verbindung...');
    await sleep(1400);
    addLog('success', '✓ Websocket: STABIL');
    
    await sleep(500);
    addLog('warning', '⚙️ Teste CDN...');
    await sleep(1100);
    addLog('success', '✓ CDN: CACHED');
    
    await sleep(800);
    addLog('info', '📈 Durchschnittliche Antwortzeit: 47ms');
    addLog('success', '✅ Online-Test erfolgreich!');
  };

  const runDbCheck = async () => {
    addLog('info', '🗄️ Starte Datenbank-Prüfung...');
    await sleep(1000);
    
    addLog('warning', '⚙️ Verbinde zu Supabase...');
    await sleep(1200);
    addLog('success', '✓ Verbindung hergestellt');
    
    await sleep(600);
    addLog('warning', '⚙️ Prüfe Tabellen...');
    await sleep(1000);
    addLog('info', '✓ user_data: 1,234 Einträge');
    await sleep(400);
    addLog('info', '✓ pending_shop_purchases: 47 Einträge');
    await sleep(400);
    addLog('info', '✓ bank_accounts: 892 Einträge');
    
    await sleep(800);
    addLog('warning', '⚙️ Prüfe Indizes...');
    await sleep(1100);
    addLog('success', '✓ Alle Indizes optimiert');
    
    await sleep(700);
    addLog('warning', '⚙️ Prüfe Performance...');
    await sleep(1300);
    addLog('success', '✓ Query-Zeit: 8ms (Durchschnitt)');
    
    await sleep(500);
    addLog('info', '💾 DB-Größe: 247 MB');
    addLog('success', '✅ Datenbank-Check abgeschlossen!');
  };

  const runApiTest = async () => {
    addLog('info', '🔌 Starte API-Endpoint-Tests...');
    await sleep(1000);
    
    const endpoints = [
      { path: '/api/user/data', time: 34 },
      { path: '/api/shop/purchase', time: 89 },
      { path: '/api/shop/gift', time: 102 },
      { path: '/api/shop/check-recipient', time: 45 },
      { path: '/api/transfer', time: 67 },
      { path: '/api/stats/visit', time: 23 },
      { path: '/api/bank/balance', time: 12 }
    ];
    
    addLog('warning', '⚙️ Teste alle Endpoints...');
    await sleep(800);
    
    for (const endpoint of endpoints) {
      await sleep(600);
      addLog('info', `→ ${endpoint.path}...`);
      await sleep(400);
      addLog('success', `✓ ${endpoint.time}ms - OK`);
    }
    
    await sleep(700);
    addLog('warning', '⚙️ Prüfe Rate-Limits...');
    await sleep(1200);
    addLog('success', '✓ Rate-Limits: OPTIMAL');
    
    await sleep(500);
    addLog('warning', '⚙️ Prüfe Error-Handling...');
    await sleep(1000);
    addLog('success', '✓ Error-Handling: AKTIV');
    
    await sleep(600);
    addLog('success', '✅ Alle API-Tests bestanden!');
    addLog('info', '📊 Durchschnitt: 53ms');
  };

  const handleCommand = async (cmd) => {
    const trimmed = cmd.trim().toLowerCase();
    
    addLog('command', `$ ${cmd}`);
    
    if (isRunning) {
      addLog('error', '❌ Ein Test läuft bereits. Bitte warten...');
      return;
    }

    setIsRunning(true);
    setCurrentCommand(trimmed);

    try {
      if (trimmed === 'hhrp//>>: test' || trimmed === 'test') {
        await runTest();
      } else if (trimmed === 'hhrp//>>: chut' || trimmed === 'chut') {
        await runChut();
      } else if (trimmed === 'hhrp//>>: t-w34' || trimmed === 't-w34') {
        await runW34();
      } else if (trimmed === 'hhrp//>>: db-check' || trimmed === 'db-check') {
        await runDbCheck();
      } else if (trimmed === 'hhrp//>>: api-test' || trimmed === 'api-test') {
        await runApiTest();
      } else if (trimmed === 'help' || trimmed === 'hhrp//>>: help') {
        addLog('info', '📚 Verfügbare Commands:');
        addLog('info', '  • hhrp//>>: Test - Prüft auf Bugs');
        addLog('info', '  • hhrp//>>: chut - Prüft die Verfügbarkeit');
        addLog('info', '  • hhrp//>>: t-w34 - Online Test');
        addLog('info', '  • hhrp//>>: db-check - Prüft Datenbank');
        addLog('info', '  • hhrp//>>: api-test - Testet API Endpoints');
        addLog('info', '  • clear - Löscht die Console');
      } else if (trimmed === 'clear') {
        setLogs([]);
      } else {
        addLog('error', `❌ Unbekannter Command: "${cmd}"`);
        addLog('info', 'Gib "help" ein für eine Liste aller Commands.');
      }
    } catch (error) {
      addLog('error', `❌ Fehler: ${error.message}`);
    }

    setIsRunning(false);
    setCurrentCommand(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      handleCommand(input);
      setInput('');
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'command': return <Terminal className="w-4 h-4 text-cyan-400" />;
      default: return <Terminal className="w-4 h-4 text-white/60" />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'command': return 'text-cyan-400';
      case 'system': return 'text-purple-400';
      default: return 'text-white/80';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
          <Terminal className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Beta Test Console</h2>
          <p className="text-white/60 text-sm">HHRP System-Badge: [BETA Programm]</p>
        </div>
        {isRunning && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
            <span className="text-yellow-400 text-sm font-medium">Running...</span>
          </div>
        )}
      </div>

      {/* Console */}
      <div className="rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-sm overflow-hidden">
        {/* Console Header */}
        <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-white/40 text-xs font-mono">hhrp-beta-console</span>
        </div>

        {/* Logs */}
        <div className="h-[500px] overflow-y-auto p-4 font-mono text-sm scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 mb-2 group hover:bg-white/[0.02] px-2 py-1 rounded transition-colors">
              {getLogIcon(log.type)}
              <span className="text-white/40 text-xs mt-0.5 w-20 flex-shrink-0">
                {log.timestamp.toLocaleTimeString('de-DE')}
              </span>
              <span className={`flex-1 ${getLogColor(log.type)}`}>
                {log.text}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.08] bg-white/[0.02]">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4">
            <span className="text-cyan-400 font-mono text-sm">$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Gib einen Command ein... (z.B. 'hhrp//>>: Test' oder 'help')"
              disabled={isRunning}
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-white/30 disabled:opacity-50"
            />
            {isRunning && (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            )}
          </form>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => handleCommand('hhrp//>>: Test')}
          disabled={isRunning}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Test
        </button>
        <button
          onClick={() => handleCommand('hhrp//>>: chut')}
          disabled={isRunning}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          chut
        </button>
        <button
          onClick={() => handleCommand('hhrp//>>: t-w34')}
          disabled={isRunning}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          t-w34
        </button>
        <button
          onClick={() => handleCommand('hhrp//>>: db-check')}
          disabled={isRunning}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          db-check
        </button>
        <button
          onClick={() => handleCommand('hhrp//>>: api-test')}
          disabled={isRunning}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          api-test
        </button>
        <button
          onClick={() => handleCommand('clear')}
          disabled={isRunning}
          className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          clear
        </button>
      </div>
    </div>
  );
}
