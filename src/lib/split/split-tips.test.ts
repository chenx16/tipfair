import { describe, expect, it } from "vitest";
import { splitTips, type SplitEntry } from "./split-tips";

function staff(staffId: string, hours: number, points = 1): SplitEntry {
  return { staffId, role: "STAFF", hours, points };
}

describe("splitTips", () => {
  describe("AC1: splits by hours", () => {
    it("splits $100.00 across 6h and 4h into 6000 and 4000 cents", () => {
      const shares = splitTips({
        totalCents: 10000,
        entries: [staff("a", 6), staff("b", 4)],
      });

      expect(shares).toEqual([
        { staffId: "a", cents: 6000 },
        { staffId: "b", cents: 4000 },
      ]);
    });

    it("gives equal shares for equal hours", () => {
      const shares = splitTips({
        totalCents: 5000,
        entries: [staff("a", 5), staff("b", 5)],
      });

      expect(shares).toEqual([
        { staffId: "a", cents: 2500 },
        { staffId: "b", cents: 2500 },
      ]);
    });

    it("handles fractional hours", () => {
      const shares = splitTips({
        totalCents: 10000,
        entries: [staff("a", 7.5), staff("b", 2.5)],
      });

      expect(shares).toEqual([
        { staffId: "a", cents: 7500 },
        { staffId: "b", cents: 2500 },
      ]);
    });
  });

  describe("AC2: splits by role points", () => {
    it("gives a server (1.0) twice a busser (0.5) for equal hours", () => {
      const shares = splitTips({
        totalCents: 9000,
        entries: [staff("server", 5, 1.0), staff("busser", 5, 0.5)],
      });

      expect(shares).toEqual([
        { staffId: "server", cents: 6000 },
        { staffId: "busser", cents: 3000 },
      ]);
    });

    it("weights by hours × points when both differ", () => {
      // weights: 4 × 1.0 = 4, 8 × 0.5 = 4 → equal shares
      const shares = splitTips({
        totalCents: 8000,
        entries: [staff("server", 4, 1.0), staff("busser", 8, 0.5)],
      });

      expect(shares).toEqual([
        { staffId: "server", cents: 4000 },
        { staffId: "busser", cents: 4000 },
      ]);
    });
  });

  describe("AC3: shares always sum exactly to the total", () => {
    it.each([
      { name: "$100.00 across 3 equal entries", totalCents: 10000, entries: [staff("a", 1), staff("b", 1), staff("c", 1)] },
      { name: "1 cent across 3 entries", totalCents: 1, entries: [staff("a", 2), staff("b", 3), staff("c", 4)] },
      { name: "mixed hours and points", totalCents: 10001, entries: [staff("a", 7, 1), staff("b", 5, 0.5), staff("c", 3, 0.75)] },
      { name: "fractional hours", totalCents: 10000, entries: [staff("a", 1.5), staff("b", 2.25), staff("c", 3)] },
      { name: "seven entries", totalCents: 12345, entries: ["a", "b", "c", "d", "e", "f", "g"].map((id) => staff(id, 1)) },
    ])("$name", ({ totalCents, entries }) => {
      const shares = splitTips({ totalCents, entries });

      const sumOfShares = shares.reduce((acc, share) => acc + share.cents, 0);
      expect(sumOfShares).toBe(totalCents);
    });
  });

  describe("AC4: leftover cents go to the largest fractional remainder", () => {
    it("splits $100.00 across 3 equal entries into 3334, 3333, 3333", () => {
      const shares = splitTips({
        totalCents: 10000,
        entries: [staff("a", 1), staff("b", 1), staff("c", 1)],
      });

      expect(shares).toEqual([
        { staffId: "a", cents: 3334 },
        { staffId: "b", cents: 3333 },
        { staffId: "c", cents: 3333 },
      ]);
    });

    it("breaks ties by staffId ascending, regardless of input order", () => {
      const shares = splitTips({
        totalCents: 10000,
        entries: [staff("c", 1), staff("a", 1), staff("b", 1)],
      });

      expect(shares).toEqual([
        { staffId: "c", cents: 3333 },
        { staffId: "a", cents: 3334 },
        { staffId: "b", cents: 3333 },
      ]);
    });

    it("gives the leftover cent to the largest remainder before staffId", () => {
      // exact shares: a = 33.33…, b = 66.66… → b has the larger remainder
      const shares = splitTips({
        totalCents: 100,
        entries: [staff("a", 1), staff("b", 2)],
      });

      expect(shares).toEqual([
        { staffId: "a", cents: 33 },
        { staffId: "b", cents: 67 },
      ]);
    });

    it("hands out multiple leftover cents one at a time", () => {
      // exact shares: 3.66… each → base 3 each, 2 leftover cents → a, b
      const shares = splitTips({
        totalCents: 11,
        entries: [staff("a", 1), staff("b", 1), staff("c", 1)],
      });

      expect(shares).toEqual([
        { staffId: "a", cents: 4 },
        { staffId: "b", cents: 4 },
        { staffId: "c", cents: 3 },
      ]);
    });

    it("gives a single cent to the lowest staffId when it can't be split", () => {
      const shares = splitTips({
        totalCents: 1,
        entries: [staff("b", 1), staff("a", 1)],
      });

      expect(shares).toEqual([
        { staffId: "b", cents: 0 },
        { staffId: "a", cents: 1 },
      ]);
    });
  });
});
