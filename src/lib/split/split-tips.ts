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
  void input;
  throw new Error("not implemented");
}
