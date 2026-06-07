'use client';

import React from 'react';
import { cn } from '@common/ui/utils';
import { Info, ShieldCheck } from 'lucide-react';

export type FieldGroup = {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconWrap: string;
  layout: 'grid' | 'stack';
  fieldKeys: string[];
};

export const isFullWidthField = (field: any) =>
  field?.type === 'TextArea' ||
  field?.type === 'RadioButtons' ||
  field?.type === 'Instructions';

export function buildFieldMap(fields: any[]): Record<string, any> {
  return Object.fromEntries(fields.map(f => [f.key, f]));
}

export function getInstructionOverview(
  fields: any[],
  overviewKey: string,
): { label: string; content: string } | null {
  const field = fields.find(f => f.key === overviewKey);
  if (!field || field.type !== 'Instructions') return null;
  return { label: field.label, content: field.content };
}

export function VaultOverviewBox({
  label,
  content,
}: {
  label: string;
  content: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <Info className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-sm leading-6 text-slate-600">{content}</p>
      </div>
    </div>
  );
}

export function VaultEncryptedBadge() {
  return (
    <div className="inline-flex items-center gap-2 self-start rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 sm:self-end">
      <ShieldCheck className="h-3.5 w-3.5" />
      AES-256-GCM encrypted at rest
    </div>
  );
}

function renderGroupInner(
  group: FieldGroup,
  fieldMap: Record<string, any>,
  renderField: (fieldKey: string) => React.ReactNode,
) {
  if (group.layout === 'stack') {
    return (
      <div className="space-y-4">
        {group.fieldKeys.map(fieldKey => renderField(fieldKey))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {group.fieldKeys.map(fieldKey => {
        const field = fieldMap[fieldKey];
        if (!field) return null;

        return (
          <div
            key={fieldKey}
            className={cn(isFullWidthField(field) && 'md:col-span-2')}
          >
            {renderField(fieldKey)}
          </div>
        );
      })}
    </div>
  );
}

export function VaultGroupCards({
  groups,
  fieldMap,
  renderField,
}: {
  groups: FieldGroup[];
  fieldMap: Record<string, any>;
  renderField: (fieldKey: string) => React.ReactNode;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {groups.map(group => {
        const GroupIcon = group.icon;

        return (
          <section
            key={group.key}
            className={cn(
              'overflow-hidden rounded-[24px] border border-slate-200/80 bg-gradient-to-br shadow-sm',
              group.accent,
              group.layout === 'stack' && 'xl:col-span-2',
            )}
          >
            <div className="border-b border-white/60 bg-white/50 px-5 py-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                    group.iconWrap,
                  )}
                >
                  <GroupIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">
                    {group.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {group.subtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-3 py-5">
              {renderGroupInner(group, fieldMap, renderField)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
