'use client';

import {
  ClipboardList,
  Home,
  LayoutGrid,
  Mail,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@common/ui/utils';

export type NokBottomTab =
  | 'dashboard'
  | 'sections'
  | 'messages'
  | 'checklists'
  | 'more';

type NokBottomNavProps = {
  active: NokBottomTab;
  onDashboard: () => void;
  onSections: () => void;
  onMessages: () => void;
  onChecklists: () => void;
  onMore: () => void;
  messagesBadge?: number;
  className?: string;
};

export function NokBottomNav({
  active,
  onDashboard,
  onSections,
  onMessages,
  onChecklists,
  onMore,
  messagesBadge = 0,
  className,
}: NokBottomNavProps) {
  const items = [
    {
      key: 'dashboard' as const,
      label: 'Dashboard',
      icon: Home,
      onClick: onDashboard,
    },
    {
      key: 'sections' as const,
      label: 'All Sections',
      icon: LayoutGrid,
      onClick: onSections,
    },
    {
      key: 'messages' as const,
      label: 'Messages',
      icon: Mail,
      onClick: onMessages,
      badge: messagesBadge,
    },
    {
      key: 'checklists' as const,
      label: 'Checklists',
      icon: ClipboardList,
      onClick: onChecklists,
    },
    {
      key: 'more' as const,
      label: 'More',
      icon: MoreHorizontal,
      onClick: onMore,
    },
  ];

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden',
        className,
      )}
    >
      <div className="grid grid-cols-5 gap-0.5">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-xl px-0.5 py-1.5 transition active:scale-95',
                isActive ? 'text-[#10213f]' : 'text-slate-400',
              )}
            >
              <span
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-xl',
                  isActive ? 'bg-sky-100' : '',
                )}
              >
                <Icon className="h-5 w-5" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 text-[9px] font-semibold leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
