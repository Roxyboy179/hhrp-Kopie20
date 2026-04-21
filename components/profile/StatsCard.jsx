export function StatsCard({ icon: Icon, value, label, color = 'blue' }) {
  const colors = {
    green: {
      bg: 'from-green-500/20 to-emerald-500/10',
      border: 'border-green-500/30',
      icon: 'text-green-400'
    },
    blue: {
      bg: 'from-blue-500/20 to-cyan-500/10',
      border: 'border-blue-500/30',
      icon: 'text-blue-400'
    },
    purple: {
      bg: 'from-purple-500/20 to-pink-500/10',
      border: 'border-purple-500/30',
      icon: 'text-purple-400'
    },
    gold: {
      bg: 'from-yellow-500/20 to-orange-500/10',
      border: 'border-yellow-500/30',
      icon: 'text-yellow-400'
    }
  };
  
  const colorClasses = colors[color] || colors.blue;
  
  return (
    <div className={`
      glass-card p-4 rounded-xl bg-gradient-to-br ${colorClasses.bg} border ${colorClasses.border}
      hover:scale-105 transition-smooth animate-fade-in
    `}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-6 h-6 icon-hover ${colorClasses.icon}`} />
      </div>
      <div className="text-2xl font-bold text-white truncate">{value}</div>
      <div className="text-xs text-white/50 mt-1">{label}</div>
    </div>
  );
}