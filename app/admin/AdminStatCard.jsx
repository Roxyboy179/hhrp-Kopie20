'use client';

import { AdminCard } from './AdminCard';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function AdminStatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  trendValue,
  color = 'blue',
  className 
}) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400'
  };

  const colorClass = colors[color] || colors.blue;

  return (
    <AdminCard className={cn('hover:scale-[1.02] transition-all', className)} hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/60 text-sm mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && trendValue && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs',
              trend === 'up' ? 'text-green-400' : 'text-red-400'
            )}>
              {trend === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('w-12 h-12 rounded-xl border flex items-center justify-center', colorClass)}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </AdminCard>
  );
}