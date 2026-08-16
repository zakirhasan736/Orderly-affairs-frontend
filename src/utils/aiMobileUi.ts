/** Shared Tailwind class groups for AI upload / routing mobile UX */

export const AI_MOBILE_DIALOG_SHEET =
  'max-h-[min(92dvh,100svh)] overflow-y-auto overscroll-contain rounded-t-[28px] border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:max-h-none md:rounded-2xl md:border-b md:p-6 fixed bottom-0 top-auto left-[50%] max-w-[100vw] translate-x-[-50%] translate-y-0 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 md:bottom-auto md:top-[50%] md:max-w-lg md:translate-y-[-50%] md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=closed]:slide-out-to-bottom-0';

/** Wider routing / multi-section dialogs — mobile bottom sheet, roomy desktop modal */
export const AI_ROUTING_DIALOG_SHEET =
  'max-h-[min(92dvh,100svh)] gap-5 overflow-y-auto overscroll-contain rounded-t-[28px] border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:max-h-[min(90dvh,820px)] md:rounded-2xl md:border-b md:p-6 md:pb-6 fixed bottom-0 top-auto left-[50%] w-[calc(100%-1rem)] max-w-[100vw] translate-x-[-50%] translate-y-0 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 md:bottom-auto md:top-[50%] md:w-full md:max-w-xl lg:max-w-2xl md:translate-y-[-50%] md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=closed]:slide-out-to-bottom-0';

/** Review & fill: stacked preview then fields, capped at 720px. */
export const AI_REVIEW_FILL_DIALOG_SHEET =
  'flex min-w-0 h-[min(96dvh,100svh)] max-h-[min(96dvh,100svh)] w-[calc(100%-0.5rem)] max-w-[720px] flex-col gap-0 overflow-hidden overscroll-contain rounded-t-[22px] border-b-0 p-0 pb-[env(safe-area-inset-bottom)] fixed bottom-0 top-auto left-[50%] z-[100] translate-x-[-50%] translate-y-0 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 sm:w-[min(calc(100%-1rem),720px)] sm:max-w-[720px] md:h-[min(90dvh,880px)] md:max-h-[min(90dvh,880px)] md:bottom-auto md:top-[50%] md:w-[min(calc(100%-2rem),720px)] md:max-w-[720px] md:rounded-[16px] md:border-b md:pb-0 md:translate-y-[-50%] md:data-[state=open]:slide-in-from-bottom-0 md:data-[state=closed]:slide-out-to-bottom-0';

export const AI_REVIEW_FILL_FOOTER =
  '!flex !flex-row flex-wrap items-center justify-end gap-2 border-t border-[#E4EAF0] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5';

export const AI_REVIEW_FILL_BUTTON =
  'h-11 w-auto max-w-full flex-none shrink-0 self-center rounded-2xl px-5 text-[14px] font-semibold';

export const AI_REVIEW_DOC_PANE =
  'h-[min(34dvh,220px)] w-full sm:h-[min(36dvh,240px)] md:h-[min(38dvh,260px)]';

export const AI_REVIEW_TWO_PANE =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain grid grid-cols-1 grid-flow-row auto-rows-min';

export const AI_MOBILE_ACTION_BUTTON =
  'min-h-12 w-full rounded-2xl text-[15px] font-semibold touch-manipulation sm:min-h-9 sm:w-auto sm:rounded-xl sm:text-sm sm:font-medium';

export const AI_MOBILE_DROP_ZONE =
  'min-h-[7.5rem] touch-manipulation active:scale-[0.985] transition-transform sm:min-h-0 sm:active:scale-100';

export const AI_MOBILE_CHIP_ROW =
  'flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden';

export const AI_MOBILE_FLOATING_STACK =
  'pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[85] flex flex-col gap-2.5 sm:inset-x-auto sm:right-4 sm:bottom-auto sm:top-24 sm:w-[min(100%,22rem)]';

export const AI_MOBILE_GUIDED_CALLOUT =
  'pointer-events-none fixed inset-x-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.5rem)] z-[90] sm:inset-x-0 sm:bottom-auto sm:top-28 sm:flex sm:justify-center sm:px-4';
