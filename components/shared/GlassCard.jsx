export function GlassCard({ children, className = '', onClick, hover = false }) {
  return (
    <div
      className={`glass rounded-2xl shadow-2xl ${hover ? 'glass-card-hover glass-hover-lift card-shine cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
