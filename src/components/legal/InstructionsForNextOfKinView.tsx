'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { NOK_INSTRUCTIONS } from '@/data/instructionsForNextOfKin';
import { cn } from '@common/ui/utils';

function ArticleBody({ className }: { className?: string }) {
  const copy = NOK_INSTRUCTIONS;
  return (
    <div className={cn('space-y-8', className)}>
      {copy.sections.map(section => (
        <section key={section.id} id={section.id}>
          <h2 className="text-[20px] font-bold text-[#213D59] max-md:text-[17px]">
            {section.title}
          </h2>
          {section.paragraphs.map(paragraph => (
            <p
              key={paragraph.slice(0, 48)}
              className="mt-3 text-[16.5px] leading-[1.75] text-[#3c4e63] max-md:text-[16px]"
            >
              {paragraph}
            </p>
          ))}
          {'subsections' in section && section.subsections
            ? section.subsections.map(sub => (
                <div key={sub.title} className="mt-5">
                  <h3 className="text-[16.5px] font-semibold text-[#213D59]">
                    {sub.title}
                  </h3>
                  {sub.paragraphs.map(paragraph => (
                    <p
                      key={paragraph.slice(0, 48)}
                      className="mt-2 text-[16.5px] leading-[1.75] text-[#3c4e63] max-md:text-[16px]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ))
            : null}
        </section>
      ))}
    </div>
  );
}

export default function InstructionsForNextOfKinPageView() {
  const copy = NOK_INSTRUCTIONS;
  return (
    <div className="min-h-[100dvh] bg-[#F6F8FA]">
      <header className="border-b border-[#E4EAF0] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size={36} className="h-9 w-9" />
            <span className="text-sm font-semibold text-[#213D59]">
              Orderly Affairs
            </span>
          </Link>
          <Link
            href="/next-kin"
            className="text-sm font-semibold text-[#2E7FAD] hover:underline"
          >
            Next of kin sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="m-0 font-['IBM_Plex_Mono',monospace] text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#5a6b80]">
          For next of kin
        </p>
        <h1 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-[#213D59] max-md:text-[22px]">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-[#7A8794]">
          {copy.subtitle} · Last updated {copy.lastUpdated}
        </p>
        <p className="mt-6 text-[16.5px] leading-[1.75] text-[#3c4e63] max-md:text-[16px]">
          {copy.intro}
        </p>
        <div className="mt-10">
          <ArticleBody />
        </div>
        <p className="mt-12 text-sm text-[#7A8794]">
          Ready to open the vault?{' '}
          <Link
            href="/next-kin"
            className="font-semibold text-[#213D59] underline"
          >
            Sign in as next of kin
          </Link>
          . Questions?{' '}
          <a
            className="font-semibold text-[#213D59] underline"
            href="mailto:support@orderly-affairs.com"
          >
            support@orderly-affairs.com
          </a>
        </p>
      </main>
    </div>
  );
}

export function InstructionsForNextOfKinOwnerPanel({
  className,
}: {
  className?: string;
}) {
  const copy = NOK_INSTRUCTIONS;
  return (
    <article
      id="subsection-2D"
      className={cn(
        'rounded-2xl border bg-white p-4 sm:rounded-[16px] sm:p-5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#213D59] text-white">
          <BookOpen className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#213D59]">
            {copy.title}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[#7A8794]">
            {copy.subtitle} · {copy.company} · Last updated {copy.lastUpdated}
          </p>
        </div>
      </div>
      <p className="mt-4 text-[13.5px] leading-6 text-[#414A55]">{copy.intro}</p>
      <div className="mt-5 [&_h2]:text-[14px] [&_h2]:font-semibold [&_h3]:text-[13.5px] [&_p]:text-[13.5px] [&_p]:leading-6 [&_p]:text-[#414A55]">
        <ArticleBody className="space-y-5" />
      </div>
    </article>
  );
}
