/** Shared Tailwind class groups for AI upload / routing mobile UX */

export const AI_MOBILE_DIALOG_SHEET =
  'max-h-[min(92dvh,720px)] overflow-y-auto overscroll-contain rounded-t-[28px] border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-h-none sm:rounded-2xl sm:border-b sm:p-6 fixed bottom-0 top-auto left-[50%] max-w-[100vw] translate-x-[-50%] translate-y-0 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 sm:bottom-auto sm:top-[50%] sm:max-w-lg sm:translate-y-[-50%] sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0';

/** Wider routing / multi-section dialogs — mobile bottom sheet, roomy desktop modal */
export const AI_ROUTING_DIALOG_SHEET =
  'max-h-[min(92dvh,800px)] gap-5 overflow-y-auto overscroll-contain rounded-t-[28px] border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-h-[min(90vh,820px)] sm:rounded-2xl sm:border-b sm:p-6 sm:pb-6 fixed bottom-0 top-auto left-[50%] w-[calc(100%-1rem)] max-w-[100vw] translate-x-[-50%] translate-y-0 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4 sm:bottom-auto sm:top-[50%] sm:w-full sm:max-w-xl md:max-w-2xl sm:translate-y-[-50%] sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0';

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
