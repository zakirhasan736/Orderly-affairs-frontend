'use client';

import React from 'react';

type BoneProps = {
  width?: string | number;
  height?: string | number;
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

export function AdminBone({
  width = '100%',
  height = 14,
  radius = 8,
  className = '',
  style,
}: BoneProps) {
  return (
    <span
      className={`oa-admin-bone ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
      aria-hidden
    />
  );
}

export function AdminStatCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="oa-admin-cards" aria-busy="true" aria-label="Loading stats">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="oa-admin-stat">
          <AdminBone width="42%" height={10} />
          <AdminBone
            width="55%"
            height={28}
            style={{ marginTop: 10 }}
            radius={10}
          />
          <AdminBone width="70%" height={11} style={{ marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({
  rows = 6,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div
      className="oa-admin-table-wrap"
      aria-busy="true"
      aria-label="Loading table"
    >
      <table>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <AdminBone width={`${50 + (i % 3) * 12}%`} height={10} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <AdminBone
                    width={c === 0 ? '72%' : `${40 + ((r + c) % 4) * 10}%`}
                    height={c === 0 ? 16 : 12}
                  />
                  {c === 0 ? (
                    <AdminBone
                      width="48%"
                      height={10}
                      style={{ marginTop: 6, display: 'block' }}
                    />
                  ) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminPanelSkeleton({
  withHead = true,
  lines = 4,
}: {
  withHead?: boolean;
  lines?: number;
}) {
  return (
    <div className="oa-admin-panel" aria-busy="true">
      {withHead ? (
        <div className="oa-admin-panel-head">
          <AdminBone width={160} height={16} radius={8} />
          <AdminBone width={120} height={36} radius={10} />
        </div>
      ) : null}
      <div className="oa-admin-panel-body">
        {Array.from({ length: lines }).map((_, i) => (
          <AdminBone
            key={i}
            width={`${88 - i * 8}%`}
            height={12}
            style={{ marginBottom: 12, display: 'block' }}
          />
        ))}
      </div>
    </div>
  );
}

export function AdminOverviewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading overview">
      <AdminStatCardsSkeleton count={4} />
      <div className="oa-admin-grid-2">
        <AdminPanelSkeleton lines={5} />
        <AdminPanelSkeleton lines={6} />
      </div>
    </div>
  );
}

export function AdminTablePageSkeleton({
  cards = 0,
  cols = 6,
  rows = 7,
}: {
  cards?: number;
  cols?: number;
  rows?: number;
}) {
  return (
    <div aria-busy="true" aria-label="Loading">
      {cards > 0 ? <AdminStatCardsSkeleton count={cards} /> : null}
      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <AdminBone width={180} height={16} />
          <AdminBone width={140} height={36} radius={10} />
          <AdminBone width={200} height={36} radius={10} />
        </div>
        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          <AdminTableSkeleton cols={cols} rows={rows} />
        </div>
      </div>
    </div>
  );
}

export function AdminRolesSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading roles">
      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <AdminBone width={240} height={16} />
        </div>
        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          <AdminTableSkeleton cols={6} rows={6} />
        </div>
      </div>
      <AdminStatCardsSkeleton count={5} />
      <AdminPanelSkeleton lines={3} />
      <div className="oa-admin-panel">
        <div className="oa-admin-panel-head">
          <AdminBone width={140} height={16} />
          <AdminBone width={180} height={36} radius={10} />
        </div>
        <div className="oa-admin-panel-body" style={{ padding: 0 }}>
          <AdminTableSkeleton cols={6} rows={5} />
        </div>
      </div>
    </div>
  );
}

export function AdminFormPanelSkeleton() {
  return (
    <div className="oa-admin-panel" aria-busy="true">
      <div className="oa-admin-panel-head">
        <AdminBone width={200} height={16} />
      </div>
      <div className="oa-admin-panel-body">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
            gap: 12,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="oa-admin-field">
              <AdminBone width="40%" height={10} />
              <AdminBone
                width="100%"
                height={42}
                radius={10}
                style={{ marginTop: 8, display: 'block' }}
              />
            </div>
          ))}
        </div>
        <AdminBone
          width={160}
          height={44}
          radius={10}
          style={{ marginTop: 16, display: 'block' }}
        />
      </div>
    </div>
  );
}

export function AdminSessionSkeleton() {
  return (
    <div
      className="oa-admin"
      style={{ minHeight: '100vh', padding: 24 }}
      aria-busy="true"
      aria-label="Checking admin session"
    >
      <div
        style={{
          display: 'flex',
          gap: 16,
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            width: 220,
            flex: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
          className="oa-admin-hide-md"
        >
          <AdminBone width={40} height={40} radius={10} />
          <AdminBone width="80%" height={12} />
          {Array.from({ length: 8 }).map((_, i) => (
            <AdminBone key={i} width="100%" height={34} radius={8} />
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <AdminBone width={220} height={20} style={{ marginBottom: 8 }} />
          <AdminBone width={280} height={12} style={{ marginBottom: 24 }} />
          <AdminOverviewSkeleton />
        </div>
      </div>
    </div>
  );
}

export function AdminListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" style={{ display: 'grid', gap: 10, padding: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            border: '1px solid var(--oa-border)',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <AdminBone width="55%" height={14} />
          <AdminBone width="80%" height={11} style={{ marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}
