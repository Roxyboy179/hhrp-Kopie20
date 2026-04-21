import { Award } from 'lucide-react';

export function LevelProgress({ level = 1, xp = 0, nextLevelXP = 1000 }) {
  const progress = Math.min(((xp / nextLevelXP) * 100), 100);
  
  return (
    <div className="space-y-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-400 icon-hover" />
          <span className="text-sm font-medium">Level {level}</span>
        </div>
        <span className="text-xs text-white/50">
          {xp.toLocaleString('de-DE')}/{nextLevelXP.toLocaleString('de-DE')} XP
        </span>
      </div>
      <div className="relative w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
        <div 
          className="absolute h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}