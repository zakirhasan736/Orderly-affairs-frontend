'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@common/ui/button';
import { Badge } from '@common/ui/badge';
import {
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Printer,
  Shield,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface PasswordCardProps {
  personName: string;
  relationship?: string;
  email?: string;
  phone?: string;
  masterPassword: string;
  accessLevel: string;
  authorizedSections?: string[];
  immediateAccess?: boolean;
  card_storage_location?: string;
  onDownload?: () => void;
  onPrint?: () => void;
}

function escapeHtml(value: string | undefined | null) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function sanitizeFilename(value: string) {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

  return cleaned || 'trusted-person';
}

function formatPassword(value: string) {
  if (!value) return 'NOT GENERATED';

  return (
    value
      .replace(/\s+/g, '')
      .toUpperCase()
      .match(/.{1,4}/g)
      ?.join(' ') || value
  );
}

function maskPassword(value: string) {
  if (!value) return '•••• •••• ••••';

  return (
    '•'
      .repeat(Math.min(value.replace(/\s+/g, '').length || 12, 16))
      .match(/.{1,4}/g)
      ?.join(' ') || '•••• •••• ••••'
  );
}

export function PasswordCard({
  personName,
  relationship,
  email,
  phone,
  masterPassword,
  accessLevel,
  authorizedSections = [],
  immediateAccess,
  card_storage_location,
  onDownload,
  onPrint,
}: PasswordCardProps) {
  const [showPassword, setShowPassword] = useState(true);

  const isFullAccess = accessLevel === 'Full Kit Access';

  const visiblePassword = showPassword
    ? formatPassword(masterPassword)
    : maskPassword(masterPassword);

  const safeSections = useMemo(
    () => authorizedSections.filter(Boolean),
    [authorizedSections],
  );

  const generateCardHtml = () => {
    const safePersonName = escapeHtml(personName || 'Trusted Person');
    const safeAccessLevel = escapeHtml(accessLevel || 'Not provided');
    const safePassword = escapeHtml(formatPassword(masterPassword));
    const safeRelationship = escapeHtml(relationship || 'Not provided');
    const safeEmail = escapeHtml(email || 'Not provided');
    const safePhone = escapeHtml(phone || 'Not provided');
    const safeLocation = escapeHtml(card_storage_location || 'Not provided');

    const sectionsHtml =
      !isFullAccess && safeSections.length > 0
        ? safeSections
            .map(section => `<span>${escapeHtml(section)}</span>`)
            .join('')
        : '<span>Full Kit Access</span>';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Orderly Affairs Password Card</title>
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 28px;
      background: #f5f7fb;
      font-family: Arial, sans-serif;
      color: #0f172a;
    }

    .wrap {
      max-width: 640px;
      margin: 0 auto;
    }

    .title {
      margin: 0 0 18px;
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
    }

    .card {
      position: relative;
      overflow: hidden;
      border-radius: 22px;
      background: linear-gradient(135deg, #0f1b33, #162744 55%, #0b1629);
      color: white;
      padding: 30px;
      min-height: 330px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
      border: 1px solid rgba(255,255,255,.14);
    }

    .card:before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 25% 10%, rgba(96,165,250,.18), transparent 34%),
        radial-gradient(circle at 85% 80%, rgba(34,197,94,.12), transparent 28%);
      pointer-events: none;
    }

    .watermark {
      position: absolute;
      right: 44px;
      top: 118px;
      width: 118px;
      height: 118px;
      border: 10px solid rgba(255,255,255,.18);
      border-radius: 28px 28px 38px 38px;
      opacity: .8;
    }

    .content {
      position: relative;
      z-index: 2;
    }

    .top {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: center;
      margin-bottom: 28px;
    }

    .card-label {
      font-size: 15px;
      letter-spacing: .11em;
      color: rgba(255,255,255,.72);
      font-weight: 800;
      text-transform: uppercase;
    }

    .pill {
      display: inline-block;
      padding: 8px 14px;
      border-radius: 999px;
      background: #22c55e;
      color: white;
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
    }

    .field {
      margin-bottom: 16px;
    }

    .label {
      color: rgba(255,255,255,.55);
      font-size: 13px;
      margin-bottom: 7px;
    }

    .value {
      font-size: 18px;
      font-weight: 800;
      color: white;
    }

    .password {
      font-family: "Courier New", monospace;
      font-size: 24px;
      letter-spacing: .12em;
      font-weight: 900;
      color: white;
      word-break: break-word;
    }

    .small-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 22px;
      padding-top: 18px;
      border-top: 1px solid rgba(255,255,255,.12);
    }

    .small-box {
      border-radius: 14px;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.1);
      padding: 12px;
      min-height: 68px;
    }

    .small-label {
      font-size: 10px;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: rgba(255,255,255,.45);
      margin-bottom: 5px;
      font-weight: 800;
    }

    .small-value {
      font-size: 12px;
      color: rgba(255,255,255,.86);
      line-height: 1.4;
      word-break: break-word;
    }

    .sections {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 16px;
    }

    .sections span {
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.13);
      background: rgba(255,255,255,.08);
      padding: 5px 9px;
      color: rgba(255,255,255,.75);
      font-size: 11px;
      font-weight: 700;
    }

    .note {
      margin-top: 18px;
      color: rgba(255,255,255,.58);
      font-size: 12px;
      line-height: 1.55;
    }

    @media print {
      body { background: white; }
      .card { box-shadow: none; }
    }

    @media (max-width: 560px) {
      body { padding: 14px; }
      .card { padding: 22px; min-height: 310px; }
      .watermark {
        right: 26px;
        top: 122px;
        width: 92px;
        height: 92px;
        border-width: 8px;
      }
      .password { font-size: 20px; }
      .small-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1 class="title">Password Card Preview</h1>

    <section class="card">
      <div class="watermark"></div>

      <div class="content">
        <div class="top">
          <div class="card-label">2A Kit Access Card</div>
          <div class="pill">${safeAccessLevel}</div>
        </div>

        <div class="field">
          <div class="label">Name</div>
          <div class="value">${safePersonName}</div>
        </div>

        <div class="field">
          <div class="label">Access Type</div>
          <div class="value">${safeAccessLevel}</div>
        </div>

        <div class="field">
          <div class="label">Master Password</div>
          <div class="password">${safePassword}</div>
        </div>

        <div class="sections">${sectionsHtml}</div>

        <div class="small-grid">
          <div class="small-box">
            <div class="small-label">Relationship</div>
            <div class="small-value">${safeRelationship}</div>
          </div>

          <div class="small-box">
            <div class="small-label">Card Location</div>
            <div class="small-value">${safeLocation}</div>
          </div>

          <div class="small-box">
            <div class="small-label">Email</div>
            <div class="small-value">${safeEmail}</div>
          </div>

          <div class="small-box">
            <div class="small-label">Phone</div>
            <div class="small-value">${safePhone}</div>
          </div>
        </div>

        <div class="note">
          Keep this card in a safe place. Do not share the password directly with others.
        </div>
      </div>
    </section>
  </div>
</body>
</html>`;
  };

  const handleDownload = () => {
    const htmlContent = generateCardHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `password-card-${sanitizeFilename(
      personName || 'trusted-person',
    )}.html`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    onDownload?.();
  };

  const handlePrint = () => {
    const htmlContent = generateCardHtml();
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');

    if (!printWindow) return;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      onPrint?.();
    };
  };

  return (
    <div className="mx-auto w-full max-w-[620px]">
      {/* Top preview header */}
      <div className="mb-4 hidden items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
            Password Card Preview
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Secure card for trusted kit access
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
          <Eye className="h-4 w-4" />
          Preview
        </div>
      </div>

      {/* Main premium card */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.20),transparent_32%),linear-gradient(135deg,#0f1b33,#172846_55%,#0a1425)] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.24)] sm:p-7">
        {/* Watermark */}
        <Shield className="pointer-events-none absolute right-8 top-[112px] h-28 w-28 text-white/14 sm:right-12 sm:top-[118px] sm:h-32 sm:w-32" />

        <div className="relative z-10">
          {/* Card top */}
          <div className="mb-7 flex items-center justify-between gap-3">
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-white/65 sm:text-base">
              2A Kit Access Card
            </div>

            <Badge
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm ${
                isFullAccess
                  ? 'bg-emerald-500 text-white hover:bg-emerald-500'
                  : 'bg-blue-500 text-white hover:bg-blue-500'
              }`}
            >
              {isFullAccess ? (
                <Zap className="mr-1 h-3 w-3" />
              ) : (
                <ShieldCheck className="mr-1 h-3 w-3" />
              )}
              {isFullAccess ? 'Full Kit Access' : 'Limited Access'}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-white/50">Name</p>
              <p className="mt-1 truncate text-lg font-semibold text-white">
                {personName || 'Trusted Person'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-white/50">Access Type</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {accessLevel || 'Not provided'}
              </p>
            </div>

            {/* Master Password with eye icon */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-white/50">
                  Master Password
                </p>
              </div>

              <div className="mt-1 flex min-w-0 items-center gap-2">
                <KeyRound className="hidden h-5 w-5 shrink-0 text-white/45 sm:block" />

                <code className="min-w-0 break-all font-mono text-xl font-black tracking-[0.16em] text-white sm:text-2xl">
                  {visiblePassword}
                </code>
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={
                    showPassword
                      ? 'Hide master password'
                      : 'Show master password'
                  }
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/70 backdrop-blur transition hover:bg-white/[0.14] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom meta */}
          <div className="mt-7 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-2">
            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                Relationship
              </p>
              <p className="mt-1 truncate text-xs font-medium text-white/80">
                {relationship || 'Not provided'}
              </p>
            </div>

            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">
                Card Location
              </p>
              <p className="mt-1 truncate text-xs font-medium text-white/80">
                {card_storage_location || 'Not provided'}
              </p>
            </div>
          </div>

          {!isFullAccess && safeSections.length > 0 && (
            <div className="mt-3 flex max-h-16 flex-wrap gap-1.5 overflow-y-auto">
              {safeSections.slice(0, 4).map(section => (
                <span
                  key={section}
                  className="max-w-full truncate rounded-full border border-white/10 bg-white/[0.07] px-2 py-1 text-[10px] font-medium text-white/65"
                >
                  {section}
                </span>
              ))}

              {safeSections.length > 4 && (
                <span className="rounded-full border border-white/10 bg-white/[0.07] px-2 py-1 text-[10px] font-medium text-white/65">
                  +{safeSections.length - 4} more
                </span>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2 text-[11px] leading-5 text-white/55">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              Keep this card in a safe place. Do not share the password with
              others.
            </p>
          </div>
        </div>
      </div>

      {/* Small security note */}
      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-950">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-5">
            Tell the trusted person where this card is stored, not the password
            itself.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button onClick={handleDownload} className="h-10 rounded-2xl text-sm">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>

        <Button
          onClick={handlePrint}
          variant="outline"
          className="h-10 rounded-2xl text-sm"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
    </div>
  );
}