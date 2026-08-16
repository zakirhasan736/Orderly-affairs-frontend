'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { HIGHLIGHT_VAULT_SECTIONS } from '@/vault-prototype/navigate';
import Image from 'next/image';
import { ChevronDown, HelpCircle, X } from 'lucide-react';
import { cn } from '@common/ui/utils';
import { BRAND_LOGO } from '@/constants/brand';
import { VAULT_SCHEMA } from '@/vault-prototype';
import { VAULT_COLLECTIONS } from '@/vault-prototype/types';
import { SchemaIcon } from '@/vault-prototype/icons';
import { ProgressBar } from '@/components/vault-ui';
import { useOptionalAiDocumentRouting } from '@/contexts/AiDocumentRoutingContext';
import {
  partitionVaultNavForNewData,
  sectionHasSidebarNewAiData,
} from '@/utils/aiSidebarNewData';

function SidebarNewPip({ label = 'New data' }: { label?: string }) {
  return (
    <span
      className="relative flex h-2.5 w-2.5 shrink-0"
      title={label}
      aria-label={label}
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
    </span>
  );
}

function SidebarNavRow({
  item,
  active,
  hasNew,
  percent,
  complete,
  onClick,
}: {
  item: { apiId: string; name: string; icon: string; dove: number };
  active: boolean;
  hasNew: boolean;
  percent: number;
  complete?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex w-full items-center gap-2.5 rounded-[9px] py-2 pr-2.5 text-left text-[14px]',
        hasNew ? 'pl-3.5' : 'pl-2.5',
        active
          ? 'bg-[#213D59] font-semibold text-white'
          : hasNew
            ? 'bg-[#FFF8E8] font-semibold text-[#213D59] ring-1 ring-amber-300/70'
            : 'text-[#414A55] hover:bg-[#EFF3F7]',
      )}
    >
      {hasNew ? (
        <span
          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-amber-400"
          aria-hidden
        />
      ) : null}
      {hasNew ? <SidebarNewPip /> : null}
      <SchemaIcon
        name={item.icon}
        className={cn(
          'h-[18px] w-[18px] shrink-0',
          active ? 'opacity-100' : 'opacity-75',
        )}
      />
      <span className="min-w-0 flex-1 truncate">{item.name}</span>
      {item.dove ? <span className="text-[12px]">🕊️</span> : null}
      {hasNew ? (
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-wide',
            active ? 'text-amber-200' : 'text-amber-600',
          )}
        >
          New data
        </span>
      ) : item.apiId === 'dashboard' ? null : complete ? (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1F9D6B]" />
      ) : percent > 0 ? (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3EB1E5]" />
      ) : (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D5DDE5]" />
      )}
    </button>
  );
}

type Props = {
  activeSection: string;
  progress: number;
  completedCount: number;
  totalCount: number;
  sectionProgressById?: Record<string, { percent: number; complete: boolean }>;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  goToDashboard: () => void;
  goToSection: (id: string) => void;
  onOpenHelp?: () => void;
};

export function VaultCollectionSidebar({
  activeSection,
  progress,
  completedCount,
  totalCount,
  sectionProgressById,
  sidebarOpen,
  onCloseSidebar,
  goToDashboard,
  goToSection,
  onOpenHelp,
}: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [newDataTick, setNewDataTick] = useState(0);
  const aiRouting = useOptionalAiDocumentRouting();

  const groups = useMemo(() => {
    return VAULT_COLLECTIONS.map(collection => ({
      ...collection,
      items: [
        ...VAULT_SCHEMA.filter(section => section.collection === collection.id).map(
          section => ({
            apiId: section.apiId,
            name: section.name,
            icon: section.icon,
            dove: section.dove || 0,
          }),
        ),
        ...(collection.id === 'Start here'
          ? [{ apiId: 'dashboard', name: 'Dashboard', icon: 'home', dove: 0 }]
          : []),
      ],
    }));
  }, []);

  useEffect(() => {
    const onHighlight = (event: Event) => {
      const ids =
        (event as CustomEvent<{ sectionIds?: string[] }>).detail?.sectionIds ||
        [];
      setHighlightedIds(ids.map(String).filter(Boolean));
    };
    const bumpNewData = () => setNewDataTick(value => value + 1);
    window.addEventListener(HIGHLIGHT_VAULT_SECTIONS, onHighlight);
    window.addEventListener('orderly-ai-patch-stashed', bumpNewData);
    window.addEventListener('orderly-ai-section-reviewed', bumpNewData);
    window.addEventListener('orderly-ai-autofill-done', bumpNewData);
    window.addEventListener('orderly-ai-section-persisted', bumpNewData);
    return () => {
      window.removeEventListener(HIGHLIGHT_VAULT_SECTIONS, onHighlight);
      window.removeEventListener('orderly-ai-patch-stashed', bumpNewData);
      window.removeEventListener('orderly-ai-section-reviewed', bumpNewData);
      window.removeEventListener('orderly-ai-autofill-done', bumpNewData);
      window.removeEventListener('orderly-ai-section-persisted', bumpNewData);
    };
  }, []);

  const newDataIds = useMemo(() => {
    void newDataTick;
    const ids = new Set<string>();
    VAULT_SCHEMA.forEach(section => {
      const pending =
        aiRouting?.getPendingUploadsForSection(section.apiId) ?? [];
      if (sectionHasSidebarNewAiData(section.apiId, pending)) {
        ids.add(section.apiId);
      }
    });
    highlightedIds.forEach(id => ids.add(id));
    return ids;
  }, [aiRouting, highlightedIds, newDataTick]);

  const { newDataItems, groupsForNav } = useMemo(
    () => partitionVaultNavForNewData(groups, newDataIds),
    [groups, newDataIds],
  );

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-[70] flex h-[100dvh] w-[88vw] max-w-[272px] flex-col border-r border-[#E4EAF0] bg-white transition-transform duration-250 md:w-[272px] md:max-w-none md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-[#EFF3F7] px-5 py-5">
        <button
          type="button"
          onClick={goToDashboard}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <Image
            src={BRAND_LOGO}
            alt="Orderly Affairs"
            width={36}
            height={36}
            className="h-9 w-9 rounded-[10px] bg-white object-contain p-0.5 ring-1 ring-[#E4EAF0]"
          />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold tracking-tight text-[#213D59]">
              Orderly Affairs
            </span>
            <span className="block text-[11.5px] font-semibold uppercase tracking-wide text-[#7A8794]">
              Vault
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onCloseSidebar}
          className="grid h-9 w-9 place-items-center rounded-[9px] text-[#213D59] md:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-[#EFF3F7] px-5 py-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-[#7A8794]">
            Vault
          </span>
          <span className="text-[13px] font-bold tabular-nums text-[#213D59]">
            {completedCount} / {totalCount}
          </span>
        </div>
        <ProgressBar value={progress} size="sidebar" className="bg-[#E4EAF0]" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2.5">
        {newDataItems.length > 0 ? (
          <div className="mb-2 rounded-[11px] bg-[#FFF8E8] ring-1 ring-amber-200/80" data-tour="tour-new-data-hub">
            <div className="flex items-center gap-2 px-2.5 py-3 text-[11px] font-bold uppercase tracking-[0.09em] text-amber-800">
              <SidebarNewPip label="New data" />
              New data
            </div>
            <div className="px-1 pb-1.5">
              {newDataItems.map(item => (
                <SidebarNavRow
                  key={`new-${item.apiId}`}
                  item={item}
                  active={activeSection === item.apiId}
                  hasNew
                  percent={sectionProgressById?.[item.apiId]?.percent ?? 0}
                  complete={sectionProgressById?.[item.apiId]?.complete}
                  onClick={() => {
                    goToSection(item.apiId);
                    onCloseSidebar();
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}
        {groupsForNav.map(group => (
          <div key={group.id} className="mb-1">
            <button
              type="button"
              onClick={() =>
                setCollapsed(prev => ({ ...prev, [group.id]: !prev[group.id] }))
              }
              className="flex w-full items-center justify-between px-2.5 py-3 text-[11px] font-bold uppercase tracking-[0.09em] text-[#7A8794]"
            >
              <span className="flex min-w-0 items-center gap-2">
                {group.label}
              </span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition',
                  collapsed[group.id] && '-rotate-90',
                )}
              />
            </button>
            {collapsed[group.id] ? null : (
              <div>
                {group.items.map(item => (
                  <SidebarNavRow
                    key={item.apiId}
                    item={item}
                    active={
                      item.apiId === 'dashboard'
                        ? activeSection === 'dashboard'
                        : activeSection === item.apiId
                    }
                    hasNew={false}
                    percent={sectionProgressById?.[item.apiId]?.percent ?? 0}
                    complete={sectionProgressById?.[item.apiId]?.complete}
                    onClick={() => {
                      if (item.apiId === 'dashboard') goToDashboard();
                      else goToSection(item.apiId);
                      onCloseSidebar();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-[#EFF3F7] p-3">
        <button
          type="button"
          onClick={onOpenHelp}
          className="flex w-full items-center gap-2.5 rounded-[11px] bg-[#EAF6FD] px-3 py-2.5 text-left"
        >
          <HelpCircle className="h-5 w-5 text-[#213D59]" />
          <span>
            <span className="block text-[13.5px] font-semibold text-[#213D59]">Need a hand?</span>
            <span className="block text-[11.5px] text-[#7A8794]">Ask about any section</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
