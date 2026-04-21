// Skeleton Loader Components für bessere Loading States

export function Skeleton({ className = '', variant = 'default' }) {
  const variants = {
    default: 'bg-white/5',
    card: 'bg-white/10 rounded-2xl',
    text: 'bg-white/5 rounded h-4',
    circle: 'bg-white/5 rounded-full',
    button: 'bg-white/5 rounded-lg h-10'
  };

  return (
    <div 
      className={`animate-pulse ${variants[variant] || variants.default} ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" className="w-16 h-16" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-1/2" />
          <Skeleton variant="text" className="w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-4/5" />
        <Skeleton variant="text" className="w-3/5" />
      </div>
      <Skeleton variant="button" className="w-full" />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circle" className="w-12 h-12" />
        <Skeleton variant="text" className="w-20 h-6" />
      </div>
      <Skeleton variant="text" className="w-full h-8 mb-2" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-8 space-y-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <Skeleton variant="circle" className="w-32 h-32" />
        <div className="flex-1 space-y-3 w-full">
          <Skeleton variant="text" className="w-1/2 h-8" />
          <Skeleton variant="text" className="w-1/3" />
          <div className="flex gap-2">
            <Skeleton variant="button" className="w-24" />
            <Skeleton variant="button" className="w-24" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
