'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { NOK_ACCESS_PUBLIC_COPY } from '@/data/howNextOfKinAccessWorks';

export default function HowNextOfKinAccessWorksPublicView() {
  const copy = NOK_ACCESS_PUBLIC_COPY;

  return (
    <div className="min-h-[100dvh] bg-[#F6F8FA]">
      <header className="border-b border-[#E4EAF0] bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size={36} className="h-9 w-9" />
            <span className="text-sm font-semibold text-[#213D59]">
              Orderly Affairs
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="m-0 font-['IBM_Plex_Mono',monospace] text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#5a6b80]">
          Trust &amp; Security
        </p>
        <h1 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-[#213D59] max-md:text-[22px]">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm text-[#7A8794]">
          Last updated {copy.lastUpdated}
        </p>

        <div className="mt-8 space-y-10">
          {copy.sections.map(section => (
            <section key={section.id} id={section.id}>
              <h2 className="text-[20px] font-bold text-[#213D59] max-md:text-[17px]">
                {section.title}
              </h2>
              {section.intro ? (
                <p className="mt-3 text-[16.5px] leading-[1.75] text-[#3c4e63] max-md:text-[16px]">
                  {section.intro}
                </p>
              ) : null}
              {section.paragraphs?.map(paragraph => (
                <p
                  key={paragraph.slice(0, 48)}
                  className="mt-3 text-[16.5px] leading-[1.75] text-[#3c4e63] max-md:text-[16px]"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets?.map(bullet => (
                <div key={bullet.title} className="mt-4">
                  <p className="text-[16.5px] font-semibold leading-[1.6] text-[#213D59]">
                    {bullet.title}
                  </p>
                  <p className="mt-1 text-[16.5px] leading-[1.75] text-[#3c4e63] max-md:text-[16px]">
                    {bullet.body}
                  </p>
                </div>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-12 text-sm text-[#7A8794]">
          Questions?{' '}
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
