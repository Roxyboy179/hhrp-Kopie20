'use client';

import { useState } from 'react';
import { useTheme, THEMES, CATEGORIES } from '@/components/providers/ThemeProvider';
import { Palette, X, Check } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

export function ThemeMenuItem() {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Alle');
  const { currentTheme, setTheme } = useTheme();

  const filtered = activeCategory === 'Alle'
    ? THEMES
    : THEMES.filter((t) => t.category === activeCategory);

  const allCategories = ['Alle', ...CATEGORIES];

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className="cursor-pointer flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-white"
      >
        <Palette className="w-4 h-4" />
        <span>Thema</span>
      </DropdownMenuItem>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div
            className="relative w-full max-w-2xl max-h-[80vh] rounded-3xl overflow-hidden border border-white/10"
            style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(40px)' }}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Palette className="w-5 h-5" style={{ color: 'var(--theme-accent, #fff)' }} />
                  Thema wählen
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  {THEMES.length} Themen für dein Hamburg Horizon Erlebnis
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pt-4 flex gap-2 overflow-x-auto no-scrollbar">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? 'text-black'
                      : 'bg-white/[0.04] text-white/50 hover:text-white/80 hover:bg-white/[0.08]'
                  }`}
                  style={
                    activeCategory === cat ? { background: 'var(--theme-accent, #fff)' } : {}
                  }
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto max-h-[55vh] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((theme) => {
                const isActive = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    className={`group relative rounded-2xl p-3 text-left transition-all hover:scale-[1.03] active:scale-[0.98] ${
                      isActive
                        ? 'ring-2 ring-offset-2 ring-offset-black'
                        : 'border border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                    style={{
                      background: theme.bg,
                      ...(isActive ? { ringColor: theme.accent } : {}),
                    }}
                  >
                    <div className="flex gap-1.5 mb-2">
                      <div className="w-6 h-6 rounded-lg" style={{ background: theme.accent }} />
                      <div
                        className="w-6 h-6 rounded-lg"
                        style={{
                          background: theme.glass,
                          border: `1px solid ${theme.glassBorder}`,
                        }}
                      />
                      <div
                        className="w-6 h-6 rounded-lg"
                        style={{ background: theme.glassBorder }}
                      />
                    </div>

                    <p className="text-xs font-medium text-white/80 truncate">{theme.name}</p>
                    <p className="text-[10px] text-white/30">{theme.category}</p>

                    {isActive && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: theme.accent }}
                      >
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
