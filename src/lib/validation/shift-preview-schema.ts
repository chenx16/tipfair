import { z } from "zod";
import { parseDollarsToCents } from "@/lib/money/money";
import type { Role, SplitInput } from "@/lib/split/split-tips";

const ROLES = ["STAFF", "MANAGER", "OWNER"] as const satisfies readonly Role[];
const DOLLAR_AMOUNT = /^\d+(\.\d{1,2})?$/;
const NUMBER = /^-?\d+(\.\d+)?$/;
const MAX_TOTAL_CENTS = 100_000_000; // $1,000,000.00
const MAX_HOURS = 24;
const MAX_POINTS = 10;
const ROW_FIELDS = ["name", "role", "hours", "points"] as const;
const ROW_KEY = new RegExp(`^entries\\.(\\d+)\\.(${ROW_FIELDS.join("|")})$`);

type RowField = (typeof ROW_FIELDS)[number];

/** Raw string values of one staff row, as submitted by the form. */
export type ShiftRowValues = Record<RowField, string>;

/** Raw string values of the whole form, as submitted. */
export interface ShiftFormValues {
  total: string;
  entries: ShiftRowValues[];
}

const totalSchema = z
  .string()
  .trim()
  .regex(DOLLAR_AMOUNT, "Enter an amount like 123.45")
  .transform(parseDollarsToCents)
  .pipe(z.number().max(MAX_TOTAL_CENTS, "Total must be at most $1,000,000.00"));

function numberField(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(NUMBER, `${label} must be a number`)
    .transform(Number)
    .pipe(
      z
        .number()
        .min(0, `${label} cannot be negative`)
        .max(max, `${label} must be at most ${max}`),
    );
}

const entrySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(60, "Name must be at most 60 characters"),
  role: z.enum(ROLES, { error: "Choose a role" }),
  hours: numberField("Hours", MAX_HOURS),
  points: numberField("Points", MAX_POINTS),
});

/** Validates a shift preview form and converts the total to integer cents. */
export const shiftPreviewSchema = z
  .object({
    total: totalSchema,
    entries: z.array(entrySchema).min(1, "Add at least one staff member"),
  })
  .superRefine(({ entries }, ctx) => {
    const seen = new Set<string>();
    entries.forEach((entry, i) => {
      const key = entry.name.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["entries", i, "name"],
          message: "Each name must be unique",
        });
      }
      seen.add(key);
    });
  })
  .transform(({ total, entries }) => ({ totalCents: total, entries }));

export type ShiftPreview = z.output<typeof shiftPreviewSchema>;

/** Maps Zod issues to `{ "entries.1.hours": message }`, keeping the first message per field. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in errors)) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

/** Rebuilds `{ total, entries }` from flat `entries.N.field` form keys, ordered by N. */
export function formDataToShiftInput(formData: FormData): ShiftFormValues {
  const rows = new Map<number, ShiftRowValues>();
  for (const [key, value] of formData.entries()) {
    const match = ROW_KEY.exec(key);
    if (!match || typeof value !== "string") continue;
    const index = Number(match[1]);
    const row = rows.get(index) ?? { name: "", role: "", hours: "", points: "" };
    row[match[2] as RowField] = value;
    rows.set(index, row);
  }
  const entries = [...rows.entries()].sort(([a], [b]) => a - b).map(([, row]) => row);
  return { total: stringValue(formData.get("total")), entries };
}

/** Converts a validated preview into split-engine input; the name is the staffId. */
export function toSplitInput(preview: ShiftPreview): SplitInput {
  return {
    totalCents: preview.totalCents,
    entries: preview.entries.map(({ name, role, hours, points }) => ({
      staffId: name,
      role,
      hours,
      points,
    })),
  };
}

function stringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}
