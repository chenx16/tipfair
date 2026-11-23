import { describe, expect, it } from "vitest";
import { previewShiftSplit } from "./preview-shift-split";

interface Row {
  name: string;
  hours: string;
  points?: string;
  role?: string;
}

function shiftForm(total: string, rows: Row[]): FormData {
  const formData = new FormData();
  formData.set("total", total);
  rows.forEach(({ name, hours, points = "1", role = "STAFF" }, i) => {
    formData.set(`entries.${i}.name`, name);
    formData.set(`entries.${i}.role`, role);
    formData.set(`entries.${i}.hours`, hours);
    formData.set(`entries.${i}.points`, points);
  });
  return formData;
}

async function preview(total: string, rows: Row[]) {
  return previewShiftSplit({ status: "idle" }, shiftForm(total, rows));
}

async function okRows(total: string, rows: Row[]) {
  const state = await preview(total, rows);
  if (state.status !== "ok") throw new Error(`expected ok, got ${JSON.stringify(state)}`);
  return state;
}

function centsOf(state: Awaited<ReturnType<typeof okRows>>): number[] {
  return state.rows.map((row) => row.cents);
}

describe("previewShiftSplit", () => {
  describe("valid shifts", () => {
    it("splits $100.00 across 6h and 4h into $60.00 and $40.00", async () => {
      const state = await okRows("100.00", [
        { name: "Ana", hours: "6" },
        { name: "Ben", hours: "4" },
      ]);

      expect(state.totalCents).toBe(10000);
      expect(state.rows).toEqual([
        { name: "Ana", role: "STAFF", hours: 6, points: 1, cents: 6000 },
        { name: "Ben", role: "STAFF", hours: 4, points: 1, cents: 4000 },
      ]);
    });

    it("splits by role points: server 1.0 gets twice a busser 0.5 for equal hours", async () => {
      const state = await okRows("90", [
        { name: "Server", hours: "5", points: "1.0" },
        { name: "Busser", hours: "5", points: "0.5" },
      ]);

      expect(centsOf(state)).toEqual([6000, 3000]);
    });

    it("gives the leftover cent to the lowest staffId: $100.00 over 3 → 3334/3333/3333", async () => {
      const state = await okRows("100.00", [
        { name: "Ana", hours: "1" },
        { name: "Ben", hours: "1" },
        { name: "Cy", hours: "1" },
      ]);

      expect(centsOf(state)).toEqual([3334, 3333, 3333]);
    });

    it.each([
      { total: "123.45", hours: ["7", "5", "3"], points: ["1", "0.5", "0.75"] },
      { total: "0.01", hours: ["2", "3", "4"], points: ["1", "1", "1"] },
      { total: "999.99", hours: ["1.5", "2.25", "3"], points: ["1", "1", "0.5"] },
    ])("rows always sum to the total ($total)", async ({ total, hours, points }) => {
      const state = await okRows(
        total,
        hours.map((h, i) => ({ name: `S${i}`, hours: h, points: points[i] })),
      );

      const sum = centsOf(state).reduce((acc, cents) => acc + cents, 0);
      expect(sum).toBe(state.totalCents);
    });

    it("gives every row 0 for a total of 0", async () => {
      const state = await okRows("0", [
        { name: "Ana", hours: "6" },
        { name: "Ben", hours: "4" },
      ]);

      expect(centsOf(state)).toEqual([0, 0]);
    });

    it("gives a zero-hour row 0", async () => {
      const state = await okRows("100", [
        { name: "Ana", hours: "6" },
        { name: "Ben", hours: "0" },
        { name: "Cy", hours: "4" },
      ]);

      expect(centsOf(state)).toEqual([6000, 0, 4000]);
    });

    it("echoes the submitted values so the form can re-fill", async () => {
      const state = await okRows(" 50 ", [{ name: "Ana", hours: "3" }]);

      expect(state.values).toEqual({
        total: " 50 ",
        entries: [{ name: "Ana", role: "STAFF", hours: "3", points: "1" }],
      });
    });
  });

  describe("invalid input", () => {
    it("returns field-level errors and no rows for bad fields", async () => {
      const state = await preview("abc", [
        { name: "Ana", hours: "6" },
        { name: "", hours: "" },
      ]);

      expect(state.status).toBe("invalid");
      if (state.status !== "invalid") return;
      expect(Object.keys(state.fieldErrors).sort()).toEqual([
        "entries.1.hours",
        "entries.1.name",
        "total",
      ]);
      expect(state.formError).toBeUndefined();
      expect(state).not.toHaveProperty("rows");
    });

    it("catches negative hours in the schema, before the split engine", async () => {
      const state = await preview("100", [{ name: "Ana", hours: "-1" }]);

      expect(state).toMatchObject({
        status: "invalid",
        fieldErrors: { "entries.0.hours": "Hours cannot be negative" },
      });
    });

    it("reports an empty staff list", async () => {
      const state = await preview("100", []);

      expect(state).toMatchObject({
        status: "invalid",
        fieldErrors: { entries: "Add at least one staff member" },
      });
    });

    it.each(["MANAGER", "OWNER"])("returns a clear form error for a %s in the list", async (role) => {
      const state = await preview("100", [
        { name: "Ana", hours: "6" },
        { name: "Dana", hours: "4", role },
      ]);

      expect(state).toEqual({
        status: "invalid",
        values: expect.any(Object),
        fieldErrors: {},
        formError: `${role} Dana cannot receive a share of the tip pool`,
      });
    });

    it("returns a form error when every weight is zero but the total is positive", async () => {
      const state = await preview("100", [{ name: "Ana", hours: "0" }]);

      expect(state).toMatchObject({
        status: "invalid",
        formError: expect.stringMatching(/weight/i),
      });
    });

    it("ignores the previous state", async () => {
      const first = await preview("100", [{ name: "Ana", hours: "6" }]);
      const second = await previewShiftSplit(first, shiftForm("abc", [{ name: "Ana", hours: "6" }]));

      expect(second.status).toBe("invalid");
    });
  });
});
