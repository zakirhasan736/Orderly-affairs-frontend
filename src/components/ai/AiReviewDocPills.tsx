'use client';

import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@common/ui/utils';

export type AiReviewDocPillItem = {
  id: string;
  label: string;
  index: number;
  active?: boolean;
};

type Props = {
  items: AiReviewDocPillItem[];
  onSelect: (id: string) => void;
  className?: string;
};

/**
 * Numbered document pills: swipe / drag left-right, prev/next follows upload order.
 */
export function AiReviewDocPills({ items, onSelect, className }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    pointer: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  });

  const activeIndex = Math.max(
    0,
    items.findIndex(item => item.active),
  );
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < items.length - 1;

  useEffect(() => {
    const active = scrollerRef.current?.querySelector<HTMLElement>(
      '[data-active-pill="true"]',
    );
    active?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeIndex, items.length]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (node.scrollWidth <= node.clientWidth) return;
      node.scrollLeft += event.deltaY;
      event.preventDefault();
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [items.length]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = scrollerRef.current;
    if (!node) return;
    drag.current = {
      pointer: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: node.scrollLeft,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = scrollerRef.current;
    if (!node || !drag.current.pointer) return;
    const delta = event.clientX - drag.current.startX;
    if (!drag.current.moved && Math.abs(delta) > 6) {
      drag.current.moved = true;
      node.setPointerCapture(event.pointerId);
    }
    if (!drag.current.moved) return;
    node.scrollLeft = drag.current.scrollLeft - delta;
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = scrollerRef.current;
    if (node?.hasPointerCapture(event.pointerId)) {
      node.releasePointerCapture(event.pointerId);
    }
    drag.current.pointer = false;
  };

  const select = (id: string) => {
    if (drag.current.moved) return;
    onSelect(id);
  };

  if (items.length < 2) return null;

  return (
    <div
      className={cn(
        'min-w-0 w-full shrink-0 overflow-hidden border-b border-[#E4EAF0]/80 bg-white px-2 py-2 sm:px-4',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          disabled={!hasPrev}
          onClick={() => hasPrev && onSelect(items[activeIndex - 1].id)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#E4EAF0] bg-white text-[#213D59] disabled:opacity-30"
          aria-label="Previous document"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div
          ref={scrollerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex min-w-0 flex-1 cursor-grab gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 touch-pan-x active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map(item => (
            <button
              key={item.id}
              type="button"
              data-active-pill={item.active ? 'true' : undefined}
              onClick={() => select(item.id)}
              className={cn(
                'flex max-w-[14rem] shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-left text-[12px] font-semibold transition select-none',
                item.active
                  ? 'border-[#213D59] bg-[#213D59] text-white'
                  : 'border-[#E4EAF0] bg-white text-[#213D59] hover:border-[#213D59]/40',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  item.active
                    ? 'bg-white/20 text-white'
                    : 'bg-[#213D59] text-white',
                )}
              >
                {item.index}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => hasNext && onSelect(items[activeIndex + 1].id)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#E4EAF0] bg-white text-[#213D59] disabled:opacity-30"
          aria-label="Next document"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-[#7A8794]">
        {activeIndex + 1} of {items.length} · drag or use arrows to switch files
      </p>
    </div>
  );
}
