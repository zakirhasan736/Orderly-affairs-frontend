'use client';

import React, { useMemo } from 'react';

type Point = { label: string; value: number };

export function AdminLineChart({
  points,
  height = 200,
}: {
  points: Point[];
  height?: number;
}) {
  const width = 640;
  const padX = 28;
  const padY = 28;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const { path, area, dots, max } = useMemo(() => {
    const vals = points.map(p => p.value);
    const maxV = Math.max(1, ...vals);
    const n = Math.max(1, points.length - 1);
    const coords = points.map((p, i) => {
      const x = padX + (i / n) * chartW;
      const y = padY + chartH - (p.value / maxV) * chartH;
      return { ...p, x, y };
    });
    const line = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');
    const areaPath =
      coords.length > 0
        ? `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${(padY + chartH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padY + chartH).toFixed(1)} Z`
        : '';
    return { path: line, area: areaPath, dots: coords, max: maxV };
  }, [points, chartW, chartH, padX, padY]);

  if (!points.length) {
    return (
      <p style={{ color: 'var(--oa-muted)', margin: 0, fontSize: 13 }}>
        No data yet.
      </p>
    );
  }

  return (
    <svg
      className="oa-admin-line-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Trend chart"
      style={{ height }}
    >
      {[0.25, 0.5, 0.75, 1].map(t => {
        const y = padY + chartH * (1 - t);
        return (
          <line
            key={t}
            className="grid-line"
            x1={padX}
            x2={width - padX}
            y1={y}
            y2={y}
          />
        );
      })}
      <path className="area" d={area} />
      <path className="line" d={path} />
      {dots.map(d => (
        <g key={d.label}>
          <circle className="dot" cx={d.x} cy={d.y} r={4.5} />
          <text className="value" x={d.x} y={d.y - 10} textAnchor="middle">
            {typeof d.value === 'number' && d.value >= 1000
              ? `${Math.round(d.value / 100) / 10}k`
              : d.value}
          </text>
          <text
            className="label"
            x={d.x}
            y={height - 8}
            textAnchor="middle"
          >
            {d.label}
          </text>
        </g>
      ))}
      <text className="label" x={padX} y={14}>
        max {max}
      </text>
    </svg>
  );
}
