import {
  BookOpen,
  Briefcase,
  Car,
  CreditCard,
  Flag,
  Gem,
  Gift,
  GraduationCap,
  Heart,
  Home,
  IdCard,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Lock,
  Mail,
  Medal,
  MessageCircle,
  Scale,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';

export const SCHEMA_ICONS: Record<string, LucideIcon> = {
  book: BookOpen,
  home: LayoutDashboard,
  id: IdCard,
  key: KeyRound,
  lock: Lock,
  mail: Mail,
  chat: MessageCircle,
  house: Home,
  car: Car,
  gem: Gem,
  bank: Landmark,
  chart: TrendingUp,
  card: CreditCard,
  brief: Briefcase,
  shield: Shield,
  heart: Heart,
  users: Users,
  cap: GraduationCap,
  medal: Medal,
  flag: Flag,
  gift: Gift,
  scale: Scale,
  dove: Sparkles,
};

export function SchemaIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = SCHEMA_ICONS[name] || BookOpen;
  return <Icon className={className} />;
}
