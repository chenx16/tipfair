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
  const { totalCents, entries } = input;
  const weights = entries.map(weightOf);
  const totalWeight = sum(weights);
  const exact = weights.map((weight) => (totalCents * weight) / totalWeight);
  const cents = exact.map(Math.floor);

  const leftover = totalCents - sum(cents);
  const order = entries
    .map((entry, i) => ({ i, staffId: entry.staffId, remainder: exact[i] - cents[i] }))
    .sort((a, b) => b.remainder - a.remainder || compareIds(a.staffId, b.staffId));
  for (let k = 0; k < leftover; k++) {
    cents[order[k].i] += 1;
  }

  return entries.map((entry, i) => ({ staffId: entry.staffId, cents: cents[i] }));
}

function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Weight of an entry = hours × points. */
function weightOf(entry: SplitEntry): number {
  return entry.hours * entry.points;
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}
