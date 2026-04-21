import { Car, Truck, Bike, Plane, Ship } from 'lucide-react';

const LICENSE_ICONS = {
  pkw: Car,
  lkw: Truck,
  motorrad: Bike,
  flugzeug: Plane,
  boot: Ship
};

export function LicenseBadge({ licenseId, index = 0 }) {
  const licenseName = typeof licenseId === 'string' 
    ? licenseId.replace('license_', '').toLowerCase()
    : licenseId.id?.replace('license_', '').toLowerCase();
  
  const Icon = LICENSE_ICONS[licenseName] || Car;
  const displayName = licenseName.toUpperCase();
  
  return (
    <div 
      className="glass-card animate-fade-in px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-smooth cursor-default"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <Icon className="w-5 h-5 text-blue-400 icon-hover" />
      <span className="text-sm font-medium">{displayName}</span>
    </div>
  );
}