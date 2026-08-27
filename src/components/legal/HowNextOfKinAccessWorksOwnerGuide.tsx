'use client';

import { BookOpen } from 'lucide-react';
import { NOK_ACCESS_OWNER_GUIDE } from '@/data/howNextOfKinAccessWorks';
import { cn } from '@common/ui/utils';

export function HowNextOfKinAccessWorksOwnerGuide({
  className,
}: {
  className?: string;
}) {
  const g = NOK_ACCESS_OWNER_GUIDE;

  return (
    <article
      id="subsection-2C"
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
            {g.title}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[#7A8794]">
            {g.subtitle} · {g.company} · Last updated {g.lastUpdated}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-5 text-[13.5px] leading-6 text-[#414A55]">
        <p>{g.intro}</p>

        <section>
          <h3 className="text-[14px] font-semibold text-[#213D59]">
            The short version
          </h3>
          <p className="mt-2">{g.shortVersion}</p>
        </section>

        <section>
          <h3 className="text-[14px] font-semibold text-[#213D59]">
            What can start the process
          </h3>
          <p className="mt-2">
            There are three ways the process can begin. All three feed into the
            same checks below, so it doesn&apos;t matter which one happens first.
          </p>
          <ol className="mt-3 space-y-3">
            {g.startPaths.map((path, index) => (
              <li key={path.title}>
                <p className="font-semibold text-[#213D59]">
                  {index + 1}. {path.title}
                </p>
                <p className="mt-1">{path.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="text-[14px] font-semibold text-[#213D59]">
            What happens once the process starts
          </h3>
          <p className="mt-2">
            Every path runs through the same six checks before anything is
            released.
          </p>
          <ol className="mt-3 list-decimal space-y-2.5 pl-5">
            {g.onceStarted.map(item => (
              <li key={item.slice(0, 40)}>{item}</li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="text-[14px] font-semibold text-[#213D59]">
            Once they are in the Vault
          </h3>
          <ul className="mt-3 list-disc space-y-2.5 pl-5">
            {g.afterTheyAreIn.map(item => (
              <li key={item.slice(0, 40)}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-[14px] font-semibold text-[#213D59]">
            What you need to do now
          </h3>
          <ul className="mt-3 list-disc space-y-2.5 pl-5">
            {g.whatToDoNow.map(item => (
              <li key={item.slice(0, 40)}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-[14px] font-semibold text-[#213D59]">
            What this isn&apos;t
          </h3>
          <p className="mt-2">{g.whatThisIsnt}</p>
        </section>

        <section>
          <h3 className="text-[14px] font-semibold text-[#213D59]">Questions</h3>
          <p className="mt-2">{g.questions}</p>
          <p className="mt-2">
            Your next of kin also has a matching guide:{' '}
            <a
              href="/instructions-for-next-of-kin"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#213D59] underline"
            >
              Instructions for Your Next of Kin
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
