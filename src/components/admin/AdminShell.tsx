'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import {
  ADMIN_NAV,
  ADMIN_PAGE_META,
  adminPageKeyFromPath,
} from '@/components/admin/adminNav';
import { BRAND_LOGO } from '@/constants/brand';
import {
  adminCouponStats,
  adminListDsar,
  adminListLegacy,
} from '@/libs/api/adminApi';

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function canSeeNavItem(href: string, areas: string[] | undefined): boolean {
  if (!areas || areas.includes('*')) return true;
  if (href === '/admin' || href === '/admin/') return areas.includes('overview');
  const part = href.replace(/^\/admin\/?/, '').split('/')[0];
  const map: Record<string, string> = {
    users: 'users',
    activity: 'activity',
    analytics: 'analytics',
    subscriptions: 'subscriptions',
    coupons: 'coupons',
    billing: 'billing',
    notifications: 'notifications',
    support: 'support',
    feedback: 'feedback',
    dsar: 'dsar',
    legacy: 'legacy',
    roles: 'roles',
    audit: 'audit',
    security: 'security',
    backups: 'backups',
  };
  const area = map[part];
  if (!area) return true;
  return areas.includes(area);
}

const MOBILE_TABS = [
  { href: '/admin', label: 'Home', id: 'overview' },
  { href: '/admin/users', label: 'Users', id: 'users' },
  { href: '/admin/subscriptions', label: 'Revenue', id: 'subs' },
  { href: '/admin/support', label: 'Requests', id: 'support' },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/admin';
  const router = useRouter();
  const { session, signOut } = useAdminAuth();
  const pageKey = adminPageKeyFromPath(pathname);
  const meta = ADMIN_PAGE_META[pageKey] || ADMIN_PAGE_META.overview;
  const [sessionLeft, setSessionLeft] = useState(25 * 60);
  const [moreOpen, setMoreOpen] = useState(false);
  const [badges, setBadges] = useState<
    Record<string, { n: number; alert?: boolean }>
  >({});

  useEffect(() => {
    const id = window.setInterval(() => {
      setSessionLeft(v => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    void (async () => {
      try {
        const [dsar, legacy, coupons] = await Promise.all([
          adminListDsar().catch(() => null),
          adminListLegacy().catch(() => null),
          adminCouponStats().catch(() => null),
        ]);
        const next: Record<string, { n: number; alert?: boolean }> = {};
        if (dsar?.open) next.dsar = { n: dsar.open };
        if (legacy?.open) next.legacy = { n: legacy.open, alert: true };
        if (coupons?.unused) next.coupons = { n: coupons.unused };
        setBadges(next);
      } catch {
        /* ignore */
      }
    })();
  }, [pathname]);

  const initials = useMemo(() => {
    const name = session?.full_name || session?.email || 'A';
    return name.trim().charAt(0).toUpperCase();
  }, [session]);

  const areas = session?.admin_areas;
  const roleLabel = (session?.admin_role || 'super_admin').replace(/_/g, ' ');

  const moreActive = !MOBILE_TABS.some(t =>
    t.href === '/admin'
      ? pathname === '/admin' || pathname === '/admin/'
      : pathname.startsWith(t.href),
  );

  const badgeFor = (href: string) => {
    if (href.includes('dsar')) return badges.dsar;
    if (href.includes('legacy')) return badges.legacy;
    if (href.includes('coupons')) return badges.coupons;
    return undefined;
  };

  return (
    <div className="oa-admin-app">
      <aside className="oa-admin-side" data-shell-side>
        <div className="oa-admin-side-brand">
          <div className="oa-admin-side-logo">
            <Image
              src={BRAND_LOGO}
              alt="Orderly Affairs"
              width={32}
              height={32}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div>
            <div className="oa-admin-side-name">Orderly Affairs</div>
            <div className="oa-admin-side-sub">System owner</div>
          </div>
        </div>
        <nav className="oa-admin-nav">
          {ADMIN_NAV.map(group => {
            const items = group.items.filter(item =>
              canSeeNavItem(item.href, areas),
            );
            if (!items.length) return null;
            return (
              <React.Fragment key={group.label}>
                <div className="oa-admin-nav-label">{group.label}</div>
                {items.map(item => {
                  const active =
                    item.href === '/admin'
                      ? pathname === '/admin' || pathname === '/admin/'
                      : pathname.startsWith(item.href);
                  const badge = badgeFor(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={active ? 'active' : undefined}
                    >
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {badge?.n ? (
                        <span
                          className={`oa-badge${badge.alert ? ' alert' : ''}`}
                        >
                          {badge.n}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </React.Fragment>
            );
          })}
        </nav>
        <div className="oa-admin-side-foot">
          Metadata only · no vault content
          <br />
          access from this console
        </div>
      </aside>

      <div className="oa-admin-main">
        <header className="oa-admin-top">
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <h1>{meta.title}</h1>
            <div className="sub">{meta.subtitle}</div>
          </div>
          <div className="oa-admin-chip oa-admin-hide-md" data-hdr-search>
            <span aria-hidden>⌕</span>
            <input
              className="oa-admin-input"
              style={{
                border: 'none',
                boxShadow: 'none',
                minHeight: 28,
                padding: 0,
                width: 140,
                background: 'transparent',
              }}
              placeholder="Search users"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const q = (e.target as HTMLInputElement).value.trim();
                  router.push(
                    q
                      ? `/admin/users?q=${encodeURIComponent(q)}`
                      : '/admin/users',
                  );
                }
              }}
            />
          </div>
          <span className="oa-admin-chip oa-admin-hide-md" data-hdr-chip>
            Session <strong>{formatClock(sessionLeft)}</strong>
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flex: 'none',
            }}
          >
            <div className="oa-admin-avatar">{initials}</div>
            <div className="oa-admin-hide-md" style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {session?.full_name || session?.email || 'Admin'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--oa-muted)' }}>
                {roleLabel} · MFA ✓
              </div>
            </div>
            <button
              type="button"
              className="oa-admin-btn ghost"
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="oa-admin-content" data-shell-main>
          <div className="oa-admin-notice">
            <span aria-hidden>🔒</span>
            <span>
              Zero content access: this console shows account metadata only.
              Vault contents stay encrypted client-side.
            </span>
          </div>
          {children}
        </main>
      </div>

      <nav className="oa-admin-mobile-tabs" aria-label="Primary">
        {MOBILE_TABS.map(tab => {
          const active =
            tab.href === '/admin'
              ? pathname === '/admin' || pathname === '/admin/'
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={active ? 'active' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
        <button
          type="button"
          className={moreActive || moreOpen ? 'active' : undefined}
          onClick={() => setMoreOpen(v => !v)}
        >
          More
        </button>
      </nav>

      {moreOpen ? (
        <div
          className="oa-admin-drawer oa-admin-more-sheet open"
          role="dialog"
          aria-label="More navigation"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="oa-admin-drawer-panel"
            onClick={e => e.stopPropagation()}
          >
            <div
              className="oa-admin-sheet-handle"
              style={{ display: 'block' }}
            />
            <h2 style={{ margin: '0 0 12px', fontSize: 24 }}>More</h2>
            {ADMIN_NAV.map(group => {
              const items = group.items.filter(
                item =>
                  canSeeNavItem(item.href, areas) &&
                  !MOBILE_TABS.some(t => t.href === item.href),
              );
              if (!items.length) return null;
              return (
                <div key={group.label} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--oa-muted)',
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    {group.label}
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {items.map(item => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="oa-admin-btn secondary"
                        style={{ justifyContent: 'flex-start' }}
                        onClick={() => setMoreOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              className="oa-admin-btn ink"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
