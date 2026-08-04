'use client';

import React, { useMemo } from 'react';

export type AdminBarPoint = {
  label: string;
  value: number;
  /** Optional display value under/over the bar (defaults to value) */
  display?: string | number;
};

type Tone = 'auto' | 'peak' | 'mint' | 'mid' | 'deep';

/**
 * Attachment-style vertical bar chart — rounded tops, teal shades,
 * peak month darkest. Used on Overview (net revenue) and Analytics (signups).
 */
export function AdminBarChart({
  points,
  height = 200,
  showValues = true,
  valuePosition = 'below',
  emptyText = 'No data yet.',
}: {
  points: AdminBarPoint[];
  height?: number;
  showValues?: boolean;
  valuePosition?: 'above' | 'below';
  emptyText?: string;
}) {
  const max = useMemo(
    () => Math.max(1, ...points.map(p => p.value)),
    [points],
  );
  const peakIdx = useMemo(() => {
    let idx = 0;
    let best = -1;
    points.forEach((p, i) => {
      if (p.value >= best) {
        best = p.value;
        idx = i;
      }
    });
    return idx;
  }, [points]);

  if (!points.length) {
    return (
      <p style={{ color: 'var(--oa-muted)', margin: 0, fontSize: 13 }}>
        {emptyText}
      </p>
    );
  }

  const toneFor = (i: number): Tone => {
    if (i === peakIdx) return 'peak';
    if (i === points.length - 1) return 'deep';
    if (i % 2 === 0) return 'mint';
    return 'mid';
  };

  return (
    <div className="oa-admin-bar-chart" style={{ height }}>
      {points.map((p, i) => {
        const pct = Math.max(6, Math.round((p.value / max) * 100));
        const tone = toneFor(i);
        const display =
          p.display != null
            ? p.display
            : Number.isInteger(p.value)
              ? p.value
              : Math.round(p.value);
        return (
          <div key={`${p.label}-${i}`} className="oa-admin-bar-col">
            {showValues && valuePosition === 'above' ? (
              <span className="n">{display}</span>
            ) : null}
            <div
              className={`oa-admin-bar tone-${tone}`}
              style={{ height: `${pct}%` }}
              title={`${p.label}: ${display}`}
            />
            {showValues && valuePosition === 'below' ? (
              <span className="n below">{display}</span>
            ) : null}
            <span className="l">{p.label}</span>
          </div>
        );
      })}
    </div>
  );
}
