'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
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
  DialogHeader,
  DialogTitle,
} from '@/components/common/ui/dialog';
import { cn } from '@common/ui/utils';
import { AI_REVIEW_FILL_DIALOG_SHEET, AI_REVIEW_FILL_FOOTER, AI_REVIEW_FILL_BUTTON, AI_REVIEW_DOC_PANE, AI_REVIEW_TWO_PANE } from '@/utils/aiMobileUi';
import {
  AI_SECTION_BY_ID,
  AI_SECTION_REGISTRY,
  getAiSectionLabel,
  resolveAiSectionId,
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
import { polishUploadedDocumentName } from '@/utils/aiUploadDisplayTitle';
import { AiReviewDocumentPane } from '@/components/ai/AiReviewDocumentPane';
import { AiReviewDetailFields } from '@/components/ai/AiReviewDetailFields';
import { AiReviewDocPills } from '@/components/ai/AiReviewDocPills';
import {
  mergeFactsWithSectionCatalog,
  uniqueEditableFacts,
} from '@/utils/aiReviewCatalogFacts';
import { VaultPrivacySaveToggle } from '@/components/vault/VaultPrivacySaveToggle';
import { highlightVaultSections } from '@/vault-prototype/navigate';
import {
  aiFieldBadge,
  aiFillActionLabel,
  combineAiFillKinds,
  previewAiFillAgainstVault,
  type AiFieldFillKind,
  type AiFillKind,
} from '@/utils/aiFillPreview';

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
  mimeType?: string;
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
    editedFacts?: DetectedAiFact[];
  }>;
};

type EditableFact = DetectedAiFact & { editId: string };

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
  /** Live vault data keyed by section id, used to detect same vs new AI fills. */
  vaultBySection?: Record<string, unknown>;
  /** Review later: keep the extract so the user can open this view again. */
  onReviewLater?: () => void;
  /** Open this uploaded file, not the first document in the batch. */
  focusFileId?: string | null;
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

function factsForReview(
  facts: DetectedAiFact[],
  sectionIds: string[],
): EditableFact[] {
  return uniqueEditableFacts(
    mergeFactsWithSectionCatalog({ facts, sectionIds }),
  );
}

function stripEditId(facts: EditableFact[]): DetectedAiFact[] {
  return facts.map(({ editId: _editId, ...fact }) => fact);
}

function sectionLabelFor(section: OverviewMatchedSection) {
  return (
    section.sectionLabel ||
    getAiSectionLabel(section.sectionId) ||
    AI_SECTION_BY_ID[section.sectionId]?.label ||
    `Section ${section.sectionId}`
  );
}

function factSectionId(
  fact: DetectedAiFact,
  selectedIds: string[],
  matched: OverviewMatchedSection[],
) {
  const fromFact = resolveAiSectionId(fact.section_key);
  if (fromFact && selectedIds.includes(fromFact)) return fromFact;
  if (fromFact && matched.some(section => section.sectionId === fromFact)) {
    return fromFact;
  }
  return selectedIds[0] || matched[0]?.sectionId || fromFact;
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
  vaultBySection,
  onReviewLater,
  focusFileId,
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
  const [editsByDoc, setEditsByDoc] = useState<Record<string, EditableFact[]>>(
    {},
  );
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [focusSectionId, setFocusSectionId] = useState<string | null>(null);
  const extraCountRef = useRef(0);

  const firstDocId = documents[0]?.id || null;
  const focusedId =
    documents.find(
      doc =>
        String(doc.fileId || '').trim() === String(focusFileId || '').trim() ||
        String(doc.id || '').trim() === String(focusFileId || '').trim(),
    )?.id || firstDocId;
  const docKey = documents.map(d => d.id).join('|');

  useEffect(() => {
    if (!open) return;
    setOpenDocId(current =>
      focusedId && documents.some(doc => doc.id === focusedId)
        ? focusedId
        : current && documents.some(doc => doc.id === current)
          ? current
          : firstDocId,
    );
    const nextSelected: Record<string, string[]> = {};
    const nextPerson: Record<string, IdentityPersonChoice> = {};
    const nextEdits: Record<string, EditableFact[]> = {};
    documents.forEach(doc => {
      nextSelected[doc.id] = doc.matchedSections.map(s => s.sectionId);
      if (doc.needsPersonChoice) nextPerson[doc.id] = 'self';
      nextEdits[doc.id] = factsForReview(
        doc.facts,
        doc.matchedSections.map(section => section.sectionId),
      );
    });
    setSelectedByDoc(nextSelected);
    setPersonByDoc(nextPerson);
    setEditsByDoc(nextEdits);
    setSummaryExpanded(false);
    setFocusSectionId(
      documents.find(doc => doc.id === focusedId)?.matchedSections[0]
        ?.sectionId ||
        documents[0]?.matchedSections[0]?.sectionId ||
        null,
    );
    // Seed only when dialog opens or the document set / focused file changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, firstDocId, focusedId, docKey]);

  useEffect(() => {
    if (!open) return;
    setEditsByDoc(prev => {
      let changed = false;
      const next = { ...prev };
      for (const doc of documents) {
        const seeded = factsForReview(
          doc.facts,
          doc.matchedSections.map(section => section.sectionId),
        );
        if (!next[doc.id]?.length && seeded.length) {
          next[doc.id] = seeded;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [open, documents]);

  const activeDoc =
    documents.find(doc => doc.id === openDocId) || documents[0] || null;
  const activeFacts = activeDoc
    ? editsByDoc[activeDoc.id] ||
      factsForReview(
        activeDoc.facts,
        (selectedByDoc[activeDoc.id] || activeDoc.matchedSections.map(s => s.sectionId)),
      )
    : [];
  const selected = activeDoc ? selectedByDoc[activeDoc.id] || [] : [];
  const sections = activeDoc?.matchedSections || [];

  useEffect(() => {
    if (!open) {
      highlightVaultSections([]);
      return;
    }
    highlightVaultSections(selected);
    return () => highlightVaultSections([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selected.join('|')]);

  useEffect(() => {
    if (!open || !activeDoc) return;
    const sectionIds =
      selected.length > 0
        ? selected
        : activeDoc.matchedSections.map(section => section.sectionId);
    setEditsByDoc(prev => {
      const current = prev[activeDoc.id] || [];
      const catalog = factsForReview(activeDoc.facts, sectionIds);
      const byKey = new Map(
        current.map(item => [
          `${String(item.section_key || '').toLowerCase()}::${String(item.field_key || item.label).toLowerCase()}`,
          item,
        ]),
      );
      const next = catalog.map(
        item =>
          byKey.get(
            `${String(item.section_key || '').toLowerCase()}::${String(item.field_key || item.label).toLowerCase()}`,
          ) || item,
      );
      current.forEach(item => {
        if (item.concept === 'user_added' && !next.some(row => row.editId === item.editId)) {
          next.push(item);
        }
      });
      return { ...prev, [activeDoc.id]: next };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeDoc?.id, selected.join('|')]);

  const toggleSection = (docId: string, sectionId: string) => {
    setSelectedByDoc(prev => {
      const current = prev[docId] || [];
      const next = current.includes(sectionId)
        ? current.filter(id => id !== sectionId)
        : [...current, sectionId];
      return { ...prev, [docId]: next };
    });
  };

  const updateFact = (
    docId: string,
    editId: string,
    patch: Partial<EditableFact>,
  ) => {
    setEditsByDoc(prev => ({
      ...prev,
      [docId]: (prev[docId] || []).map(item =>
        item.editId === editId ? { ...item, ...patch } : item,
      ),
    }));
  };

  const addManualFact = (docId: string) => {
    extraCountRef.current += 1;
    const editId = `extra-${extraCountRef.current}`;
    const sectionId =
      focusSectionId || (selectedByDoc[docId] || [])[0] || '';
    setEditsByDoc(prev => ({
      ...prev,
      [docId]: [
        ...(prev[docId] || []),
        {
          editId,
          label: 'Detail from document',
          value: '',
          field_key: 'notes',
          concept: 'user_added',
          section_key: AI_SECTION_BY_ID[sectionId]?.key || sectionId,
        },
      ],
    }));
  };

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
        editedFacts: stripEditId(
          editsByDoc[doc.id] ||
            factsForReview(
              doc.facts,
              selectedByDoc[doc.id] ||
                doc.matchedSections.map(section => section.sectionId),
            ),
        ),
      })),
    });
  };

  const canApprove =
    Boolean(onApproveFill) &&
    documents.some(
      doc =>
        !doc.needsSectionChoice && (selectedByDoc[doc.id] || []).length > 0,
    );

  const fillPreviews = useMemo(() => {
    if (!activeDoc) return [];
    const ids = selected.length
      ? selected
      : activeDoc.matchedSections.map(section => section.sectionId);
    return ids.map(sectionId =>
      previewAiFillAgainstVault({
        sectionId,
        facts: activeFacts.filter(
          fact => factSectionId(fact, ids, sections) === sectionId,
        ),
        sectionData: vaultBySection?.[sectionId],
      }),
    );
  }, [activeDoc, activeFacts, sections, selected, vaultBySection]);

  const fillKind: AiFillKind = combineAiFillKinds(
    fillPreviews.map(preview => preview.kind),
  );
  const fillHeadline = fillPreviews.map(preview => preview.title).filter(Boolean)[0];
  const fieldKindByKey = useMemo(() => {
    const map: Record<string, string> = {};
    fillPreviews.forEach(preview => {
      Object.assign(map, preview.fieldKind);
    });
    return map;
  }, [fillPreviews]);

  const pickerSections = useMemo(
    () =>
      [...AI_SECTION_REGISTRY].sort(
        (a, b) =>
          Number(getVaultSectionDisplayNumber(a.id)) -
          Number(getVaultSectionDisplayNumber(b.id)),
      ),
    [],
  );

  const displayName = activeDoc
    ? polishUploadedDocumentName(activeDoc.fileName, activeDoc.mimeType) ||
      activeDoc.fileName ||
      'Uploaded document'
    : '';

  const summaryText = String(activeDoc?.documentSummary || '').trim();
  const summaryLong = summaryText.length > 140;
  const summaryShown =
    summaryExpanded || !summaryLong
      ? summaryText
      : `${summaryText.slice(0, 140).trim()}…`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(AI_REVIEW_FILL_DIALOG_SHEET, 'bg-[#F6F8FA]')}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-[#E4EAF0]/80 bg-white px-4 py-3 pr-12 text-left sm:px-5">
          <div className="flex justify-center md:hidden" aria-hidden>
            <div className="-mt-1 mb-1 h-1.5 w-12 rounded-full bg-[#D5DDE5]" />
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAF6FD] text-[#3EB1E5]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-[#213D59]">
                {documents.length <= 1
                  ? fillHeadline
                    ? `Review & fill · ${fillHeadline}`
                    : 'Review & fill'
                  : `Review & fill · ${documents.length} documents`}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-[#6A7481]">
                Check the document, confirm the summary, then fill any missing
                numbers from the page.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {documents.length > 1 ? (
          <AiReviewDocPills
            items={documents.map((doc, index) => ({
              id: doc.id,
              index: index + 1,
              active: (openDocId || firstDocId) === doc.id,
              label:
                polishUploadedDocumentName(doc.fileName, doc.mimeType) ||
                doc.fileName ||
                `Document ${index + 1}`,
            }))}
            onSelect={id => {
              const doc = documents.find(item => item.id === id);
              setOpenDocId(id);
              setSummaryExpanded(false);
              setFocusSectionId(doc?.matchedSections[0]?.sectionId || null);
            }}
          />
        ) : null}

        {activeDoc ? (
          <div className={AI_REVIEW_TWO_PANE}>
            <div className="min-h-0 px-3 pt-3 sm:px-5 sm:pt-4">
              <AiReviewDocumentPane
                fileId={activeDoc.fileId}
                fileName={activeDoc.fileName}
                mimeType={activeDoc.mimeType}
                active={open}
                className={AI_REVIEW_DOC_PANE}
              />
            </div>

            <div className="px-3 py-3 sm:px-5 sm:py-4">
              <p className="text-[18px] font-semibold leading-snug tracking-tight text-[#213D59] sm:text-[20px]">
                {displayName}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-[#7A8794]">
                {activeDoc.fileName}
                {activeDoc.readSource
                  ? ` · ${aiReadSourceShort(activeDoc.readSource)}`
                  : ''}
              </p>

              {summaryText ? (
                <div className="mt-2 rounded-[11px] border border-[#E4EAF0] bg-white px-3 py-2 shadow-sm">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#7A8794]">
                    AI summary
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-snug text-[#213D59]">
                    {summaryShown}
                  </p>
                  {summaryLong ? (
                    <button
                      type="button"
                      className="mt-1 text-[12px] font-semibold text-[#2E7FAD] hover:underline"
                      onClick={() => setSummaryExpanded(value => !value)}
                    >
                      {summaryExpanded ? 'Show less' : 'Show more'}
                    </button>
                  ) : null}
                </div>
              ) : null}

              <p
                className={cn(
                  'mt-2 text-[11.5px] font-semibold',
                  activeDoc.readSource === 'system'
                    ? 'text-[#1F9D6B]'
                    : activeDoc.readSource === 'cache'
                      ? 'text-[#6A7481]'
                      : 'text-[#213D59]',
                )}
              >
                {aiReadSourceTitle(activeDoc.readSource)}
                <span className="ml-1 font-normal opacity-90">
                  {aiReadSourceDetail(activeDoc.readSource)}
                </span>
              </p>

              {activeDoc.needsSectionChoice ? (
                <div className="mt-3 rounded-2xl border border-[#FDF4E4] bg-[#FDF4E4] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#B4761A]">
                    Where should we put this?
                  </p>
                  <p className="mt-1 text-sm text-[#213D59]">
                    AI could not tell which vault section this belongs to. Pick
                    one and we&apos;ll extract the fields here for your
                    approval.
                  </p>
                  <input
                    type="search"
                    value={sectionQueryByDoc[activeDoc.id] || ''}
                    onChange={event =>
                      setSectionQueryByDoc(prev => ({
                        ...prev,
                        [activeDoc.id]: event.target.value,
                      }))
                    }
                    placeholder="Search sections…"
                    className="mt-2 w-full rounded-xl border border-[#E4EAF0] bg-white px-3 py-2 text-sm text-[#213D59] outline-none focus:border-[#213D59]"
                  />
                  <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
                    {pickerSections
                      .filter(section => {
                        const q = (sectionQueryByDoc[activeDoc.id] || '')
                          .trim()
                          .toLowerCase();
                        if (!q) return true;
                        return section.label.toLowerCase().includes(q);
                      })
                      .map(section => {
                        const busy = choosingSectionDocId === activeDoc.id;
                        return (
                          <li key={section.id}>
                            <button
                              type="button"
                              disabled={busy || !onChooseSection}
                              onClick={() =>
                                void onChooseSection?.(
                                  activeDoc.id,
                                  section.id,
                                )
                              }
                              className="flex w-full items-center gap-2 rounded-xl border border-[#E4EAF0] bg-white px-3 py-2 text-left text-sm transition hover:border-[#213D59]/35 hover:bg-[#EAF6FD]/50 disabled:opacity-60"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#213D59] text-[11px] font-bold text-white">
                                {(section.label || '?')
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                              <span className="min-w-0 flex-1 font-medium text-[#213D59]">
                                {section.label}
                              </span>
                              {busy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7A8794]" />
                              ) : null}
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ) : (
                <>
                  <p className="mt-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#7A8794]">
                    Matched section
                  </p>
                  <div className="mt-1.5 space-y-1.5">
                    {sections.length === 0 ? (
                      <div className="rounded-[11px] border border-dashed border-[#E4EAF0] px-3 py-2 text-[13px] text-[#7A8794]">
                        No vault sections matched yet.
                      </div>
                    ) : (
                      sections.map(section => {
                        const label = sectionLabelFor(section);
                        const checked = selected.includes(section.sectionId);
                        const sectionFacts = activeFacts.filter(
                          fact =>
                            factSectionId(
                              fact,
                              selected,
                              sections,
                            ) === section.sectionId,
                        );
                        const filledN = sectionFacts.filter(fact =>
                          String(fact.value || '').trim(),
                        ).length;
                        const emptyN = sectionFacts.length - filledN;
                        const focused = focusSectionId === section.sectionId;
                        return (
                          <div
                            key={section.sectionId}
                            className={cn(
                              'flex items-center gap-2 rounded-[9px] border px-2.5 py-1.5',
                              checked
                                ? 'border-[#619FCE] bg-[#EAF6FD]'
                                : 'border-[#E4EAF0] bg-white hover:border-[#619FCE]',
                              focused ? 'ring-1 ring-[#3EB1E5]/70' : '',
                            )}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded-full border-[#C9D4DE] text-[#213D59] focus:ring-[#3EB1E5]"
                              checked={checked}
                              onChange={() =>
                                toggleSection(activeDoc.id, section.sectionId)
                              }
                              aria-label={`File to ${label}`}
                            />
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                              onClick={() =>
                                setFocusSectionId(section.sectionId)
                              }
                            >
                              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#213D59]">
                                {label}
                              </span>
                              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#7A8794]">
                                {filledN} of {sectionFacts.length || 0} filled
                                {emptyN ? ` · ${emptyN} empty` : ''}
                              </span>
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4 shrink-0 text-[#7A8794] transition',
                                  focused ? '' : '-rotate-90',
                                )}
                              />
                            </button>
                            <button
                              type="button"
                              className="shrink-0 text-[12.5px] font-semibold text-[#2E7FAD]"
                              onClick={() => {
                                onOpenChange(false);
                                onOpenSection(section.sectionId);
                              }}
                            >
                              Open
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {selected[0] ? (
                    <VaultPrivacySaveToggle
                      className="mt-3"
                      sectionId={selected[0]}
                    />
                  ) : null}

                  {activeDoc.needsPersonChoice ? (
                    <div className="mt-3 rounded-[11px] border border-[#CFE6F5] bg-[#EAF6FD] p-3.5">
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#213D59]">
                        {activeDoc.personPromptKind === 'insurance'
                          ? 'Whose insurance card is this?'
                          : 'Whose ID is this?'}
                      </p>
                      {activeDoc.personName ? (
                        <p className="mt-1 text-[13.5px] font-medium text-[#213D59]">
                          Name on document: {activeDoc.personName}
                        </p>
                      ) : null}
                      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                        {PERSON_OPTIONS.map(option => {
                          const Icon = option.icon;
                          const isActive =
                            (personByDoc[activeDoc.id] || 'self') ===
                            option.choice;
                          return (
                            <button
                              key={option.choice}
                              type="button"
                              onClick={() =>
                                setPersonByDoc(prev => ({
                                  ...prev,
                                  [activeDoc.id]: option.choice,
                                }))
                              }
                              className={cn(
                                'flex items-center gap-2 rounded-[11px] border px-2.5 py-2 text-left text-[13.5px] transition',
                                isActive
                                  ? 'border-[#213D59] bg-white text-[#213D59] ring-1 ring-[#213D59]/30'
                                  : 'border-[#E4EAF0] bg-white text-[#213D59] hover:border-[#619FCE]',
                              )}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="font-semibold">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-2.5 rounded-[11px] border border-[#E4EAF0] bg-white px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#7A8794]">
                          Fields
                        </p>
                        <p className="mt-0.5 text-[12px] leading-snug text-[#6A7481]">
                          {fillKind === 'same'
                            ? 'This is already in your Vault. Nothing new to fill.'
                            : fillKind === 'update'
                              ? 'This item is already on file. New or changed values are marked.'
                              : 'Empty rows show Add. Filled rows have an edit icon.'}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E8F6F0] px-2 py-0.5 text-[11px] font-bold text-[#1F9D6B]">
                        {
                          activeFacts.filter(
                            fact => !String(fact.value || '').trim(),
                          ).length
                        }{' '}
                        empty
                      </span>
                    </div>
                    <AiReviewDetailFields
                      className="mt-1"
                      splitEmpty
                      focusSectionId={focusSectionId || selected[0]}
                      emptyMessage={aiNoFieldsMessage()}
                      addFieldLabel="Add a number from the document"
                      onAddField={() => addManualFact(activeDoc.id)}
                      fields={activeFacts.map(fact => {
                        const sectionId = factSectionId(
                          fact,
                          selected,
                          sections,
                        );
                        const matched = sections.find(
                          section => section.sectionId === sectionId,
                        );
                        return {
                          id: fact.editId,
                          label: fact.label,
                          value: fact.value,
                          sectionId,
                          sectionTitle: matched
                            ? sectionLabelFor(matched)
                            : getAiSectionLabel(sectionId) || 'This section',
                          badge: aiFieldBadge(
                            fieldKindByKey[
                              String(fact.field_key || fact.label || '')
                                .trim()
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '_')
                                .replace(/^_|_$/g, '')
                            ] as AiFieldFillKind | undefined,
                          ),
                          hint: fact.value ? 'From document' : undefined,
                          labelEditable: fact.concept === 'user_added',
                          onLabelChange: label =>
                            updateFact(activeDoc.id, fact.editId, { label }),
                          onChange: value =>
                            updateFact(activeDoc.id, fact.editId, { value }),
                        };
                      })}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}

        <div className={cn(AI_REVIEW_FILL_FOOTER, 'shrink-0')}>
          <Button
            type="button"
            disabled={approving}
            onClick={() => {
              onReviewLater?.();
              onOpenChange(false);
            }}
            className={cn(
              AI_REVIEW_FILL_BUTTON,
              'bg-[#FBEDEA] text-[#C2442E] hover:bg-[#FBEDEA]',
            )}
          >
            Review later
          </Button>
          {onApproveFill ? (
            <Button
              type="button"
              className={cn(
                AI_REVIEW_FILL_BUTTON,
                'bg-[#213D59] text-white hover:bg-[#2C4B6B]',
              )}
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
                  {aiFillActionLabel(fillKind)}
                </>
              )}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
