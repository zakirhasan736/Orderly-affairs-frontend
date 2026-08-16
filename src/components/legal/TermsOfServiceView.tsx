'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Download,
  Printer,
  Shield,
  AlertCircle,
  Clock3,
} from 'lucide-react';
import { BRAND_LOGO } from '@/constants/brand';
import {
  TOS_META,
  TOS_NAV,
  TOS_SHORT_VERSION,
} from '@/data/termsOfService';
import { cn } from '@/components/common/ui/utils';

function MonoLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "m-0 font-['IBM_Plex_Mono',monospace] text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#5a6b80]",
        className,
      )}
    >
      {children}
    </p>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="m-0 scroll-mt-6 text-[22px] font-bold text-[#213d59] max-md:scroll-mt-4 max-md:text-[17px]"
    >
      {children}
    </h2>
  );
}

function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'm-0 mt-3 text-[16.5px] leading-[1.75] text-[#3c4e63] text-pretty max-md:text-[16px] max-md:leading-[1.7]',
        className,
      )}
    >
      {children}
    </p>
  );
}

function LegalBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3.5 rounded-xl border-2 border-[#213d59] bg-white px-[22px] py-5">
      {children}
    </div>
  );
}

function ShortVersionIcon({ tone }: { tone: 'green' | 'amber' | 'blue' }) {
  const styles = {
    green: 'bg-[#e2f0eb] text-[#2c7a63]',
    amber: 'bg-[#fff2d9] text-[#9a7326]',
    blue: 'bg-[#dde6f1] text-[#2E7FAD]',
  } as const;
  const Icon = tone === 'green' ? Shield : tone === 'amber' ? AlertCircle : Clock3;
  return (
    <span
      className={cn(
        'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]',
        styles[tone],
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </span>
  );
}

export default function TermsOfServiceView() {
  const [activeId, setActiveId] = useState('tos-1');
  const [openMobile, setOpenMobile] = useState<Record<string, boolean>>({
    'tos-1': true,
    'tos-3': true,
  });

  useEffect(() => {
    const nodes = TOS_NAV.map(s => document.getElementById(s.id)).filter(
      (n): n is HTMLElement => Boolean(n),
    );
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.25, 0.5] },
    );
    nodes.forEach(n => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  const toggleMobile = (id: string) => {
    setOpenMobile(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    window.print();
  };

  const toc = useMemo(() => TOS_NAV, []);

  return (
    <div className="tos-page min-h-screen bg-[#F6F8FA] text-[#213d59]">
      {/* Desktop header */}
      <header className="bg-[#213d59] text-white max-md:hidden">
        <div className="mx-auto flex h-[58px] max-w-[1440px] items-center gap-3.5 border-b border-white/14 px-10">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/14">
            <Image
              src={BRAND_LOGO}
              alt="Orderly Affairs"
              width={20}
              height={20}
              className="h-[74%] w-[74%] object-contain brightness-0 invert"
            />
          </div>
          <span className="text-[15px] font-semibold">Orderly Affairs</span>
          <Link
            href="/"
            className="ml-3.5 flex h-9 items-center gap-2 rounded-[10px] px-[13px] text-[13.5px] text-white/88 no-underline hover:bg-white/10"
          >
            <ChevronLeft className="h-[15px] w-[15px]" />
            Back
          </Link>
        </div>
        <div className="mx-auto max-w-[1440px] px-10 pb-8 pt-[34px]">
          <div className="max-w-[820px]">
            <p className="m-0 font-['IBM_Plex_Mono',monospace] text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/72">
              {TOS_META.code}
            </p>
            <h1 className="mt-2.5 text-[38px] font-bold leading-[1.15] tracking-[-0.01em]">
              {TOS_META.title}
            </h1>
            <p className="mt-3 text-[16.5px] leading-[1.65] text-white/82 text-pretty">
              {TOS_META.subtitle}
            </p>
            <div className="mt-[22px] flex flex-wrap gap-2.5">
              <span className="flex h-[34px] items-center gap-2 rounded-lg bg-white/13 px-[13px] text-[13.5px]">
                Last updated{' '}
                <strong className="font-semibold">{TOS_META.lastUpdatedLabel}</strong>
              </span>
              <span className="flex h-[34px] items-center rounded-lg bg-white/13 px-[13px] text-[13.5px]">
                Version {TOS_META.version}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile header */}
      <header className="bg-[#213d59] px-[18px] pb-[22px] pt-3.5 text-white md:hidden">
        <div className="flex min-h-11 items-center gap-3">
          <Link href="/" aria-label="Back" className="text-white">
            <ChevronLeft className="h-[22px] w-[22px]" strokeWidth={2} />
          </Link>
          <span className="text-base font-semibold">Legal</span>
          <button
            type="button"
            onClick={handlePrint}
            className="ml-auto flex h-11 w-11 items-center justify-center"
            aria-label="Download or print"
          >
            <Download className="h-[21px] w-[21px]" strokeWidth={1.9} />
          </button>
        </div>
        <h1 className="mt-3.5 text-[27px] font-bold leading-[1.2]">{TOS_META.title}</h1>
        <p className="mt-2 text-[15.5px] leading-[1.6] text-white/82">
          {TOS_META.mobileSubtitle}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="flex min-h-8 items-center rounded-lg bg-white/13 px-[11px] text-[13px]">
            Updated {TOS_META.lastUpdatedShort}
          </span>
          <span className="flex min-h-8 items-center rounded-lg bg-white/13 px-[11px] text-[13px]">
            Version {TOS_META.version}
          </span>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] items-start gap-14 px-10 pt-9 max-md:block max-md:px-[18px] max-md:pt-[18px] max-md:pb-6">
        {/* Desktop TOC */}
        <aside className="sticky top-5 flex w-[272px] shrink-0 flex-col overflow-y-auto max-h-[calc(100vh-40px)] max-md:hidden print:hidden">
          <MonoLabel className="mb-3">On this page</MonoLabel>
          <nav className="flex flex-col gap-px border-l-2 border-[#dbe3ed]">
            {toc.map(item => {
              const active = activeId === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={cn(
                    'ml-[-2px] flex min-h-[34px] items-center gap-2.5 border-l-2 py-1.5 pl-3 pr-2 text-sm no-underline',
                    active
                      ? 'border-[#213d59] font-semibold text-[#213d59]'
                      : 'border-transparent text-[#3c4e63]',
                  )}
                >
                  <span
                    className={cn(
                      "w-4 font-['IBM_Plex_Mono',monospace] text-xs font-semibold",
                      active ? 'text-[#5a6b80]' : 'text-[#8a97a8]',
                    )}
                  >
                    {item.number}
                  </span>
                  {item.navLabel}
                </a>
              );
            })}
          </nav>
          <div className="mt-[22px] flex flex-col gap-2 border-t border-[#dbe3ed] pt-5">
            <button
              type="button"
              onClick={handlePrint}
              className="flex min-h-11 items-center gap-2.5 rounded-[10px] border border-[#7688a1] bg-white px-3.5 text-[14.5px] font-semibold text-[#213d59]"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex min-h-11 items-center gap-2.5 rounded-[10px] border border-[#7688a1] bg-white px-3.5 text-[14.5px] font-semibold text-[#213d59]"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 max-w-[760px] pb-10 max-md:max-w-none max-md:pb-0">
          {/* Short version — desktop */}
          <div className="rounded-[14px] border border-[#dbe3ed] bg-white px-7 pb-6 pt-[26px] max-md:hidden">
            <MonoLabel>The short version</MonoLabel>
            <p className="mb-[18px] mt-2.5 text-[15px] leading-[1.6] text-[#5a6b80]">
              A plain-language summary, for orientation only. The numbered sections below are
              the agreement.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {TOS_SHORT_VERSION.map(item => (
                <div key={item.title} className="flex gap-3">
                  <ShortVersionIcon tone={item.tone} />
                  <p className="m-0 text-[15.5px] leading-[1.55] text-[#213d59]">
                    <strong className="font-bold">{item.title}</strong> {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Short version — mobile */}
          <div className="mb-[18px] rounded-[14px] border border-[#dbe3ed] bg-white p-[18px] md:hidden">
            <MonoLabel className="text-[11px]">The short version</MonoLabel>
            <div className="mt-3 grid gap-[13px]">
              {TOS_SHORT_VERSION.map(item => (
                <p key={item.title} className="m-0 text-base leading-[1.55] text-[#213d59]">
                  <strong className="font-bold">{item.title}</strong>{' '}
                  {item.title === 'Cancel any time.'
                    ? 'before the next billing cycle starts.'
                    : item.title === 'Release takes proof.'
                      ? 'from your next of kin.'
                      : item.title === 'Your files stay yours.'
                        ? 'We host them only to run your vault.'
                        : 'The vault does not replace a will or power of attorney.'}
                </p>
              ))}
            </div>
            <p className="mb-0 mt-3.5 text-[13.5px] leading-[1.55] text-[#5a6b80]">
              A summary for orientation. The sections below are the agreement.
            </p>
          </div>

          {/* Desktop article body */}
          <article className="max-md:hidden">
            <DesktopSections />
          </article>

          {/* Mobile accordion */}
          <div className="overflow-hidden rounded-[14px] border border-[#dbe3ed] bg-white md:hidden">
            {TOS_NAV.map((item, index) => {
              const open = Boolean(openMobile[item.id]);
              const isLast = index === TOS_NAV.length - 1;
              return (
                <div
                  key={item.id}
                  className={cn(!isLast && 'border-b border-[#edf1f6]')}
                >
                  <button
                    type="button"
                    onClick={() => toggleMobile(item.id)}
                    className="flex w-full items-center gap-3 px-[18px] py-1.5 text-left min-h-14"
                  >
                    <span className="w-5 shrink-0 font-['IBM_Plex_Mono',monospace] text-xs font-semibold text-[#5a6b80]">
                      {item.number}
                    </span>
                    <span
                      className={cn(
                        'flex-1 text-[16.5px] text-[#213d59]',
                        open && 'text-[17px] font-bold',
                      )}
                    >
                      {item.navLabel.charAt(0).toUpperCase() + item.navLabel.slice(1)}
                    </span>
                    {open ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-[#5a6b80]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-[#5a6b80]" />
                    )}
                  </button>
                  {open ? (
                    <div className="px-[18px] pb-[18px]" id={item.id}>
                      <MobileSectionBody id={item.id} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Mobile contact card */}
          <div className="mt-[18px] rounded-[14px] bg-[#213d59] p-5 text-white md:hidden">
            <p className="m-0 text-[16.5px] font-bold">{TOS_META.company}</p>
            <p className="mt-1.5 mb-0 text-[15px] leading-[1.6] text-white/82">
              {TOS_META.addressLines[0]}
              <br />
              {TOS_META.addressLines[1]}
              <br />
              {TOS_META.supportEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop footer */}
      <footer className="sticky bottom-0 z-10 flex items-center gap-[18px] border-t border-[#7688a1] bg-white px-10 py-4 shadow-[0_-2px_12px_rgba(33,61,89,.08)] max-md:hidden print:static print:shadow-none">
        <p className="m-0 flex-1 text-[15.5px] leading-[1.5] text-[#213d59]">
          By creating an account you agree to version{' '}
          <strong className="font-bold">{TOS_META.version}</strong> (updated{' '}
          {TOS_META.lastUpdatedLabel}).
        </p>
        <button
          type="button"
          onClick={handlePrint}
          className="flex min-h-11 items-center rounded-[10px] border border-[#7688a1] bg-white px-[18px] text-[15px] font-semibold text-[#213d59]"
        >
          Download a copy
        </button>
        <Link
          href="/"
          className="flex min-h-11 items-center rounded-[10px] bg-[#213d59] px-5 text-[15px] font-semibold text-white no-underline"
        >
          Back to signup
        </Link>
      </footer>

      {/* Mobile footer */}
      <div className="border-t border-[#7688a1] bg-white px-[18px] pb-[22px] pt-3.5 md:hidden print:hidden">
        <p className="mb-3 mt-0 text-[14.5px] leading-[1.5] text-[#3c4e63]">
          Version <strong className="font-bold text-[#213d59]">{TOS_META.version}</strong> ·
          updated {TOS_META.lastUpdatedShort}.
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="flex min-h-[50px] flex-1 items-center justify-center rounded-xl border border-[#7688a1] text-[15.5px] font-semibold text-[#213d59]"
          >
            Download
          </button>
          <Link
            href="/"
            className="flex min-h-[50px] flex-1 items-center justify-center rounded-xl bg-[#213d59] text-[15.5px] font-semibold text-white no-underline"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}

function DesktopSections() {
  return (
    <>
      <div className="mt-[38px]">
        <SectionHeading id="tos-1">1. Acceptance of Terms</SectionHeading>
        <Body>
          These Terms of Service (“Terms”) form a binding agreement between you (“User,” “you”)
          and Orderly Affairs Digital, LLC, a Texas limited liability company (“Orderly Affairs,”
          “Company,” “we,” “us”) governing your access to and use of the Orderly Affairs website,
          web application, and mobile application (collectively, the “Service”). By creating an
          account or otherwise using the Service, you agree to these Terms and to our Privacy
          Policy, which is incorporated by reference. If you do not agree, do not use the Service.
        </Body>
        <Body>
          You must be at least 18 years old and capable of forming a binding contract to use the
          Service.
        </Body>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-2">2. Description of the Service</SectionHeading>
        <Body>
          The Service is a digital organizer that helps individuals and families collect, store,
          and organize information related to family affairs, personal records, and estate planning
          — for example contacts, account inventories, document storage, and instructions for
          family members or designated contacts. The Service is a record-keeping and organizational
          tool. It is not a law firm, financial institution, insurance provider, or fiduciary.
        </Body>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-3">3. Not Legal, Financial, or Tax Advice</SectionHeading>
        <div className="mt-4 flex gap-[13px] rounded-xl border border-[#9a7326] bg-[#fff6e6] px-5 py-[18px]">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#9a7326]" strokeWidth={2} />
          <p className="m-0 text-[16.5px] leading-[1.7] text-[#6b4f14] text-pretty">
            <strong className="font-bold">Read this one carefully.</strong> Orderly Affairs stores
            and organizes what you give it. It does not generate, draft, or prepare wills, powers
            of attorney, trusts, or any other legally operative document.
          </p>
        </div>
        <Body>
          We are not attorneys, and Orderly Affairs is not a law firm. Nothing in the Service
          constitutes legal, tax, financial, or investment advice, and no attorney-client,
          fiduciary, or advisory relationship is created by your use of the Service. Information,
          templates, or checklists provided through the Service are for general organizational
          purposes only.
        </Body>
        <Body>
          You must consult a licensed attorney, tax advisor, or financial professional in your
          jurisdiction before making any legal, tax, or estate-planning decisions, including
          decisions about the validity, execution, or enforceability of any document you store or
          organize using the Service. Laws governing wills, trusts, powers of attorney, and
          beneficiary designations vary by state and country and change over time; we do not
          warrant that any information in the Service is current, complete, or valid in your
          jurisdiction.
        </Body>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-4">4. Accounts and Eligibility</SectionHeading>
        <Body>
          You are responsible for providing accurate registration information and for maintaining
          the confidentiality of your login credentials. You are responsible for all activity that
          occurs under your account, whether or not authorized by you, except to the extent caused
          by our gross negligence or willful misconduct. Notify us immediately at{' '}
          <a href={`mailto:${TOS_META.supportEmail}`} className="font-semibold text-[#2E7FAD]">
            {TOS_META.supportEmail}
          </a>{' '}
          if you suspect unauthorized access to your account.
        </Body>
        <Body>
          You may designate one or more additional individuals — for example a spouse, executor, or
          “legacy contact” — to access some or all of your information under circumstances you
          configure, such as your death or incapacity, subject to our verification process then in
          effect. You are solely responsible for the accuracy of any such designation and for
          ensuring it complies with applicable law. The Service is not a substitute for a validly
          executed will, trust, power of attorney, or beneficiary designation.
        </Body>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-5">5. Subscription, Fees, and Billing</SectionHeading>
        <Body>
          The Service is offered on a subscription basis, billed either monthly or annually
          depending on the plan you select. Subscriptions automatically renew at the end of each
          billing cycle unless canceled in accordance with this section. If we change our prices,
          we will communicate the change to you before it takes effect on your next billing cycle.
          All fees are non-refundable, except where required by applicable law.
        </Body>
        <Body>
          You may cancel your subscription at any time through the Service; cancellation must be
          submitted before the start of your next billing cycle to avoid being charged for that
          cycle. Cancellation takes effect at the end of the then-current billing cycle, and you
          will retain access to the Service through that date.
        </Body>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-6">6. Your Content</SectionHeading>
        <Body>
          “User Content” means any information, documents, or files you upload or enter into the
          Service. As between you and Orderly Affairs, you retain all ownership rights in your User
          Content. You grant Orderly Affairs a limited, non-exclusive, worldwide license to host,
          store, back up, and display your User Content solely as necessary to operate, maintain,
          and provide the Service to you and to anyone you authorize to access it. This license
          ends when you delete the relevant content or close your account, subject to standard
          backup-purge timelines and any retention required by law.
        </Body>
        <Body>
          You represent that you have the right to submit your User Content and that doing so does
          not violate the rights of any third party.
        </Body>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-7">7. Intellectual Property in the Service</SectionHeading>
        <Body>
          The Service, including its software, design, text, graphics, and trademarks (excluding
          User Content), is owned by Orderly Affairs or its licensors and is protected by
          intellectual property laws. We grant you a limited, revocable, non-transferable license
          to use the Service for your personal, non-commercial use in accordance with these Terms.
          You may not copy, reverse-engineer, resell, or create derivative works from the Service
          itself.
        </Body>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-8">8. Acceptable Use</SectionHeading>
        <Body className="mb-0">You agree not to:</Body>
        <div className="mt-3 grid gap-2.5">
          {[
            'use the Service for any unlawful purpose;',
            'attempt to gain unauthorized access to the Service, other accounts, or our systems;',
            'upload malicious code;',
            'scrape or bulk-extract data from the Service;',
            'misrepresent your identity or authority to act on behalf of another person; or',
            'interfere with the normal operation of the Service.',
          ].map((text, i) => (
            <div
              key={text}
              className="flex gap-[11px] text-[16.5px] leading-[1.65] text-[#3c4e63]"
            >
              <span className="w-auto shrink-0 pt-0.5 font-['IBM_Plex_Mono',monospace] text-[13px] font-semibold text-[#5a6b80]">
                ({String.fromCharCode(97 + i)})
              </span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-9">9. Third-Party Services</SectionHeading>
        <Body>
          The Service may link to or integrate with third-party services such as cloud storage,
          identity verification, or payment processors. We are not responsible for the content,
          security, or practices of third-party services, and your use of them is governed by their
          own terms.
        </Body>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-10">10. Data Security; No Guarantee</SectionHeading>
        <Body>
          We use commercially reasonable administrative, technical, and physical safeguards designed
          to protect your information, including encryption in transit and at rest. No method of
          transmission or storage is completely secure, and we cannot guarantee absolute security.
          You are responsible for keeping your credentials confidential and for the security of the
          devices you use to access the Service.
        </Body>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-11">11. Disclaimer of Warranties</SectionHeading>
        <LegalBox>
          <p className="m-0 text-[15px] font-semibold uppercase leading-[1.8] tracking-[0.005em] text-[#213d59]">
            The Service is provided “as is” and “as available,” without warranties of any kind,
            whether express, implied, or statutory, including without limitation implied warranties
            of merchantability, fitness for a particular purpose, title, non-infringement, and any
            warranty arising from course of dealing or usage of trade. We do not warrant that the
            Service will be uninterrupted, error-free, or secure, or that any data will not be lost,
            corrupted, or accessed without authorization. Some jurisdictions do not allow the
            exclusion of certain warranties, so some of the above exclusions may not apply to you.
          </p>
        </LegalBox>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-12">12. Limitation of Liability</SectionHeading>
        <LegalBox>
          <div className="flex flex-col gap-3.5">
            <p className="m-0 text-[15px] font-semibold uppercase leading-[1.8] text-[#213d59]">
              To the maximum extent permitted by applicable law, in no event will Orderly Affairs,
              its officers, directors, employees, or agents be liable for any indirect, incidental,
              special, consequential, exemplary, or punitive damages, or any loss of data, profits,
              revenue, or goodwill, arising out of or related to your use of the Service —
              including damages arising from unauthorized access to or alteration of your data —
              regardless of the legal theory asserted and even if we have been advised of the
              possibility of such damages.
            </p>
            <p className="m-0 text-[15px] font-semibold uppercase leading-[1.8] text-[#213d59]">
              To the maximum extent permitted by applicable law, our total aggregate liability to
              you for all claims arising out of or relating to the Service will not exceed the
              greater of (a) the amount you paid us in the twelve (12) months preceding the event
              giving rise to the claim, or (b) one hundred U.S. dollars ($100).
            </p>
            <p className="m-0 text-[15px] font-semibold uppercase leading-[1.8] text-[#213d59]">
              These limitations apply even if a remedy fails of its essential purpose. Nothing in
              this section limits liability that cannot be limited under applicable law, including
              liability for our own gross negligence, willful misconduct, or fraud.
            </p>
          </div>
        </LegalBox>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-13">13. Indemnification</SectionHeading>
        <Body>
          You agree to indemnify, defend, and hold harmless Orderly Affairs and its officers,
          directors, employees, and agents from any claims, damages, liabilities, costs, and
          expenses, including reasonable attorneys’ fees, arising out of: (a) your use or misuse of
          the Service; (b) your violation of these Terms; (c) your violation of any law or the
          rights of a third party; or (d) User Content you submit — except to the extent caused by
          our gross negligence or willful misconduct.
        </Body>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-14">14. Term, Suspension, and Termination</SectionHeading>
        <Body>
          We may suspend or terminate your access to the Service if you violate these Terms, pose a
          security risk, or as required by law. You may cancel your account at any time through the
          Service or by contacting us. Upon termination, your right to use the Service ends
          immediately. Provisions that by their nature should survive — including Sections 7, 10
          through 13, and 15 through 18 — will survive termination.
        </Body>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-15">
          15. Death, Incapacity, or Unavailability of the Account Holder
        </SectionHeading>
        <Body>
          The Service includes features intended to allow designated contacts to access certain
          information upon your death or incapacity, subject to whatever verification process we
          require at the time, such as a death certificate, court order, or similar documentation.
          Orderly Affairs is not responsible for verifying the legal authority of any person
          requesting access beyond the verification steps disclosed in the Service, and disclaims
          liability for good-faith reliance on documentation that later proves to be fraudulent,
          unless caused by our gross negligence or willful misconduct. This feature does not
          replace a validly executed will, trust, financial power of attorney, or healthcare
          directive, and does not have independent legal effect.
        </Body>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-16">16. Governing Law; Dispute Resolution</SectionHeading>
        <Body>
          These Terms are governed by the laws of the State of Texas, without regard to its
          conflict-of-laws principles.
        </Body>
        <h3 className="mb-0 mt-5 text-[17px] font-bold text-[#213d59]">Agreement to arbitrate</h3>
        <Body className="mt-2">
          Except for claims that may be brought in small-claims court, or claims for injunctive or
          equitable relief to protect intellectual property or confidential information, you and
          Orderly Affairs agree that any dispute, claim, or controversy arising out of or relating
          to these Terms or the Service will be resolved by binding arbitration rather than in
          court, administered by the American Arbitration Association (AAA) or JAMS under their
          respective rules for consumer or commercial arbitration then in effect. The arbitration
          will be seated in Travis County, Texas, unless you and Orderly Affairs agree otherwise.
          Judgment on the arbitration award may be entered in any court having jurisdiction.
        </Body>
        <h3 className="mb-0 mt-5 text-[17px] font-bold text-[#213d59]">Class action waiver</h3>
        <LegalBox>
          <p className="m-0 text-[15px] font-semibold uppercase leading-[1.8] text-[#213d59]">
            You and Orderly Affairs each agree that any proceeding will be conducted only on an
            individual basis and not as a class, consolidated, or representative action, and each
            party waives any right to a jury trial and to participate in a class action or class
            arbitration.
          </p>
        </LegalBox>
        <h3 className="mb-0 mt-5 text-[17px] font-bold text-[#213d59]">
          Venue for non-arbitrable disputes
        </h3>
        <Body className="mt-2">
          For any dispute not subject to arbitration under this section, the exclusive venue will
          be the state or federal courts located in Travis County, Texas, and you consent to
          personal jurisdiction there.
        </Body>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-17">17. Changes to These Terms</SectionHeading>
        <Body>
          We may modify these Terms from time to time. If we make material changes, we will provide
          notice, for example by email or in-Service notice, before the changes take effect.
          Continued use of the Service after the effective date constitutes acceptance of the
          revised Terms.
        </Body>
        <div className="mt-4 overflow-hidden rounded-xl border border-[#dbe3ed] bg-white">
          <p className="m-0 border-b border-[#dbe3ed] px-[18px] py-3.5 font-['IBM_Plex_Mono',monospace] text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#5a6b80]">
            Version history
          </p>
          <div className="flex items-center gap-3.5 border-b border-[#edf1f6] px-[18px] py-3.5">
            <span className="w-11 font-['IBM_Plex_Mono',monospace] text-[13px] font-semibold text-[#213d59]">
              v2.1
            </span>
            <span className="flex-1 text-[15.5px] text-[#3c4e63]">
              Arbitration and class-action language added
            </span>
            <span className="text-[14.5px] text-[#5a6b80]">Aug 7, 2026</span>
            <a href="#tos-16" className="text-[14.5px] font-semibold no-underline">
              See changes
            </a>
          </div>
          <div className="flex items-center gap-3.5 px-[18px] py-3.5">
            <span className="w-11 font-['IBM_Plex_Mono',monospace] text-[13px] font-semibold text-[#213d59]">
              v2.0
            </span>
            <span className="flex-1 text-[15.5px] text-[#3c4e63]">
              Next-of-kin release and verification rewritten
            </span>
            <span className="text-[14.5px] text-[#5a6b80]">Feb 1, 2026</span>
            <a href="#tos-15" className="text-[14.5px] font-semibold no-underline">
              See changes
            </a>
          </div>
        </div>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-18">18. Miscellaneous</SectionHeading>
        <div className="mt-3.5 grid gap-4">
          {[
            [
              'Entire agreement.',
              'These Terms, together with our Privacy Policy, constitute the entire agreement between you and Orderly Affairs regarding the Service.',
            ],
            [
              'Severability.',
              'If any provision is held unenforceable, the remaining provisions remain in full effect, and the unenforceable provision will be modified to the minimum extent necessary to make it enforceable.',
            ],
            [
              'No waiver.',
              'Our failure to enforce any provision is not a waiver of our right to do so later.',
            ],
            [
              'Assignment.',
              'You may not assign these Terms without our consent. We may assign these Terms in connection with a merger, acquisition, or sale of assets.',
            ],
            [
              'Force majeure.',
              'We are not liable for delays or failures caused by events beyond our reasonable control.',
            ],
            [
              'Notices.',
              'We may provide notices to you via the email address or in-Service messaging associated with your account.',
            ],
          ].map(([label, text]) => (
            <p key={label} className="m-0 text-[16.5px] leading-[1.75] text-[#3c4e63]">
              <strong className="font-bold text-[#213d59]">{label}</strong> {text}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-[34px] border-t border-[#dbe3ed] pt-[30px]">
        <SectionHeading id="tos-19">19. Contact</SectionHeading>
        <div className="mt-3.5 flex items-center gap-[26px] rounded-[14px] bg-[#213d59] px-[26px] py-6 text-white">
          <div className="flex-1">
            <p className="m-0 text-[17px] font-bold">{TOS_META.company}</p>
            <p className="mt-1.5 mb-0 text-[15.5px] leading-[1.6] text-white/82">
              {TOS_META.addressLines.join(', ')}
              <br />
              {TOS_META.supportEmail}
            </p>
          </div>
          <a
            href={`mailto:${TOS_META.supportEmail}`}
            className="flex min-h-[46px] shrink-0 items-center rounded-[10px] bg-white px-5 text-[15px] font-semibold text-[#213d59] no-underline"
          >
            Email support
          </a>
        </div>
        <p
          id="tos-priv"
          className="mb-0 mt-[22px] text-[14.5px] leading-[1.7] text-[#5a6b80] text-pretty"
        >
          These Terms work alongside the Privacy Policy, which explains what we collect and how long
          we keep it. Both are also emailed to you whenever they change.
        </p>
      </div>
    </>
  );
}

function MobileSectionBody({ id }: { id: string }) {
  if (id === 'tos-1') {
    return (
      <p className="m-0 mt-2 text-base leading-[1.7] text-[#3c4e63] text-pretty">
        These Terms form a binding agreement between you and Orderly Affairs Digital, LLC, a Texas
        limited liability company, governing the website, web app, and mobile app. By creating an
        account you agree to these Terms and to our Privacy Policy. You must be at least 18 years
        old to use the Service.
      </p>
    );
  }
  if (id === 'tos-3') {
    return (
      <>
        <div className="mt-2.5 rounded-xl border border-[#9a7326] bg-[#fff6e6] px-[15px] py-3.5">
          <p className="m-0 text-[15.5px] leading-[1.65] text-[#6b4f14]">
            <strong className="font-bold">Read this one carefully.</strong> Orderly Affairs stores
            and organizes what you give it. It does not draft wills, powers of attorney, or trusts.
          </p>
        </div>
        <p className="mb-0 mt-3 text-base leading-[1.7] text-[#3c4e63] text-pretty">
          We are not attorneys, and no attorney-client or fiduciary relationship is created by your
          use of the Service. Consult a licensed attorney or tax advisor in your jurisdiction before
          making legal, tax, or estate-planning decisions.
        </p>
      </>
    );
  }

  const desktopTitles: Record<string, string> = Object.fromEntries(
    TOS_NAV.map(s => [s.id, s.title]),
  );
  const snippets: Record<string, string> = {
    'tos-2':
      'The Service is a digital organizer for family affairs, personal records, and estate planning. It is a record-keeping tool — not a law firm, financial institution, insurance provider, or fiduciary.',
    'tos-4':
      'You must provide accurate registration information, keep credentials confidential, and are responsible for activity under your account. Notify support@orderly-affairs.com of unauthorized access.',
    'tos-5':
      'Subscriptions renew automatically unless canceled before the next billing cycle. Fees are generally non-refundable except where required by law. Cancel anytime in the Service.',
    'tos-6':
      'You retain ownership of User Content. You grant us a limited license to host and display it only as needed to run the Service for you and people you authorize.',
    'tos-7':
      'The Service software, design, and trademarks (excluding your content) are owned by Orderly Affairs. You receive a limited personal license; no reverse-engineering or resale.',
    'tos-8':
      'Do not use the Service unlawfully, attempt unauthorized access, upload malware, scrape data, misrepresent identity, or interfere with normal operation.',
    'tos-9':
      'Third-party integrations (storage, identity, payments) are governed by their own terms. We are not responsible for their content, security, or practices.',
    'tos-10':
      'We use commercially reasonable safeguards including encryption in transit and at rest, but cannot guarantee absolute security. Protect your credentials and devices.',
    'tos-11':
      'The Service is provided “as is” and “as available,” without warranties of merchantability, fitness for a particular purpose, or uninterrupted/error-free operation.',
    'tos-12':
      'To the maximum extent permitted by law, liability is limited; aggregate liability will not exceed the greater of amounts paid in the prior 12 months or $100.',
    'tos-13':
      'You agree to indemnify Orderly Affairs against claims arising from your use, Term violations, illegal acts, or User Content you submit (except our gross negligence or willful misconduct).',
    'tos-14':
      'We may suspend or terminate for Term violations or security risk. You may cancel anytime. Certain sections survive termination.',
    'tos-15':
      'Designated contacts may access information after death or incapacity subject to our verification process. This does not replace a will, trust, or power of attorney.',
    'tos-16':
      'Texas law governs. Most disputes go to binding arbitration in Travis County, Texas, on an individual basis (class actions waived).',
    'tos-17':
      'We may update these Terms with notice for material changes. Continued use after the effective date means acceptance.',
    'tos-18':
      'These Terms plus the Privacy Policy are the entire agreement. Severability, no waiver, assignment, force majeure, and notice rules apply.',
    'tos-19':
      'Orderly Affairs Digital, LLC · 5900 Balcones Drive STE 100, Austin, TX 78731 · support@orderly-affairs.com',
  };

  return (
    <p className="m-0 mt-2 text-base leading-[1.7] text-[#3c4e63] text-pretty">
      <span className="sr-only">{desktopTitles[id]}</span>
      {snippets[id] || 'See the full Terms of Service on desktop for this section.'}
    </p>
  );
}
