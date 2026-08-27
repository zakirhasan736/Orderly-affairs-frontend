'use client';

import React, { useState } from 'react';
import { Loader2, ScrollText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@common/ui/button';
import { Input } from '@common/ui/input';
import { Label } from '@common/ui/label';
import { cn } from '@common/ui/utils';
import {
  useAgreeDeathCertificateAuthorizationMutation,
  useGetDeathCertificateAuthorizationQuery,
} from '@/services/authApi';
import {
  DEATH_CERT_AUTH_CHECKBOX_LABEL,
  DEATH_CERT_AUTH_TITLE,
} from '@/data/deathCertificateAuthorization';

type Props = {
  variant?: 'vault' | 'compact';
  /** Document only — parent collects the checkbox / signature. */
  hideSignForm?: boolean;
  className?: string;
  onSigned?: () => void;
};

export function DeathCertificateAuthorizationPanel({
  variant = 'vault',
  hideSignForm = false,
  className,
  onSigned,
}: Props) {
  const { data, isLoading } = useGetDeathCertificateAuthorizationQuery();
  const [agree, { isLoading: isSigning }] =
    useAgreeDeathCertificateAuthorizationMutation();
  const [checked, setChecked] = useState(false);
  const [signature, setSignature] = useState('');

  const handleSign = async () => {
    if (!checked) {
      toast.error('Check the box to agree to this Authorization');
      return;
    }
    if (!signature.trim()) {
      toast.error('Type your full legal name as your electronic signature');
      return;
    }
    try {
      await agree({
        agreed: true,
        signature_name: signature.trim(),
      }).unwrap();
      toast.success('Authorization saved in your Vault');
      onSigned?.();
    } catch (err) {
      toast.error(
        err && typeof err === 'object' && 'data' in err
          ? String(
              (err as { data?: { detail?: string } }).data?.detail ||
                'Could not save the authorization',
            )
          : 'Could not save the authorization',
      );
    }
  };

  if (isLoading && !data) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl border px-4 py-6 text-sm text-muted-foreground',
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading authorization…
      </div>
    );
  }

  const title = data?.title || DEATH_CERT_AUTH_TITLE;
  const checkboxLabel = data?.checkbox_label || DEATH_CERT_AUTH_CHECKBOX_LABEL;
  const compact = variant === 'compact';

  return (
    <section
      id={compact ? undefined : 'subsection-2B'}
      className={cn(
        'rounded-2xl border bg-card',
        compact ? 'p-4' : 'p-4 sm:p-5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#213D59] text-white">
          <ScrollText className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-bold tracking-[-0.02em] text-[#213D59]">
            {title}
          </h3>
          <p className="mt-0.5 text-[12.5px] text-[#7A8794]">
            Orderly Affairs Digital, LLC
            {data?.last_updated ? ` · Last updated ${data.last_updated}` : ''}
          </p>
        </div>
      </div>

      <div
        className={cn(
          'mt-4 space-y-3 overflow-y-auto rounded-xl border bg-slate-50/80 px-3 py-3 text-[13.5px] leading-6 text-[#414A55]',
          compact ? 'max-h-56' : 'max-h-[28rem]',
        )}
      >
        {(data?.intro || []).map(paragraph => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
        {(data?.sections || []).map(section => (
          <div key={section.number}>
            <p className="font-semibold text-[#213D59]">
              {section.number}. {section.title}
            </p>
            {section.body.split('\n\n').map(block => (
              <p key={block.slice(0, 48)} className="mt-2">
                {block}
              </p>
            ))}
          </div>
        ))}
      </div>

      {hideSignForm ? null : data?.agreed ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-950">
          Signed
          {data.signature_name ? ` by ${data.signature_name}` : ''}
          {data.agreed_at
            ? ` on ${new Date(data.agreed_at).toLocaleDateString()}`
            : ''}
          . Stored in this Vault.
        </p>
      ) : data?.can_sign ? (
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-background px-4 py-3">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm leading-6">{checkboxLabel}</span>
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="death-cert-auth-signature">
              Electronic signature (full legal name)
            </Label>
            <Input
              id="death-cert-auth-signature"
              value={signature}
              onChange={e => setSignature(e.target.value)}
              placeholder="Type your full legal name"
              className="rounded-xl"
            />
          </div>
          <Button
            type="button"
            onClick={() => void handleSign()}
            disabled={isSigning}
            className="rounded-2xl"
          >
            {isSigning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Sign and save to Vault
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          The account holder must sign this Authorization before after-death
          Vault access can be granted.
        </p>
      )}
    </section>
  );
}
