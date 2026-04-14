export function Skeleton({ className = '', width, height, rounded = 'xl' }) {
  return (
    <div 
      className={`skeleton ${className}`} 
      style={{ 
        width: width || '100%', 
        height: height || '1rem',
        borderRadius: rounded === 'full' ? '9999px' : rounded === 'xl' ? '0.75rem' : rounded === 'lg' ? '0.5rem' : '0.25rem'
      }} 
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass rounded-2xl p-6 space-y-4 ${className}`}>
      <Skeleton height="2.5rem" width="2.5rem" rounded="xl" />
      <Skeleton height="2rem" width="60%" />
      <Skeleton height="1rem" width="100%" />
      <Skeleton height="1rem" width="80%" />
    </div>
  );
}

export function SkeletonList({ count = 3, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 flex items-center gap-4">
          <Skeleton width="3rem" height="3rem" rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton height="1rem" width="40%" />
            <Skeleton height="0.75rem" width="70%" />
          </div>
          <Skeleton width="5rem" height="1.5rem" rounded="full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 3 }) {
  return (
    <div className={`grid md:grid-cols-${count} gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-6 text-center space-y-3">
          <Skeleton width="2.75rem" height="2.75rem" rounded="xl" className="mx-auto" />
          <Skeleton height="3rem" width="4rem" className="mx-auto" />
          <Skeleton height="0.75rem" width="60%" className="mx-auto" />
        </div>
      ))}
    </div>
  );
}
