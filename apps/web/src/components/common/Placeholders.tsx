import { cn } from '@/lib/utils';

interface PlaceholderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'h-16 w-16', md: 'h-24 w-24', lg: 'h-32 w-32' };

export function SitePlaceholder({ className, size = 'md' }: PlaceholderProps) {
  return (
    <div className={cn('bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center', sizeMap[size], className)}>
      <svg viewBox="0 0 64 64" className="w-2/3 h-2/3 text-[#f26f31]" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="24" width="20" height="28" rx="2" />
        <rect x="36" y="16" width="20" height="36" rx="2" />
        <rect x="12" y="30" width="5" height="6" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="20" y="30" width="5" height="6" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="12" y="40" width="5" height="6" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="20" y="40" width="5" height="6" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="40" y="22" width="5" height="6" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="48" y="22" width="5" height="6" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="40" y="32" width="5" height="6" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="48" y="32" width="5" height="6" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="40" y="42" width="5" height="6" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="48" y="42" width="5" height="6" rx="1" fill="currentColor" opacity="0.3" />
        <line x1="0" y1="52" x2="64" y2="52" strokeWidth="2" />
      </svg>
    </div>
  );
}

export function CementPlaceholder({ className, size = 'md' }: PlaceholderProps) {
  return (
    <div className={cn('bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center', sizeMap[size], className)}>
      <svg viewBox="0 0 64 64" className="w-2/3 h-2/3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="14" y="12" width="36" height="40" rx="3" />
        <line x1="14" y1="22" x2="50" y2="22" />
        <text x="32" y="38" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">50kg</text>
        <text x="32" y="48" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none" opacity="0.5">CEMENT</text>
      </svg>
    </div>
  );
}

export function SteelPlaceholder({ className, size = 'md' }: PlaceholderProps) {
  return (
    <div className={cn('bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center', sizeMap[size], className)}>
      <svg viewBox="0 0 64 64" className="w-2/3 h-2/3 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="10" y1="20" x2="54" y2="20" strokeWidth="3" />
        <line x1="10" y1="28" x2="54" y2="28" strokeWidth="3" />
        <line x1="10" y1="36" x2="54" y2="36" strokeWidth="3" />
        <line x1="10" y1="44" x2="54" y2="44" strokeWidth="3" />
        <circle cx="10" cy="20" r="3" fill="currentColor" />
        <circle cx="10" cy="28" r="3" fill="currentColor" />
        <circle cx="10" cy="36" r="3" fill="currentColor" />
        <circle cx="10" cy="44" r="3" fill="currentColor" />
      </svg>
    </div>
  );
}

export function TilePlaceholder({ className, size = 'md' }: PlaceholderProps) {
  return (
    <div className={cn('bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center', sizeMap[size], className)}>
      <svg viewBox="0 0 64 64" className="w-2/3 h-2/3 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="8" width="22" height="22" rx="2" fill="currentColor" opacity="0.15" />
        <rect x="34" y="8" width="22" height="22" rx="2" fill="currentColor" opacity="0.25" />
        <rect x="8" y="34" width="22" height="22" rx="2" fill="currentColor" opacity="0.25" />
        <rect x="34" y="34" width="22" height="22" rx="2" fill="currentColor" opacity="0.15" />
        <rect x="8" y="8" width="22" height="22" rx="2" />
        <rect x="34" y="8" width="22" height="22" rx="2" />
        <rect x="8" y="34" width="22" height="22" rx="2" />
        <rect x="34" y="34" width="22" height="22" rx="2" />
      </svg>
    </div>
  );
}

export function BillPlaceholder({ className, size = 'md' }: PlaceholderProps) {
  return (
    <div className={cn('bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl flex items-center justify-center', sizeMap[size], className)}>
      <svg viewBox="0 0 64 64" className="w-2/3 h-2/3 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="12" y="6" width="40" height="52" rx="3" />
        <line x1="20" y1="18" x2="44" y2="18" strokeWidth="1.5" />
        <line x1="20" y1="26" x2="44" y2="26" strokeWidth="1.5" />
        <line x1="20" y1="34" x2="36" y2="34" strokeWidth="1.5" />
        <text x="32" y="48" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">₹</text>
      </svg>
    </div>
  );
}

export function LaborPlaceholder({ className, size = 'md' }: PlaceholderProps) {
  return (
    <div className={cn('bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center', sizeMap[size], className)}>
      <svg viewBox="0 0 64 64" className="w-2/3 h-2/3 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="32" cy="18" r="8" />
        <path d="M18 52c0-8 6-14 14-14s14 6 14 14" />
        <path d="M24 14l-4-8" strokeLinecap="round" />
        <circle cx="19" cy="4" r="3" fill="currentColor" opacity="0.3" />
      </svg>
    </div>
  );
}

export function MaterialPlaceholder({ className, size = 'md' }: PlaceholderProps) {
  return (
    <div className={cn('bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center', sizeMap[size], className)}>
      <svg viewBox="0 0 64 64" className="w-2/3 h-2/3 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="22" width="48" height="32" rx="3" />
        <path d="M8 22l24-12 24 12" />
        <line x1="32" y1="10" x2="32" y2="54" strokeDasharray="3,3" opacity="0.3" />
        <rect x="16" y="32" width="10" height="12" rx="1" fill="currentColor" opacity="0.15" />
        <rect x="38" y="32" width="10" height="12" rx="1" fill="currentColor" opacity="0.15" />
      </svg>
    </div>
  );
}

export function VendorPlaceholder({ className, size = 'md' }: PlaceholderProps) {
  return (
    <div className={cn('bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl flex items-center justify-center', sizeMap[size], className)}>
      <svg viewBox="0 0 64 64" className="w-2/3 h-2/3 text-violet-400" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="20" r="8" />
        <path d="M10 48c0-8 6-14 14-14s14 6 14 14" />
        <circle cx="44" cy="24" r="6" />
        <path d="M34 48c0-6 4-10 10-10s10 4 10 10" />
      </svg>
    </div>
  );
}

export function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}

export function ImagePlaceholder({ type = 'site', className }: { type?: 'site' | 'cement' | 'steel' | 'tile' | 'bill' | 'labor' | 'material' | 'vendor'; className?: string }) {
  const components = {
    site: SitePlaceholder,
    cement: CementPlaceholder,
    steel: SteelPlaceholder,
    tile: TilePlaceholder,
    bill: BillPlaceholder,
    labor: LaborPlaceholder,
    material: MaterialPlaceholder,
    vendor: VendorPlaceholder,
  };
  const Component = components[type] || SitePlaceholder;
  return <Component className={className} size="lg" />;
}
