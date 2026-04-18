'use client';

import { cn } from '@/lib/utils';

export function AdminCard({ children, className, hover = false, ...props }) {
  return (
    <div 
      className={cn(
        'glass rounded-2xl p-6 border border-white/[0.08]',
        'transition-all duration-300',
        hover && 'hover:border-white/[0.15] hover:scale-[1.02]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({ children, className, icon: Icon, title, subtitle }) {
  if (title) {
    return (
      <div className={cn('mb-6', className)}>
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
        )}
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-white/60 text-sm mt-2">{subtitle}</p>}
      </div>
    );
  }
  return <div className={cn('mb-6', className)}>{children}</div>;
}

export function AdminCardContent({ children, className }) {
  return <div className={className}>{children}</div>;
}

export function AdminCardFooter({ children, className }) {
  return (
    <div className={cn('mt-6 pt-6 border-t border-white/[0.08]', className)}>
      {children}
    </div>
  );
}