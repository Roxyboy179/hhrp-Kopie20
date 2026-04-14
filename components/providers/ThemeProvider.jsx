'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext({
  currentTheme: 'default',
  setTheme: () => {},
  themes: [],
});

// 50 Themes
export const THEMES = [
  { id: 'default', name: 'Standard Dunkel', primary: '0, 0%, 100%', accent: '#ffffff', bg: 'linear-gradient(180deg, #0a0a0a 0%, #111111 30%, #0d0d0d 60%, #080808 100%)', glass: 'rgba(255,255,255,0.02)', glassBorder: 'rgba(255,255,255,0.05)', textAccent: 'text-white', category: 'Basis' },
  { id: 'ocean-blue', name: 'Ozean Blau', primary: '210, 100%, 60%', accent: '#3b82f6', bg: 'linear-gradient(180deg, #0a1628 0%, #0f1d35 30%, #0a1628 60%, #060e1a 100%)', glass: 'rgba(59,130,246,0.04)', glassBorder: 'rgba(59,130,246,0.12)', textAccent: 'text-blue-400', category: 'Natur' },
  { id: 'deep-sea', name: 'Tiefsee', primary: '200, 80%, 50%', accent: '#0891b2', bg: 'linear-gradient(180deg, #042f2e 0%, #064e4e 30%, #042f2e 60%, #021a1a 100%)', glass: 'rgba(8,145,178,0.05)', glassBorder: 'rgba(8,145,178,0.12)', textAccent: 'text-cyan-400', category: 'Natur' },
  { id: 'neon-purple', name: 'Neon Lila', primary: '270, 100%, 65%', accent: '#a855f7', bg: 'linear-gradient(180deg, #1a0a2e 0%, #2d1458 30%, #1a0a2e 60%, #0f0619 100%)', glass: 'rgba(168,85,247,0.05)', glassBorder: 'rgba(168,85,247,0.15)', textAccent: 'text-purple-400', category: 'Neon' },
  { id: 'sunset-orange', name: 'Sonnenuntergang', primary: '25, 100%, 55%', accent: '#f97316', bg: 'linear-gradient(180deg, #1a0f05 0%, #2d1a0a 30%, #1a0f05 60%, #0f0903 100%)', glass: 'rgba(249,115,22,0.05)', glassBorder: 'rgba(249,115,22,0.12)', textAccent: 'text-orange-400', category: 'Natur' },
  { id: 'forest-green', name: 'Waldgrün', primary: '142, 70%, 45%', accent: '#22c55e', bg: 'linear-gradient(180deg, #071a0e 0%, #0f2d1a 30%, #071a0e 60%, #040f08 100%)', glass: 'rgba(34,197,94,0.04)', glassBorder: 'rgba(34,197,94,0.12)', textAccent: 'text-green-400', category: 'Natur' },
  { id: 'cherry-blossom', name: 'Kirschblüte', primary: '330, 80%, 65%', accent: '#ec4899', bg: 'linear-gradient(180deg, #1a0a14 0%, #2d1224 30%, #1a0a14 60%, #0f060b 100%)', glass: 'rgba(236,72,153,0.05)', glassBorder: 'rgba(236,72,153,0.12)', textAccent: 'text-pink-400', category: 'Natur' },
  { id: 'golden-hour', name: 'Goldene Stunde', primary: '45, 100%, 55%', accent: '#eab308', bg: 'linear-gradient(180deg, #1a1505 0%, #2d240a 30%, #1a1505 60%, #0f0c03 100%)', glass: 'rgba(234,179,8,0.04)', glassBorder: 'rgba(234,179,8,0.12)', textAccent: 'text-yellow-400', category: 'Natur' },
  { id: 'aurora', name: 'Nordlicht', primary: '160, 90%, 50%', accent: '#10b981', bg: 'linear-gradient(180deg, #051a14 0%, #0a2d22 30%, #051a14 60%, #030f0b 100%)', glass: 'rgba(16,185,129,0.05)', glassBorder: 'rgba(16,185,129,0.12)', textAccent: 'text-emerald-400', category: 'Natur' },
  { id: 'ruby-red', name: 'Rubin Rot', primary: '0, 80%, 55%', accent: '#ef4444', bg: 'linear-gradient(180deg, #1a0505 0%, #2d0a0a 30%, #1a0505 60%, #0f0303 100%)', glass: 'rgba(239,68,68,0.05)', glassBorder: 'rgba(239,68,68,0.12)', textAccent: 'text-red-400', category: 'Edelsteine' },
  { id: 'sapphire', name: 'Saphir', primary: '225, 85%, 55%', accent: '#6366f1', bg: 'linear-gradient(180deg, #0a0a1a 0%, #12122d 30%, #0a0a1a 60%, #06060f 100%)', glass: 'rgba(99,102,241,0.05)', glassBorder: 'rgba(99,102,241,0.12)', textAccent: 'text-indigo-400', category: 'Edelsteine' },
  { id: 'amethyst', name: 'Amethyst', primary: '280, 70%, 55%', accent: '#c084fc', bg: 'linear-gradient(180deg, #14081a 0%, #22102d 30%, #14081a 60%, #0b050f 100%)', glass: 'rgba(192,132,252,0.04)', glassBorder: 'rgba(192,132,252,0.12)', textAccent: 'text-purple-300', category: 'Edelsteine' },
  { id: 'emerald', name: 'Smaragd', primary: '155, 80%, 40%', accent: '#059669', bg: 'linear-gradient(180deg, #041a12 0%, #082d1e 30%, #041a12 60%, #020f0a 100%)', glass: 'rgba(5,150,105,0.05)', glassBorder: 'rgba(5,150,105,0.12)', textAccent: 'text-emerald-500', category: 'Edelsteine' },
  { id: 'topaz', name: 'Topas', primary: '35, 100%, 55%', accent: '#f59e0b', bg: 'linear-gradient(180deg, #1a1205 0%, #2d1f0a 30%, #1a1205 60%, #0f0b03 100%)', glass: 'rgba(245,158,11,0.05)', glassBorder: 'rgba(245,158,11,0.12)', textAccent: 'text-amber-400', category: 'Edelsteine' },
  { id: 'hamburg-night', name: 'Hamburg Nacht', primary: '215, 80%, 55%', accent: '#4a8fe7', bg: 'linear-gradient(180deg, #080e1a 0%, #0f1a2d 30%, #080e1a 60%, #05090f 100%)', glass: 'rgba(74,143,231,0.05)', glassBorder: 'rgba(74,143,231,0.12)', textAccent: 'text-blue-300', category: 'Stadt' },
  { id: 'elbe-blau', name: 'Elbe Blau', primary: '195, 75%, 50%', accent: '#22a7d3', bg: 'linear-gradient(180deg, #051a22 0%, #0a2d3a 30%, #051a22 60%, #030f14 100%)', glass: 'rgba(34,167,211,0.05)', glassBorder: 'rgba(34,167,211,0.12)', textAccent: 'text-sky-400', category: 'Stadt' },
  { id: 'hafen-rot', name: 'Hafen Rot', primary: '5, 75%, 50%', accent: '#dc4535', bg: 'linear-gradient(180deg, #1a0805 0%, #2d0f0a 30%, #1a0805 60%, #0f0503 100%)', glass: 'rgba(220,69,53,0.05)', glassBorder: 'rgba(220,69,53,0.12)', textAccent: 'text-red-500', category: 'Stadt' },
  { id: 'reeperbahn', name: 'Reeperbahn', primary: '340, 90%, 55%', accent: '#e83e8c', bg: 'linear-gradient(180deg, #1a0510 0%, #2d0a1c 30%, #1a0510 60%, #0f030a 100%)', glass: 'rgba(232,62,140,0.06)', glassBorder: 'rgba(232,62,140,0.15)', textAccent: 'text-pink-500', category: 'Stadt' },
  { id: 'speicherstadt', name: 'Speicherstadt', primary: '15, 60%, 45%', accent: '#b86432', bg: 'linear-gradient(180deg, #1a0e05 0%, #2d1a0a 30%, #1a0e05 60%, #0f0803 100%)', glass: 'rgba(184,100,50,0.05)', glassBorder: 'rgba(184,100,50,0.12)', textAccent: 'text-orange-600', category: 'Stadt' },
  { id: 'cyberpunk', name: 'Cyberpunk', primary: '310, 100%, 60%', accent: '#e040fb', bg: 'linear-gradient(180deg, #0f051a 0%, #1a0a2d 30%, #0f051a 60%, #08030f 100%)', glass: 'rgba(224,64,251,0.06)', glassBorder: 'rgba(224,64,251,0.15)', textAccent: 'text-fuchsia-400', category: 'Neon' },
  { id: 'neon-green', name: 'Neon Grün', primary: '130, 100%, 50%', accent: '#00ff66', bg: 'linear-gradient(180deg, #001a0a 0%, #002d14 30%, #001a0a 60%, #000f05 100%)', glass: 'rgba(0,255,102,0.04)', glassBorder: 'rgba(0,255,102,0.10)', textAccent: 'text-green-300', category: 'Neon' },
  { id: 'neon-blue', name: 'Neon Blau', primary: '195, 100%, 55%', accent: '#00d4ff', bg: 'linear-gradient(180deg, #001a22 0%, #002d3a 30%, #001a22 60%, #000f14 100%)', glass: 'rgba(0,212,255,0.05)', glassBorder: 'rgba(0,212,255,0.12)', textAccent: 'text-cyan-300', category: 'Neon' },
  { id: 'neon-pink', name: 'Neon Pink', primary: '325, 100%, 60%', accent: '#ff2d8a', bg: 'linear-gradient(180deg, #1a0510 0%, #2d081a 30%, #1a0510 60%, #0f030a 100%)', glass: 'rgba(255,45,138,0.05)', glassBorder: 'rgba(255,45,138,0.12)', textAccent: 'text-pink-400', category: 'Neon' },
  { id: 'neon-yellow', name: 'Neon Gelb', primary: '55, 100%, 55%', accent: '#f0e000', bg: 'linear-gradient(180deg, #1a1800 0%, #2d2800 30%, #1a1800 60%, #0f0e00 100%)', glass: 'rgba(240,224,0,0.04)', glassBorder: 'rgba(240,224,0,0.10)', textAccent: 'text-yellow-300', category: 'Neon' },
  { id: 'midnight', name: 'Mitternacht', primary: '240, 50%, 60%', accent: '#7c7cf5', bg: 'linear-gradient(180deg, #05051a 0%, #0a0a2d 30%, #05051a 60%, #03030f 100%)', glass: 'rgba(124,124,245,0.04)', glassBorder: 'rgba(124,124,245,0.10)', textAccent: 'text-indigo-300', category: 'Dunkel' },
  { id: 'void', name: 'Void', primary: '260, 30%, 55%', accent: '#8b7ab8', bg: 'linear-gradient(180deg, #08060f 0%, #0f0b1a 30%, #08060f 60%, #050409 100%)', glass: 'rgba(139,122,184,0.04)', glassBorder: 'rgba(139,122,184,0.08)', textAccent: 'text-purple-300', category: 'Dunkel' },
  { id: 'charcoal', name: 'Kohle', primary: '0, 0%, 70%', accent: '#b3b3b3', bg: 'linear-gradient(180deg, #111 0%, #1a1a1a 30%, #111 60%, #0a0a0a 100%)', glass: 'rgba(255,255,255,0.03)', glassBorder: 'rgba(255,255,255,0.06)', textAccent: 'text-gray-300', category: 'Dunkel' },
  { id: 'obsidian', name: 'Obsidian', primary: '220, 15%, 55%', accent: '#7a8599', bg: 'linear-gradient(180deg, #0d0e12 0%, #14161c 30%, #0d0e12 60%, #080910 100%)', glass: 'rgba(122,133,153,0.04)', glassBorder: 'rgba(122,133,153,0.08)', textAccent: 'text-slate-400', category: 'Dunkel' },
  { id: 'vampire', name: 'Vampir', primary: '350, 80%, 45%', accent: '#c41e3a', bg: 'linear-gradient(180deg, #1a0508 0%, #2d0a10 30%, #1a0508 60%, #0f0305 100%)', glass: 'rgba(196,30,58,0.05)', glassBorder: 'rgba(196,30,58,0.12)', textAccent: 'text-red-500', category: 'Fantasy' },
  { id: 'dragon-fire', name: 'Drachenfeuer', primary: '15, 100%, 55%', accent: '#ff6b2b', bg: 'linear-gradient(180deg, #1a0a02 0%, #2d1205 30%, #1a0a02 60%, #0f0501 100%)', glass: 'rgba(255,107,43,0.05)', glassBorder: 'rgba(255,107,43,0.12)', textAccent: 'text-orange-500', category: 'Fantasy' },
  { id: 'elven-gold', name: 'Elfengold', primary: '50, 80%, 50%', accent: '#d4a017', bg: 'linear-gradient(180deg, #1a1505 0%, #2d220a 30%, #1a1505 60%, #0f0c03 100%)', glass: 'rgba(212,160,23,0.04)', glassBorder: 'rgba(212,160,23,0.10)', textAccent: 'text-yellow-500', category: 'Fantasy' },
  { id: 'frost', name: 'Frost', primary: '190, 70%, 60%', accent: '#5bc0de', bg: 'linear-gradient(180deg, #05141a 0%, #0a222d 30%, #05141a 60%, #030b0f 100%)', glass: 'rgba(91,192,222,0.05)', glassBorder: 'rgba(91,192,222,0.10)', textAccent: 'text-cyan-300', category: 'Fantasy' },
  { id: 'shadow', name: 'Schatten', primary: '250, 40%, 50%', accent: '#6b5bb5', bg: 'linear-gradient(180deg, #0a081a 0%, #110e2d 30%, #0a081a 60%, #06050f 100%)', glass: 'rgba(107,91,181,0.04)', glassBorder: 'rgba(107,91,181,0.10)', textAccent: 'text-violet-400', category: 'Fantasy' },
  { id: 'retro-arcade', name: 'Retro Arcade', primary: '120, 100%, 50%', accent: '#00ff00', bg: 'linear-gradient(180deg, #001a00 0%, #002d00 30%, #001a00 60%, #000f00 100%)', glass: 'rgba(0,255,0,0.03)', glassBorder: 'rgba(0,255,0,0.08)', textAccent: 'text-green-400', category: 'Retro' },
  { id: 'retro-orange', name: 'Retro Orange', primary: '30, 100%, 50%', accent: '#ff8c00', bg: 'linear-gradient(180deg, #1a0e00 0%, #2d1800 30%, #1a0e00 60%, #0f0900 100%)', glass: 'rgba(255,140,0,0.04)', glassBorder: 'rgba(255,140,0,0.10)', textAccent: 'text-orange-400', category: 'Retro' },
  { id: 'synthwave', name: 'Synthwave', primary: '290, 100%, 60%', accent: '#c740f7', bg: 'linear-gradient(180deg, #12041a 0%, #1e082d 30%, #12041a 60%, #09020f 100%)', glass: 'rgba(199,64,247,0.05)', glassBorder: 'rgba(199,64,247,0.12)', textAccent: 'text-violet-400', category: 'Retro' },
  { id: 'vaporwave', name: 'Vaporwave', primary: '300, 70%, 65%', accent: '#e87de8', bg: 'linear-gradient(180deg, #1a081a 0%, #2d102d 30%, #1a081a 60%, #0f050f 100%)', glass: 'rgba(232,125,232,0.04)', glassBorder: 'rgba(232,125,232,0.10)', textAccent: 'text-fuchsia-300', category: 'Retro' },
  { id: 'rose-gold', name: 'Roségold', primary: '350, 50%, 65%', accent: '#d4878f', bg: 'linear-gradient(180deg, #1a0e10 0%, #2d181c 30%, #1a0e10 60%, #0f080a 100%)', glass: 'rgba(212,135,143,0.04)', glassBorder: 'rgba(212,135,143,0.10)', textAccent: 'text-rose-300', category: 'Elegant' },
  { id: 'champagne', name: 'Champagner', primary: '40, 50%, 65%', accent: '#d4b878', bg: 'linear-gradient(180deg, #1a150a 0%, #2d2212 30%, #1a150a 60%, #0f0c06 100%)', glass: 'rgba(212,184,120,0.04)', glassBorder: 'rgba(212,184,120,0.08)', textAccent: 'text-amber-300', category: 'Elegant' },
  { id: 'silver', name: 'Silber', primary: '210, 15%, 70%', accent: '#a8b4c0', bg: 'linear-gradient(180deg, #0e1012 0%, #16191e 30%, #0e1012 60%, #0a0b0d 100%)', glass: 'rgba(168,180,192,0.04)', glassBorder: 'rgba(168,180,192,0.08)', textAccent: 'text-slate-300', category: 'Elegant' },
  { id: 'lavender', name: 'Lavendel', primary: '260, 50%, 65%', accent: '#a78bfa', bg: 'linear-gradient(180deg, #0f0a1a 0%, #181228 30%, #0f0a1a 60%, #08060f 100%)', glass: 'rgba(167,139,250,0.04)', glassBorder: 'rgba(167,139,250,0.10)', textAccent: 'text-violet-300', category: 'Elegant' },
  { id: 'coral', name: 'Koralle', primary: '10, 80%, 60%', accent: '#f06850', bg: 'linear-gradient(180deg, #1a0a08 0%, #2d120f 30%, #1a0a08 60%, #0f0605 100%)', glass: 'rgba(240,104,80,0.05)', glassBorder: 'rgba(240,104,80,0.10)', textAccent: 'text-red-400', category: 'Natur' },
  { id: 'mint', name: 'Minze', primary: '170, 70%, 50%', accent: '#2dd4bf', bg: 'linear-gradient(180deg, #041a16 0%, #082d26 30%, #041a16 60%, #020f0b 100%)', glass: 'rgba(45,212,191,0.04)', glassBorder: 'rgba(45,212,191,0.10)', textAccent: 'text-teal-300', category: 'Natur' },
  { id: 'peach', name: 'Pfirsich', primary: '20, 80%, 65%', accent: '#f5a062', bg: 'linear-gradient(180deg, #1a1008 0%, #2d1c10 30%, #1a1008 60%, #0f0a05 100%)', glass: 'rgba(245,160,98,0.04)', glassBorder: 'rgba(245,160,98,0.10)', textAccent: 'text-orange-300', category: 'Natur' },
  { id: 'storm', name: 'Sturm', primary: '200, 40%, 50%', accent: '#4d8fa8', bg: 'linear-gradient(180deg, #0a1218 0%, #0f1c26 30%, #0a1218 60%, #060b0f 100%)', glass: 'rgba(77,143,168,0.04)', glassBorder: 'rgba(77,143,168,0.10)', textAccent: 'text-sky-400', category: 'Natur' },
  { id: 'volcano', name: 'Vulkan', primary: '8, 90%, 50%', accent: '#e83a1e', bg: 'linear-gradient(180deg, #1a0604 0%, #2d0c08 30%, #1a0604 60%, #0f0402 100%)', glass: 'rgba(232,58,30,0.05)', glassBorder: 'rgba(232,58,30,0.12)', textAccent: 'text-red-500', category: 'Natur' },
  { id: 'galaxy', name: 'Galaxie', primary: '265, 80%, 60%', accent: '#9b59f0', bg: 'linear-gradient(180deg, #0a051a 0%, #140a2d 30%, #0a051a 60%, #06030f 100%)', glass: 'rgba(155,89,240,0.05)', glassBorder: 'rgba(155,89,240,0.12)', textAccent: 'text-violet-400', category: 'Weltraum' },
  { id: 'nebula', name: 'Nebel', primary: '290, 60%, 55%', accent: '#b44dce', bg: 'linear-gradient(180deg, #12061a 0%, #1e0c2d 30%, #12061a 60%, #0a040f 100%)', glass: 'rgba(180,77,206,0.05)', glassBorder: 'rgba(180,77,206,0.10)', textAccent: 'text-purple-400', category: 'Weltraum' },
  { id: 'mars', name: 'Mars', primary: '12, 70%, 45%', accent: '#b84a2e', bg: 'linear-gradient(180deg, #1a0a06 0%, #2d120c 30%, #1a0a06 60%, #0f0604 100%)', glass: 'rgba(184,74,46,0.05)', glassBorder: 'rgba(184,74,46,0.10)', textAccent: 'text-orange-600', category: 'Weltraum' },
];

const CATEGORIES = [...new Set(THEMES.map(t => t.category))];

export { CATEGORIES };

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('default');

  useEffect(() => {
    const saved = localStorage.getItem('hhrp-theme');
    if (saved) {
      setCurrentTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (themeId) => {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    const root = document.documentElement;
    document.body.style.background = theme.bg;
    document.body.style.backgroundAttachment = 'fixed';
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-glass', theme.glass);
    root.style.setProperty('--theme-glass-border', theme.glassBorder);
    root.style.setProperty('--theme-primary-hsl', theme.primary);
    // RGB version for rgba() usage
    const hex = theme.accent.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    root.style.setProperty('--theme-accent-rgb', `${r}, ${g}, ${b}`);
  };

  const setTheme = (themeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('hhrp-theme', themeId);
    applyTheme(themeId);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
