import {
  Battery,
  Building2,
  Factory,
  Home,
  Leaf,
  ShieldCheck,
  Sun,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/** Icons selectable for services in the admin content editor. */
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  home: Home,
  building: Building2,
  factory: Factory,
  zap: Zap,
  battery: Battery,
  wrench: Wrench,
  sun: Sun,
  leaf: Leaf,
  shield: ShieldCheck,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = SERVICE_ICONS[name] ?? Sun;
  return <Icon className={className} aria-hidden />;
}
