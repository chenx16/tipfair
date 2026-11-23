import { describe, expect, it } from "vitest";
import { formatCents, parseDollarsToCents } from "./money";

describe("parseDollarsToCents", () => {
  it.each([
    { text: "123.45", cents: 12345 },
    { text: "100.00", cents: 10000 },
    { text: "5", cents: 500 },
    { text: "5.5", cents: 550 },
    { text: "0.05", cents: 5 },
    { text: "0", cents: 0 },
    { text: "0.00", cents: 0 },
    { text: "007.10", cents: 710 },
    { text: "1000000", cents: 100_000_000 },
  ])("parses $text into $cents cents", ({ text, cents }) => {
    expect(parseDollarsToCents(text)).toBe(cents);
  });

  it("avoids float rounding errors (0.29 × 100 = 28.999… in floats)", () => {
    expect(parseDollarsToCents("0.29")).toBe(29);
    expect(parseDollarsToCents("1.15")).toBe(115);
  });

  it.each(["", "abc", "-5", "1.234", "1,000", "$5", ".5", "5."])(
    "throws for invalid amount %j",
    (text) => {
      expect(() => parseDollarsToCents(text)).toThrow(/amount/i);
    },
  );
});

describe("formatCents", () => {
  it.each([
    { cents: 12345, text: "$123.45" },
    { cents: 10000, text: "$100.00" },
    { cents: 5, text: "$0.05" },
    { cents: 50, text: "$0.50" },
    { cents: 0, text: "$0.00" },
    { cents: 1234567, text: "$12,345.67" },
    { cents: 100_000_000, text: "$1,000,000.00" },
  ])("formats $cents cents as $text", ({ cents, text }) => {
    expect(formatCents(cents)).toBe(text);
  });

  it.each([-1, 1.5, Number.NaN])("throws for non-integer or negative cents %s", (cents) => {
    expect(() => formatCents(cents)).toThrow(/cents/i);
  });
});
