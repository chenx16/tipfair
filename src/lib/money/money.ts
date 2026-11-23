/**
 * Money helpers. All amounts are integer cents; these never use floating-point dollars.
 */

const DOLLAR_AMOUNT = /^(\d+)(?:\.(\d{1,2}))?$/;

/** Parses a plain dollar string like "123.45" into integer cents using string math only. */
export function parseDollarsToCents(text: string): number {
  const match = DOLLAR_AMOUNT.exec(text);
  if (!match) {
    throw new Error(`Invalid amount: ${JSON.stringify(text)}`);
  }
  const [, dollars, fraction = ""] = match;
  return Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Formats integer cents as US dollars, e.g. 1234567 → "$12,345.67". */
export function formatCents(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error(`Expected a non-negative integer number of cents (got ${cents})`);
  }
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  return `$${groupThousands(String(dollars))}.${String(remainder).padStart(2, "0")}`;
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
