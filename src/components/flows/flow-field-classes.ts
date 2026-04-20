/**
 * Shared layout + control styles for Pay / Receive / Transfer flow fields
 * (token pickers, amounts, identifiers, “on this account”, etc.).
 */

export const FLOW_FIELD_SHELL =
  "rounded-xl border border-border bg-white dark:bg-primary/40 p-3 px-4";

export const FLOW_FIELD_LABEL_TEXT =
  "text-xs font-medium text-card-foreground/70";

export const FLOW_FIELD_LABEL = `mb-2 ${FLOW_FIELD_LABEL_TEXT}`;

/** Control row height: matches h-12 across token triggers and inputs */
export const FLOW_CONTROL_MIN_H = "min-h-12";

/**
 * Text inputs: no horizontal padding, no hover fill, consistent min height.
 * Use with `cn()` after any per-field overrides (e.g. font-mono).
 */
export const FLOW_INPUT_BASE =
  "w-full min-w-0 border-0 px-0 py-0 shadow-none outline-none transition-none hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0";

export const FLOW_INPUT_TEXT =
  `${FLOW_INPUT_BASE} text-xl font-medium text-card-foreground placeholder:text-muted-foreground`;

export const FLOW_INPUT_MONO =
  `${FLOW_INPUT_BASE} font-mono text-base font-medium leading-normal text-card-foreground placeholder:text-muted-foreground`;

/** Transfer / Pay amount row (large value; placeholder handled in globals). */
export const FLOW_INPUT_AMOUNT_TRANSFER =
  `${FLOW_INPUT_BASE} !text-card-foreground placeholder:text-muted-foreground input-amount-transfer max-w-full md:text-[0.5rem] md:leading-none`;

export const FLOW_INPUT_AMOUNT_DEFAULT =
  `${FLOW_INPUT_BASE} text-xl font-medium text-card-foreground placeholder:text-muted-foreground`;

/** Token “select” rows (From / To / Select token) */
export const FLOW_TOKEN_TRIGGER =
  `${FLOW_CONTROL_MIN_H} flex w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-0 py-0 text-left transition-none hover:bg-transparent focus-visible:outline-none focus-visible:ring-0`;
