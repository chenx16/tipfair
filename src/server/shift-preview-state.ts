import type { Role } from "@/lib/split/split-tips";
import type { ShiftFormValues } from "@/lib/validation/shift-preview-schema";

/** One row of the preview table. Share is in integer cents. */
export interface PreviewRow {
  name: string;
  role: Role;
  hours: number;
  points: number;
  cents: number;
}

/** State returned by the `previewShiftSplit` server action to `useActionState`. */
export type PreviewState =
  | { status: "idle" }
  | {
      status: "invalid";
      values: ShiftFormValues;
      /** Keyed by form field name, e.g. "total" or "entries.1.hours". */
      fieldErrors: Record<string, string>;
      /** A whole-form error, e.g. a manager in the list (from the split engine). */
      formError?: string;
    }
  | { status: "ok"; values: ShiftFormValues; totalCents: number; rows: PreviewRow[] };

export const initialPreviewState: PreviewState = { status: "idle" };
