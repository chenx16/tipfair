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
});
