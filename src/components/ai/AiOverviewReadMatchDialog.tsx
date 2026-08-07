'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  FileSearch,
  Layers3,
  Loader2,
  Sparkles,
  User,
  Users,
  Baby,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';
import { cn } from '@common/ui/utils';
import { AI_ROUTING_DIALOG_SHEET } from '@/utils/aiMobileUi';
import {
  AI_SECTION_BY_ID,
  AI_SECTION_REGISTRY,
  getAiSectionLabel,
} from '@/utils/aiSectionRegistry';
import type { DetectedAiFact } from '@/utils/aiDashboardPatchCache';
import {
  aiNoFieldsMessage,
  aiReadSourceDetail,
  aiReadSourceShort,
  aiReadSourceTitle,
} from '@/utils/aiReadSourceLabels';
import type { IdentityPersonChoice } from '@/utils/aiIdentityDocument';
import { getVaultSectionDisplayNumber } from '@/utils/vaultNavigation';

export type OverviewMatchedSection = {
  sectionId: string;
  sectionLabel?: string;
  summary?: string;
  factCount?: number;
};

export type OverviewDocumentReview = {
  id: string;
  fileId?: string;
  fileName: string;
  documentSummary?: string;
  facts: DetectedAiFact[];
  matchedSections: OverviewMatchedSection[];
  readSource?: 'system' | 'gemini' | 'cache';
  extractMethod?: string;
  /** Ask me / spouse / dependent before fill. */
  needsPersonChoice?: boolean;
  personPromptKind?: 'identity' | 'insurance';
  personName?: string | null;
  /** AI could not place this doc — user must pick a section first. */
  needsSectionChoice?: boolean;
};

export type OverviewApprovePayload = {
  documents: Array<{
    id: string;
    fileId?: string;
    fileName: string;
    selectedSectionIds: string[];
    personChoice?: IdentityPersonChoice | null;
    personPromptKind?: 'identity' | 'insurance';
  }>;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: OverviewDocumentReview[];
  onOpenSection: (sectionId: string) => void;
  onApproveFill?: (payload: OverviewApprovePayload) => void | Promise<void>;
  onChooseSection?: (
    docId: string,
    sectionId: string,
  ) => void | Promise<void>;
  approving?: boolean;
  choosingSectionDocId?: string | null;
};

const PERSON_OPTIONS: Array<{
  choice: IdentityPersonChoice;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { choice: 'self', label: 'Me (primary)', icon: User },
  { choice: 'spouse', label: 'Spouse / partner', icon: Users },
  { choice: 'dependent', label: 'Dependent', icon: Baby },
  { choice: 'other', label: 'Someone else', icon: UserRound },
];

function uniqueFacts(facts: DetectedAiFact[]) {
  const seen = new Set<string>();
  const list: DetectedAiFact[] = [];
  for (const fact of facts) {
    const key = `${fact.label}|${fact.value}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(fact);
  }
  return list;
}

export function AiOverviewReadMatchDialog({
  open,
  onOpenChange,
  documents,
  onOpenSection,
  onApproveFill,
  onChooseSection,
  approving = false,
  choosingSectionDocId = null,
}: Props) {
  const [openDocId, setOpenDocId] = useState<string | null>(null);
  const [selectedByDoc, setSelectedByDoc] = useState<
    Record<string, string[]>
  >({});
  const [personByDoc, setPersonByDoc] = useState<
    Record<string, IdentityPersonChoice>
  >({});
  const [sectionQueryByDoc, setSectionQueryByDoc] = useState<
    Record<string, string>
  >({});

  const firstDocId = documents[0]?.id || null;
  const docKey = documents.map(d => d.id).join('|');

  useEffect(() => {
    if (!open) return;
    setOpenDocId(firstDocId);
    const nextSelected: Record<string, string[]> = {};
    const nextPerson: Record<string, IdentityPersonChoice> = {};
    documents.forEach(doc => {
      nextSelected[doc.id] = doc.matchedSections.map(s => s.sectionId);
      if (doc.needsPersonChoice) nextPerson[doc.id] = 'self';
    });
    setSelectedByDoc(nextSelected);
    setPersonByDoc(nextPerson);
    // Seed only when dialog opens or the document set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, firstDocId, docKey]);

  const totalFacts = useMemo(
    () => documents.reduce((sum, doc) => sum + uniqueFacts(doc.facts).length, 0),
    [documents],
  );

  const toggleSection = (docId: string, sectionId: string) => {
    setSelectedByDoc(prev => {
      const current = prev[docId] || [];
      const next = current.includes(sectionId)
        ? current.filter(id => id !== sectionId)
        : [...current, sectionId];
      return { ...prev, [docId]: next };
    });
  };

  const sectionChoicesForDoc = (doc: OverviewDocumentReview) =>
    doc.matchedSections;

  const handleApprove = async () => {
    if (!onApproveFill) return;
    const ready = documents.filter(doc => !doc.needsSectionChoice);
    if (!ready.length) return;
    await onApproveFill({
      documents: ready.map(doc => ({
        id: doc.id,
        fileId: doc.fileId,
        fileName: doc.fileName,
        selectedSectionIds: selectedByDoc[doc.id] || [],
        personChoice: doc.needsPersonChoice
          ? personByDoc[doc.id] || 'self'
          : null,
        personPromptKind: doc.personPromptKind,
      })),
    });
  };

  const canApprove =
    Boolean(onApproveFill) &&
    documents.some(
      doc =>
        !doc.needsSectionChoice && (selectedByDoc[doc.id] || []).length > 0,
    );

  const pickerSections = useMemo(
    () =>
      [...AI_SECTION_REGISTRY].sort(
        (a, b) =>
          Number(getVaultSectionDisplayNumber(a.id)) -
          Number(getVaultSectionDisplayNumber(b.id)),
      ),
    [],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(AI_ROUTING_DIALOG_SHEET, 'md:max-w-3xl')}>
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7eef7] text-[#2B5A8C]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[#213D59]">
                {documents.length <= 1
                  ? 'Review & fill'
                  : `Review & fill · ${documents.length} documents`}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Assign a section if needed, say whose ID or insurance card it
                is (you, spouse, dependent), then approve — no need to open
                sections first.
              </DialogDescription>
            </div>
          </div>
          {documents.length > 1 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {totalFacts} fields across {documents.length} files — expand a
              card below.
            </p>
          ) : null}
        </DialogHeader>

        <div className="max-h-[min(62vh,560px)] space-y-2 overflow-y-auto pr-0.5">
          {documents.map((doc, index) => {
            const isOpen = openDocId === doc.id;
            const facts = uniqueFacts(doc.facts);
            const sections = sectionChoicesForDoc(doc);
            const selected = selectedByDoc[doc.id] || [];
            return (
              <article
                key={doc.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-[#f5f8fc]"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenDocId(current =>
                      current === doc.id ? null : doc.id,
                    )
                  }
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#213D59] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[#213D59]">
                      {doc.fileName || `Document ${index + 1}`}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {facts.length} fields · {selected.length} section
                      {selected.length === 1 ? '' : 's'} selected ·{' '}
                      {aiReadSourceShort(doc.readSource)}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-slate-400 transition',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>

                {isOpen ? (
                  <div className="space-y-3 border-t border-slate-100 px-3 pb-3 pt-3">
                    {doc.documentSummary ? (
                      <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {doc.documentSummary}
                      </p>
                    ) : null}

                    <p
                      className={cn(
                        'rounded-xl px-3 py-2 text-xs font-semibold',
                        doc.readSource === 'system'
                          ? 'bg-emerald-50 text-emerald-800'
                          : doc.readSource === 'cache'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-[#e7eef7] text-[#213D59]',
                      )}
                    >
                      {aiReadSourceTitle(doc.readSource)}
                      <span className="mt-0.5 block font-normal opacity-90">
                        {aiReadSourceDetail(doc.readSource)}
                      </span>
                    </p>

                    {doc.needsSectionChoice ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                          Where should we put this?
                        </p>
                        <p className="mt-1 text-sm text-amber-950/80">
                          AI could not tell which vault section this belongs to.
                          Pick one and we&apos;ll extract the fields here for
                          your approval.
                        </p>
                        <input
                          type="search"
                          value={sectionQueryByDoc[doc.id] || ''}
                          onChange={event =>
                            setSectionQueryByDoc(prev => ({
                              ...prev,
                              [doc.id]: event.target.value,
                            }))
                          }
                          placeholder="Search sections…"
                          className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#213D59]"
                        />
                        <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
                          {pickerSections
                            .filter(section => {
                              const q = (sectionQueryByDoc[doc.id] || '')
                                .trim()
                                .toLowerCase();
                              if (!q) return true;
                              const label = `${getVaultSectionDisplayNumber(section.id)}. ${section.label}`.toLowerCase();
                              return label.includes(q);
                            })
                            .map(section => {
                              const busy = choosingSectionDocId === doc.id;
                              return (
                                <li key={section.id}>
                                  <button
                                    type="button"
                                    disabled={busy || !onChooseSection}
                                    onClick={() =>
                                      void onChooseSection?.(doc.id, section.id)
                                    }
                                    className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-[#213D59]/35 hover:bg-[#e7eef7]/50 disabled:opacity-60"
                                  >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#213D59] text-[11px] font-bold text-white">
                                      {getVaultSectionDisplayNumber(section.id)}
                                    </span>
                                    <span className="min-w-0 flex-1 font-medium text-[#213D59]">
                                      {section.label}
                                    </span>
                                    {busy ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                                    ) : null}
                                  </button>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    ) : null}

                    {!doc.needsSectionChoice && doc.needsPersonChoice ? (
                      <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">
                          {doc.personPromptKind === 'insurance'
                            ? 'Whose insurance card is this?'
                            : 'Whose ID is this?'}
                        </p>
                        {doc.personName ? (
                          <p className="mt-1 text-sm font-medium text-slate-800">
                            Name on document: {doc.personName}
                          </p>
                        ) : null}
                        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                          {PERSON_OPTIONS.map(option => {
                            const Icon = option.icon;
                            const active =
                              (personByDoc[doc.id] || 'self') === option.choice;
                            return (
                              <button
                                key={option.choice}
                                type="button"
                                onClick={() =>
                                  setPersonByDoc(prev => ({
                                    ...prev,
                                    [doc.id]: option.choice,
                                  }))
                                }
                                className={cn(
                                  'flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm transition',
                                  active
                                    ? 'border-[#213D59] bg-white text-[#213D59] ring-1 ring-[#213D59]/30'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                                )}
                              >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                <span className="font-medium">
                                  {option.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {!doc.needsSectionChoice ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <section className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 border-b border-slate-100 bg-[#f5f8fc] px-3 py-2">
                          <FileSearch className="h-3.5 w-3.5 text-[#2B5A8C]" />
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#213D59]">
                            Fields we read
                          </h3>
                          <span className="ml-auto text-[11px] font-semibold text-slate-400">
                            {facts.length}
                          </span>
                        </div>
                        <ul className="max-h-52 space-y-1.5 overflow-y-auto p-2.5">
                          {facts.length === 0 ? (
                            <li className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500">
                              {aiNoFieldsMessage()}
                            </li>
                          ) : (
                            facts.map(fact => (
                              <li
                                key={`${fact.label}:${fact.value}`}
                                className="rounded-lg bg-slate-50 px-2.5 py-2 text-sm text-slate-700"
                              >
                                <span className="font-semibold text-[#213D59]">
                                  {fact.label}:
                                </span>{' '}
                                <span className="break-all">{fact.value}</span>
                              </li>
                            ))
                          )}
                        </ul>
                      </section>

                      <section className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 border-b border-slate-100 bg-[#f5f8fc] px-3 py-2">
                          <Layers3 className="h-3.5 w-3.5 text-[#2B5A8C]" />
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#213D59]">
                            Fill these sections
                          </h3>
                          <span className="ml-auto text-[11px] font-semibold text-slate-400">
                            {selected.length}/{sections.length}
                          </span>
                        </div>
                        <ul className="max-h-52 space-y-2 overflow-y-auto p-2.5">
                          {sections.length === 0 ? (
                            <li className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500">
                              No vault sections matched yet. Use Assign below if
                              this document still needs a home.
                            </li>
                          ) : (
                            sections.map(section => {
                              const label =
                                section.sectionLabel ||
                                getAiSectionLabel(section.sectionId) ||
                                AI_SECTION_BY_ID[section.sectionId]?.label ||
                                `Section ${section.sectionId}`;
                              const checked = selected.includes(
                                section.sectionId,
                              );
                              return (
                                <li key={section.sectionId}>
                                  <label
                                    className={cn(
                                      'flex w-full cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                                      checked
                                        ? 'border-[#213D59]/35 bg-[#e7eef7]/50'
                                        : 'border-slate-200 bg-white hover:border-slate-300',
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#213D59] focus:ring-[#213D59]"
                                      checked={checked}
                                      onChange={() =>
                                        toggleSection(doc.id, section.sectionId)
                                      }
                                    />
                                    <span className="min-w-0 flex-1">
                                      <span className="block font-semibold text-[#213D59]">
                                        {label}
                                      </span>
                                      <span className="mt-0.5 block text-xs text-slate-500">
                                        {section.summary ||
                                          (section.factCount
                                            ? `${section.factCount} fields ready`
                                            : 'Ready to fill')}
                                      </span>
                                      <button
                                        type="button"
                                        className="mt-1 text-[11px] font-semibold text-[#2B5A8C] underline-offset-2 hover:underline"
                                        onClick={event => {
                                          event.preventDefault();
                                          onOpenChange(false);
                                          onOpenSection(section.sectionId);
                                        }}
                                      >
                                        Open section
                                      </button>
                                    </span>
                                  </label>
                                </li>
                              );
                            })
                          )}
                        </ul>
                      </section>
                    </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-500">
            {documents.some(doc => doc.needsSectionChoice)
              ? 'Assign a section for each document that still needs a home, then approve the rest.'
              : 'Unchecked sections stay in Vault Activity until you Accept later.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={approving}
              onClick={() => onOpenChange(false)}
            >
              Review later
            </Button>
            {onApproveFill ? (
              <Button
                type="button"
                className="rounded-xl bg-[#213D59] hover:bg-[#1a3149]"
                disabled={!canApprove || approving}
                onClick={() => void handleApprove()}
              >
                {approving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Approve & fill
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
