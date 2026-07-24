'use client';

import React, { ReactNode, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Activity,
  Download,
  Home,
  List,
  LogOut,
  MoreHorizontal,
  Save,
  Settings,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'framer-motion';

type MobileDashboardChromeProps = {
  activeSection: string;
  currentSectionLabel: string;
  progress: number;
  autoSaving?: boolean;
  lastSaved?: Date | null;
  onHome: () => void;
  onOpenSections: () => void;
  onActivity: () => void;
  onOpenVaultSettings: () => void;
  onSave: () => void;
  onExport: () => void;
  onLogout: () => void;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const chromeTransition = {
  type: 'spring',
  stiffness: 420,
  damping: 38,
  mass: 0.9,
} as const;

const topHeaderVariants = {
  show: {
    y: 0,
    opacity: 1,
  },
  hide: {
    y: -90,
    opacity: 0.96,
  },
};

const bottomNavVariants = {
  show: {
    y: 0,
    opacity: 1,
  },
  hide: {
    y: 110,
    opacity: 0.96,
  },
};

function MobileNavItem({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className={cx(
        'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-2 py-2 transition-colors duration-200',
        active
          ? 'text-white'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <AnimatePresence>
        {active && (
          <motion.span
            layoutId="mobile-nav-active-pill"
            className="absolute inset-0 rounded-2xl bg-slate-900 shadow-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={chromeTransition}
          />
        )}
      </AnimatePresence>

      <motion.span
        animate={{
          y: active ? -1 : 0,
          scale: active ? 1.06 : 1,
        }}
        transition={chromeTransition}
        className={cx(
          'relative z-10 flex h-5 w-5 items-center justify-center',
          active ? 'text-white' : 'text-slate-700',
        )}
      >
        {icon}
      </motion.span>

      <motion.span
        animate={{
          y: active ? -1 : 0,
          scale: active ? 1.04 : 1,
        }}
        transition={chromeTransition}
        className="relative z-10 text-[10px] font-bold leading-none tracking-tight"
      >
        {label}
      </motion.span>
    </motion.button>
  );
}

export default function MobileDashboardChrome({
  activeSection,
  currentSectionLabel,
  progress,
  autoSaving = false,
  lastSaved,
  onHome,
  onOpenSections,
  onActivity,
  onOpenVaultSettings,
  onSave,
  onExport,
  onLogout,
}: MobileDashboardChromeProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);

  const { scrollY } = useScroll();
  const lastScrollYRef = useRef(0);

  useMotionValueEvent(scrollY, 'change', latest => {
    const previous = lastScrollYRef.current;
    const difference = latest - previous;

    if (moreOpen) {
      setChromeVisible(true);
      lastScrollYRef.current = latest;
      return;
    }

    if (latest < 12) {
      setChromeVisible(true);
      lastScrollYRef.current = latest;
      return;
    }

    if (Math.abs(difference) < 8) return;

    if (difference > 0 && latest > 110) {
      setChromeVisible(false);
    } else {
      setChromeVisible(true);
    }

    lastScrollYRef.current = latest;
  });

  useEffect(() => {
    if (!moreOpen) return;

    setChromeVisible(true);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [moreOpen]);

  const safeProgress = Math.min(100, Math.max(0, progress || 0));

  const headerTitle =
    activeSection === 'dashboard'
      ? 'Dashboard'
      : activeSection === 'vault-settings'
        ? 'Vault'
        : 'Section';

  const headerSubtitle =
    activeSection === 'dashboard'
      ? 'Overview'
      : activeSection === 'vault-settings'
        ? 'Settings'
        : currentSectionLabel || 'Overview';

  const savedText = lastSaved
    ? lastSaved.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not saved yet';

  return (
    <>
      {/* ================= MOBILE TOP HEADER ================= */}
      <motion.header
        data-mobile-dashboard-chrome
        initial={false}
        animate={chromeVisible ? 'show' : 'hide'}
        variants={topHeaderVariants}
        transition={chromeTransition}
        className="fixed inset-x-0 top-0 z-[55] border-b border-slate-200/80 bg-white/95 backdrop-blur-xl md:hidden"
      >
        <div className="flex h-[76px] items-center justify-between px-4">
          <motion.button
            type="button"
            onClick={onHome}
            whileTap={{ scale: 0.94 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl transition hover:bg-slate-100"
            aria-label="Go to dashboard"
          >
            <Image
              src="/images/brand-logo.png"
              alt="Orderly Affairs"
              width={42}
              height={42}
              className="h-10 w-10 object-contain"
              priority
            />
          </motion.button>

          <motion.div
            key={`${headerTitle}-${headerSubtitle}`}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute left-1/2 max-w-[190px] -translate-x-1/2 text-center"
          >
            <h1 className="truncate text-[15px] font-black leading-tight text-slate-900">
              {headerTitle}
            </h1>
            <p className="mt-0.5 truncate text-[12px] font-semibold leading-tight text-slate-400">
              {headerSubtitle}
            </p>
          </motion.div>

          <motion.button
            type="button"
            onClick={() => setMoreOpen(true)}
            whileTap={{ scale: 0.94 }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
            aria-label="Open account menu"
          >
            <UserRound className="h-5 w-5 text-slate-900" />
          </motion.button>
        </div>
      </motion.header>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <motion.nav
        data-mobile-dashboard-chrome
        initial={false}
        animate={chromeVisible ? 'show' : 'hide'}
        variants={bottomNavVariants}
        transition={chromeTransition}
        className="fixed inset-x-0 bottom-0 z-[55] border-t border-slate-200/80 bg-white/95 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-[28px]">
          <MobileNavItem
            label="Home"
            active={activeSection === 'dashboard'}
            icon={<Home className="h-5 w-5" />}
            onClick={onHome}
          />

          <MobileNavItem
            label="Sections"
            active={
              activeSection !== 'dashboard' &&
              activeSection !== 'vault-settings'
            }
            icon={<List className="h-5 w-5" />}
            onClick={onOpenSections}
          />

          <MobileNavItem
            label="Activity"
            icon={<Activity className="h-5 w-5" />}
            onClick={onActivity}
          />

          <MobileNavItem
            label="More"
            active={moreOpen || activeSection === 'vault-settings'}
            icon={<MoreHorizontal className="h-5 w-5" />}
            onClick={() => setMoreOpen(true)}
          />
        </div>
      </motion.nav>

      {/* ================= MORE SHEET ================= */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className="fixed inset-0 z-[80] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
              onClick={() => setMoreOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              initial={{ opacity: 0, y: 34, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 34, scale: 0.96 }}
              transition={chromeTransition}
              className="absolute inset-x-3 bottom-[calc(88px+env(safe-area-inset-bottom))] mx-auto max-w-md overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Quick Menu
                  </p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">
                    Orderly Affairs
                  </h2>
                </div>

                <motion.button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  whileTap={{ scale: 0.94 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              <div className="p-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-bold text-slate-500">
                        Kit progress
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {safeProgress}%
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <ShieldCheck className="h-6 w-6 text-slate-900" />
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                      className="h-full rounded-full bg-slate-900"
                      initial={false}
                      animate={{ width: `${safeProgress}%` }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>{autoSaving ? 'Saving…' : 'Last saved'}</span>
                    <span>{autoSaving ? 'Please wait' : savedText}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <QuickMenuButton
                    icon={<Save className="h-5 w-5 text-slate-900" />}
                    title="Save"
                    description="Store changes"
                    onClick={() => {
                      onSave();
                      setMoreOpen(false);
                    }}
                  />

                  <QuickMenuButton
                    icon={<Settings className="h-5 w-5 text-slate-900" />}
                    title="Vault"
                    description="Settings"
                    onClick={() => {
                      onOpenVaultSettings();
                      setMoreOpen(false);
                    }}
                  />

                  <QuickMenuButton
                    icon={<Download className="h-5 w-5 text-slate-900" />}
                    title="Export"
                    description="Download data"
                    onClick={() => {
                      onExport();
                      setMoreOpen(false);
                    }}
                  />

                  <QuickMenuButton
                    danger
                    icon={<LogOut className="h-5 w-5 text-rose-600" />}
                    title="Logout"
                    description="End session"
                    onClick={() => {
                      setMoreOpen(false);
                      onLogout();
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function QuickMenuButton({
  icon,
  title,
  description,
  danger,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -2 }}
      className={cx(
        'flex min-h-[92px] flex-col items-start justify-between rounded-3xl border p-4 text-left shadow-sm transition',
        danger
          ? 'border-rose-100 bg-rose-50 hover:bg-rose-100'
          : 'border-slate-200 bg-white hover:bg-slate-50',
      )}
    >
      {icon}

      <div>
        <p
          className={cx(
            'text-sm font-black',
            danger ? 'text-rose-700' : 'text-slate-950',
          )}
        >
          {title}
        </p>
        <p
          className={cx(
            'text-[11px] font-medium',
            danger ? 'text-rose-500' : 'text-slate-500',
          )}
        >
          {description}
        </p>
      </div>
    </motion.button>
  );
}
