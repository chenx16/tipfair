import { describe, expect, it } from "vitest";
import {
  formDataToShiftInput,
  shiftPreviewSchema,
  toFieldErrors,
  toSplitInput,
} from "./shift-preview-schema";

function row(name: string, hours: string, points = "1", role = "STAFF") {
  return { name, role, hours, points };
}

function errorsFor(input: unknown): Record<string, string> {
  const result = shiftPreviewSchema.safeParse(input);
  if (result.success) throw new Error("expected validation to fail");
  return toFieldErrors(result.error);
}

describe("shiftPreviewSchema", () => {
  describe("valid input", () => {
    it("parses the total into cents and hours/points into numbers", () => {
      const result = shiftPreviewSchema.parse({
        total: "100.00",
        entries: [row("Ana", "6"), row("Ben", "4", "0.5")],
      });

      expect(result).toEqual({
        totalCents: 10000,
        entries: [
          { name: "Ana", role: "STAFF", hours: 6, points: 1 },
          { name: "Ben", role: "STAFF", hours: 4, points: 0.5 },
        ],
      });
    });

    it("trims whitespace around the total and names", () => {
      const result = shiftPreviewSchema.parse({
        total: "  12.50 ",
        entries: [row("  Ana ", " 6.5 ")],
      });

      expect(result.totalCents).toBe(1250);
      expect(result.entries[0]).toMatchObject({ name: "Ana", hours: 6.5 });
    });

    it("accepts a zero total and zero hours or points", () => {
      const result = shiftPreviewSchema.parse({
        total: "0",
        entries: [row("Ana", "0"), row("Ben", "3", "0")],
      });

      expect(result.totalCents).toBe(0);
      expect(result.entries.map((e) => [e.hours, e.points])).toEqual([
        [0, 1],
        [3, 0],
      ]);
    });

    it("accepts MANAGER and OWNER roles (the split engine rejects them, not the schema)", () => {
      const result = shiftPreviewSchema.parse({
        total: "10",
        entries: [row("Dana", "4", "1", "MANAGER"), row("Olu", "4", "1", "OWNER")],
      });

      expect(result.entries.map((e) => e.role)).toEqual(["MANAGER", "OWNER"]);
    });
  });

  describe("invalid input", () => {
    it.each(["", "abc", "-5", "1.234", "$5", "1,000"])("rejects total %j", (total) => {
      expect(errorsFor({ total, entries: [row("Ana", "6")] })).toHaveProperty("total");
    });

    it("rejects a total over $1,000,000", () => {
      expect(errorsFor({ total: "1000000.01", entries: [row("Ana", "6")] })).toHaveProperty(
        "total",
      );
    });

    it("requires at least one staff member", () => {
      expect(errorsFor({ total: "10", entries: [] })).toEqual({
        entries: "Add at least one staff member",
      });
    });

    it("requires a name", () => {
      expect(errorsFor({ total: "10", entries: [row("   ", "6")] })).toHaveProperty(
        "entries.0.name",
      );
    });

    it.each(["", "  ", "abc", "-1", "25"])("rejects hours %j", (hours) => {
      expect(errorsFor({ total: "10", entries: [row("Ana", "6"), row("Ben", hours)] }))
        .toHaveProperty("entries.1.hours");
    });

    it.each(["", "abc", "-0.5", "11"])("rejects points %j", (points) => {
      expect(errorsFor({ total: "10", entries: [row("Ana", "6", points)] })).toHaveProperty(
        "entries.0.points",
      );
    });

    it("rejects an unknown role", () => {
      expect(errorsFor({ total: "10", entries: [row("Ana", "6", "1", "CHEF")] })).toHaveProperty(
        "entries.0.role",
      );
    });

    it("rejects duplicate names (case-insensitive) on the later row", () => {
      const errors = errorsFor({
        total: "10",
        entries: [row("Ana", "6"), row("Ben", "4"), row("ana ", "2")],
      });

      expect(errors).toEqual({ "entries.2.name": "Each name must be unique" });
    });

    it("reports errors for several fields at once", () => {
      const errors = errorsFor({ total: "x", entries: [row("", "-1")] });

      expect(Object.keys(errors).sort()).toEqual(["entries.0.hours", "entries.0.name", "total"]);
    });
  });
});

describe("toFieldErrors", () => {
  it("keeps the first message per dotted path", () => {
    const result = shiftPreviewSchema.safeParse({ total: "", entries: [row("Ana", "")] });
    if (result.success) throw new Error("expected validation to fail");

    const errors = toFieldErrors(result.error);

    expect(typeof errors.total).toBe("string");
    expect(typeof errors["entries.0.hours"]).toBe("string");
  });
});

describe("formDataToShiftInput", () => {
  it("rebuilds entries from entries.N.field keys, ordered by N", () => {
    const formData = new FormData();
    formData.set("total", "100.00");
    formData.set("entries.1.name", "Ben");
    formData.set("entries.1.role", "STAFF");
    formData.set("entries.1.hours", "4");
    formData.set("entries.1.points", "0.5");
    formData.set("entries.0.name", "Ana");
    formData.set("entries.0.role", "STAFF");
    formData.set("entries.0.hours", "6");
    formData.set("entries.0.points", "1");

    expect(formDataToShiftInput(formData)).toEqual({
      total: "100.00",
      entries: [row("Ana", "6", "1"), row("Ben", "4", "0.5")],
    });
  });

  it("compacts gaps left by removed rows", () => {
    const formData = new FormData();
    formData.set("total", "5");
    formData.set("entries.3.name", "Cy");
    formData.set("entries.3.hours", "1");

    expect(formDataToShiftInput(formData)).toEqual({
      total: "5",
      entries: [{ name: "Cy", role: "", hours: "1", points: "" }],
    });
  });

  it("returns empty strings when fields are missing", () => {
    expect(formDataToShiftInput(new FormData())).toEqual({ total: "", entries: [] });
  });
});

describe("toSplitInput", () => {
  it("maps parsed rows to split entries, using the name as staffId", () => {
    const parsed = shiftPreviewSchema.parse({
      total: "100",
      entries: [row("Ana", "6"), row("Ben", "4", "0.5")],
    });

    expect(toSplitInput(parsed)).toEqual({
      totalCents: 10000,
      entries: [
        { staffId: "Ana", role: "STAFF", hours: 6, points: 1 },
        { staffId: "Ben", role: "STAFF", hours: 4, points: 0.5 },
      ],
    });
  });
});
