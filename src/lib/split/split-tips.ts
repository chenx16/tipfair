/**
 * Pure tip-split engine. No I/O, no framework imports.
 * All money values are integer cents.
 */

/** App-level role. Only STAFF may receive a share of the tip pool. */
export type Role = "STAFF" | "MANAGER" | "OWNER";

export interface SplitEntry {
  staffId: string;
  role: Role;
  /** Hours worked this shift (may be fractional, e.g. 6.5). */
  hours: number;
  /** Role points, e.g. server 1.0, busser 0.5. Hours-only pooling uses 1. */
  points: number;
}

export interface SplitInput {
  /** Total pooled tips in integer cents. */
  totalCents: number;
  entries: SplitEntry[];
}

export interface Share {
  staffId: string;
  /** This entry's share in integer cents. */
  cents: number;
}

/** Splits a tip pool across entries. Returns one share per entry, in input order. */
export function splitTips(input: SplitInput): Share[] {
  validateInput(input);

  const { totalCents, entries } = input;
  if (totalCents === 0) {
    return entries.map((entry) => ({ staffId: entry.staffId, cents: 0 }));
  }

  const exact = exactShares(totalCents, entries);
  const base = exact.map((share) => Math.floor(share));
  const cents = distributeLeftover(totalCents, entries, exact, base);

  return entries.map((entry, i) => ({ staffId: entry.staffId, cents: cents[i] }));
}

/** Throws if the input breaks a PRD rule. Checks run in a fixed order. */
function validateInput({ totalCents, entries }: SplitInput): void {
  if (totalCents < 0) {
    throw new Error(`Total must not be negative (got ${totalCents} cents)`);
  }
  entries.forEach(validateEntry);
  if (totalCents > 0 && sum(entries.map(weightOf)) === 0) {
    throw new Error("Cannot split a positive total when every weight is zero");
  }
}

function validateEntry(entry: SplitEntry): void {
  if (isExcludedFromPool(entry.role)) {
    throw new Error(`${entry.role} ${entry.staffId} cannot receive a share of the tip pool`);
  }
  if (entry.hours < 0) {
    throw new Error(`Hours must not be negative for ${entry.staffId}`);
  }
  if (entry.points < 0) {
    throw new Error(`Points must not be negative for ${entry.staffId}`);
  }
}

/** Federal tip-pool rule: managers and owners may not share in the pool. */
function isExcludedFromPool(role: Role): boolean {
  return role === "MANAGER" || role === "OWNER";
}

/** Unrounded share of each entry = total × weight / totalWeight. */
function exactShares(totalCents: number, entries: SplitEntry[]): number[] {
  const weights = entries.map(weightOf);
  const totalWeight = sum(weights);
  return weights.map((weight) => (totalCents * weight) / totalWeight);
}

/** Weight of an entry = hours × points. */
function weightOf(entry: SplitEntry): number {
  return entry.hours * entry.points;
}

/**
 * Hands out the cents lost to rounding down, one at a time, in leftover order.
 * Returns new share amounts; does not mutate `base`.
 */
function distributeLeftover(
  totalCents: number,
  entries: SplitEntry[],
  exact: number[],
  base: number[],
): number[] {
  const leftover = totalCents - sum(base);
  const recipients = new Set(leftoverOrder(entries, exact, base).slice(0, leftover));
  return base.map((cents, i) => (recipients.has(i) ? cents + 1 : cents));
}

/** Entry indices ranked by largest fractional remainder, ties by staffId ascending. */
function leftoverOrder(entries: SplitEntry[], exact: number[], base: number[]): number[] {
  return entries
    .map((entry, i) => ({ index: i, staffId: entry.staffId, remainder: exact[i] - base[i] }))
    .sort((a, b) => b.remainder - a.remainder || compareIds(a.staffId, b.staffId))
    .map(({ index }) => index);
}

function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}
