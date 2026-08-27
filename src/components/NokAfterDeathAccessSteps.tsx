'use client';

import { NOK_AFTER_DEATH_ACCESS_STEPS } from '@/data/nokAfterDeathAccessSteps';

export function NokAfterDeathAccessSteps({
  heading = 'After you pass away, next of kin will:',
}: {
  heading?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E4EAF0] bg-[#F6F8FA] px-4 py-4 text-[#213D59]">
      <p className="text-[13px] font-semibold tracking-tight">{heading}</p>
      <p className="mt-1 text-[12.5px] leading-5 text-[#5c6b66]">
        There is no printed password card. Access is released only after
        verification — they set their own password.
      </p>
      <ol className="mt-3 space-y-3">
        {NOK_AFTER_DEATH_ACCESS_STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#213D59] text-[11px] font-bold text-white">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">{step.title}</p>
              <p className="mt-0.5 text-[12.5px] leading-5 text-[#3c4a46]">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
