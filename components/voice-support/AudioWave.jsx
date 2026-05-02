'use client';

// AudioWave – Echte, reaktive Voice-Wave-Bars basierend auf MediaStream
import { useAudioLevel } from '@/hooks/useAudioLevel';

export function AudioWave({ stream, bands = 7, color = 'emerald', className = '' }) {
  const { levels } = useAudioLevel(stream, { bands });

  const colorMap = {
    emerald: 'from-emerald-400 to-teal-300',
    blue: 'from-blue-400 to-cyan-300',
    purple: 'from-purple-400 to-pink-300',
    red: 'from-red-400 to-orange-300',
    indigo: 'from-indigo-400 to-purple-300',
  };
  const gradient = colorMap[color] || colorMap.emerald;

  return (
    <div className={`flex items-center gap-1 h-6 ${className}`}>
      {levels.map((level, i) => {
        // Min 8% Höhe, sonst skaliert nach Pegel (max 100%)
        const height = Math.max(8, Math.min(100, level * 200));
        return (
          <span
            key={i}
            className={`w-1 rounded-full bg-gradient-to-t ${gradient} transition-[height] duration-75`}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}
