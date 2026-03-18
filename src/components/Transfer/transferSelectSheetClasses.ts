/**
 * Bottom sheet shell shared by TransferSelectModal (mobile) and BusinessPayBottomSheet (all breakpoints).
 * Edge insets are max-sm only so sm:center rules are not overridden by left-2 (which caused desktop drift).
 * TransferSelectModal adds DESKTOP_MODAL_CLASSES on sm+; business sheet uses BUSINESS_PAY_BOTTOM_SHEET_SHELL.
 */
export const BOTTOM_SHEET_EDGE_CLASSES =
  "fixed max-sm:left-2 max-sm:right-2 max-sm:bottom-2 max-sm:top-auto max-sm:w-[calc(100%-1rem)] max-sm:max-w-none max-sm:translate-x-0 translate-y-0";

/** Mobile-only enter/exit motion (do not apply on sm+ with centered bottom sheets). */
export const BOTTOM_SHEET_MOBILE_SLIDE_CLASSES =
  "max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:slide-out-to-bottom";

/**
 * Same inset as Transfer token sheet on mobile — used for business pay on **all** viewports
 * (full-width strip at bottom, not a centered column).
 */
export const BUSINESS_PAY_BOTTOM_SHEET_SHELL =
  "fixed left-2 right-2 bottom-2 top-auto w-[calc(100%-1rem)] max-w-none translate-x-0 translate-y-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom";
