'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/common/ui/button';
import { VAULT_NAVIGATION } from '@/utils/vaultNavigation';
import { getSectionFieldDefinitions } from '@/utils/aiSectionFieldCatalog';
import {
  getCachedVaultPrivacy,
  resolveVaultPrivacyMode,
  setCachedVaultPrivacy,
  type VaultPrivacyMode,
  type VaultPrivacyRule,
  VAULT_PRIVACY_CHANGED,
} from '@/utils/vaultPrivacyPolicy';
import { fetchVaultPrivacy, saveVaultPrivacy } from '@/libs/api/vaultPrivacy';
import {
  FINANCE_PRESET_SECTION_IDS,
  KIT_LOCKED_SECTION_IDS,
  SENSITIVE_DEFAULT_RULES,
  nokHintForField,
  sensitiveHandling,
} from '@/utils/vaultSensitiveFields';
import { toast } from 'sonner';

function ModeSelect({
  value,
  onChange,
  locked,
}: {
  value: VaultPrivacyMode;
  onChange: (mode: VaultPrivacyMode) => void;
  locked?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={locked}
      onChange={event => onChange(event.target.value as VaultPrivacyMode)}
      className="h-9 max-w-[14rem] rounded-lg border border-[#E4EAF0] bg-white px-2 text-[12px] font-semibold text-[#213D59] disabled:opacity-60"
    >
      <option value="server">Server (NOK if granted)</option>
      <option value="zero_knowledge">Zero-knowledge (server-blind)</option>
      <option value="device_only">This device only</option>
    </select>
  );
}

function modeLabel(mode: VaultPrivacyMode) {
  if (mode === 'zero_knowledge') return 'ZK';
  if (mode === 'device_only') return 'Device';
  return 'Server';
}

export function VaultPrivacySettings() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    void fetchVaultPrivacy();
    const bump = () => setTick(value => value + 1);
    window.addEventListener(VAULT_PRIVACY_CHANGED, bump);
    return () => window.removeEventListener(VAULT_PRIVACY_CHANGED, bump);
  }, []);

  const sections = VAULT_NAVIGATION;

  const setRule = (
    sectionId: string,
    subsectionId: string | null,
    fieldKey: string | null,
    mode: VaultPrivacyMode,
  ) => {
    if (KIT_LOCKED_SECTION_IDS.has(sectionId)) return;
    const key = `${sectionId}|${subsectionId || ''}|${fieldKey || ''}`;
    const rules = getCachedVaultPrivacy().rules.filter(
      rule =>
        `${rule.sectionId}|${rule.subsectionId || ''}|${rule.fieldKey || ''}` !==
        key,
    );
    const next: VaultPrivacyRule[] =
      mode === 'server'
        ? rules
        : [
            ...rules,
            {
              sectionId,
              subsectionId,
              fieldKey,
              mode,
              shareWithNok: false,
            },
          ];
    setCachedVaultPrivacy({ rules: next });
  };

  const applyFinancePreset = () => {
    const extra: VaultPrivacyRule[] = SENSITIVE_DEFAULT_RULES.filter(item =>
      (FINANCE_PRESET_SECTION_IDS as readonly string[]).includes(item.sectionId),
    ).map(item => ({
      sectionId: item.sectionId,
      subsectionId: null,
      fieldKey: item.fieldKey,
      mode: item.mode,
      shareWithNok: false,
    }));
    const keep = getCachedVaultPrivacy().rules.filter(
      rule =>
        !extra.some(
          item =>
            item.sectionId === rule.sectionId &&
            !rule.subsectionId &&
            rule.fieldKey === item.fieldKey,
        ),
    );
    setCachedVaultPrivacy({ rules: [...keep, ...extra] });
    toast.success('Money fields set: last 4 on server, full numbers ZK, scans on this device');
  };

  const persist = async () => {
    setSaving(true);
    try {
      await saveVaultPrivacy(getCachedVaultPrivacy());
      toast.success('Privacy settings saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const q = query.trim().toLowerCase();

  return (
    <section className="w-full overflow-hidden rounded-[16px] border border-[#E4EAF0] bg-white shadow-[0_1px_2px_rgba(33,61,89,.06)]">
      <div className="border-b border-[#EFF3F7] px-5 pb-4 pt-[22px] sm:px-6">
        <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#619FCE]">
          Privacy
        </p>
        <h2 className="flex items-center gap-2 text-[19px] font-bold tracking-[-0.02em] text-[#213D59]">
          <Lock className="h-5 w-5 text-[#619FCE]" />
          What Next of Kin receives
        </h2>
        <p className="mt-1 max-w-[620px] text-[13.5px] text-[#7A8794]">
          Server save is what a granted Next of Kin can read after unlock.
          Zero-knowledge stays server-blind. Device only never leaves this
          computer.
        </p>
      </div>

      <div className="space-y-3 p-4 sm:p-6">
        <div className="rounded-[11px] border border-[#CFE6F5] bg-[#EAF6FD] px-4 py-3.5 text-[13.5px] leading-relaxed text-[#213D59]">
          Most-specific rule wins: section, then inner section, then field.
          Bank, card, and investment numbers can keep last 4 on the server so
          Next of Kin can find the account. Full numbers and scans stay off
          the Vault.
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search a section or field"
            className="h-10 flex-1 rounded-xl border border-[#E4EAF0] px-3 text-[13px] text-[#213D59]"
          />
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-[#E4EAF0] text-[13px] font-semibold text-[#213D59]"
            onClick={applyFinancePreset}
          >
            Apply money defaults
          </Button>
        </div>

        {sections.map(section => {
          const locked = KIT_LOCKED_SECTION_IDS.has(section.id);
          const sectionMode = resolveVaultPrivacyMode({ sectionId: section.id });
          const expanded = openId === section.id;
          const titleHit = !q || section.title.toLowerCase().includes(q);
          const fieldsForSearch = (section.subsections || []).flatMap(sub =>
            getSectionFieldDefinitions(section.id, sub.id).map(field =>
              `${field.label} ${field.key} ${sub.title}`.toLowerCase(),
            ),
          );
          const searchHit =
            titleHit || fieldsForSearch.some(text => text.includes(q));
          if (q && !searchHit) return null;

          return (
            <div
              key={section.id}
              className="rounded-2xl border border-[#E4EAF0] bg-[#F6F8FA]"
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-3 text-left"
                onClick={() => setOpenId(expanded ? null : section.id)}
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-[#7A8794]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[#7A8794]" />
                )}
                <span className="min-w-0 flex-1 font-semibold text-[#213D59]">
                  {section.title}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#6A7481]">
                  {locked ? 'Kit · server' : modeLabel(sectionMode)}
                </span>
              </button>
              {expanded ? (
                <div className="space-y-3 border-t border-[#E4EAF0] bg-white px-3 py-3">
                  {locked ? (
                    <p className="text-[12px] text-[#6A7481]">
                      This Vault area stays on the server so Next of Kin access
                      and letters can work.
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[12px] text-[#6A7481]">Whole section</p>
                      <ModeSelect
                        value={sectionMode}
                        onChange={mode => setRule(section.id, null, null, mode)}
                      />
                    </div>
                  )}
                  {(section.subsections || []).map(sub => {
                    const subKey = `${section.id}:${sub.id}`;
                    const subOpen = openSub === subKey;
                    const subMode = resolveVaultPrivacyMode({
                      sectionId: section.id,
                      subsectionId: sub.id,
                    });
                    const inherited = subMode === sectionMode;
                    const fields = getSectionFieldDefinitions(
                      section.id,
                      sub.id,
                    ).filter(
                      field =>
                        field.type !== 'Instructions' &&
                        field.type !== 'InstructionsModal',
                    );
                    return (
                      <div
                        key={sub.id}
                        className="rounded-xl border border-[#E4EAF0] px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-1 text-left text-[13px] font-semibold text-[#213D59]"
                            onClick={() =>
                              setOpenSub(subOpen ? null : subKey)
                            }
                          >
                            {subOpen ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                            {sub.title}
                          </button>
                          {inherited ? (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7A8794]">
                              Inherit
                            </span>
                          ) : null}
                          <ModeSelect
                            locked={locked}
                            value={subMode}
                            onChange={mode =>
                              setRule(section.id, sub.id, null, mode)
                            }
                          />
                        </div>
                        {subOpen ? (
                          <ul className="mt-2 divide-y divide-[#E4EAF0]">
                            {fields.map(field => {
                              const fieldMode = resolveVaultPrivacyMode({
                                sectionId: section.id,
                                subsectionId: sub.id,
                                fieldKey: field.key,
                              });
                              const hint = nokHintForField(
                                section.id,
                                field.key,
                              );
                              const handling = sensitiveHandling(
                                section.id,
                                field.key,
                              );
                              return (
                                <li
                                  key={field.key}
                                  className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <span className="min-w-0">
                                    <span className="block text-[13px] text-[#213D59]">
                                      {field.label}
                                    </span>
                                    {hint ? (
                                      <span className="block text-[11px] text-[#6A7481]">
                                        {hint}
                                      </span>
                                    ) : null}
                                  </span>
                                  <ModeSelect
                                    locked={locked}
                                    value={
                                      handling === 'document'
                                        ? 'device_only'
                                        : handling === 'credential' ||
                                            handling === 'secret_last4'
                                          ? fieldMode === 'device_only'
                                            ? 'device_only'
                                            : 'zero_knowledge'
                                          : fieldMode
                                    }
                                    onChange={mode =>
                                      setRule(
                                        section.id,
                                        sub.id,
                                        field.key,
                                        handling === 'document'
                                          ? 'device_only'
                                          : handling === 'secret_last4' &&
                                              mode === 'server'
                                            ? 'zero_knowledge'
                                            : mode,
                                      )
                                    }
                                  />
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
        <Button
          type="button"
          onClick={() => void persist()}
          disabled={saving}
          className="mt-2 h-11 rounded-2xl bg-[#213D59] hover:bg-[#2C4B6B]"
        >
          <Shield className="mr-2 h-4 w-4" />
          {saving ? 'Saving…' : 'Save privacy settings'}
        </Button>
      </div>
    </section>
  );
}
