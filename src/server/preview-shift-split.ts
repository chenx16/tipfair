"use server";

import { splitTips, type Share } from "@/lib/split/split-tips";
import {
  formDataToShiftInput,
  shiftPreviewSchema,
  toFieldErrors,
  toSplitInput,
  type ShiftPreview,
} from "@/lib/validation/shift-preview-schema";
import type { PreviewRow, PreviewState } from "./shift-preview-state";

/**
 * Validates a shift's tips and hours and previews the split. Persists nothing.
 *
 * TODO(auth): require the caller to be a MANAGER of the venue once Auth.js lands
 * (PRD security Definition of Done). There is no auth in the app yet.
 */
export async function previewShiftSplit(
  _prevState: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  const values = formDataToShiftInput(formData);
  const parsed = shiftPreviewSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "invalid", values, fieldErrors: toFieldErrors(parsed.error) };
  }

  let shares: Share[];
  try {
    shares = splitTips(toSplitInput(parsed.data));
  } catch (error) {
    return { status: "invalid", values, fieldErrors: {}, formError: errorMessage(error) };
  }

  return {
    status: "ok",
    values,
    totalCents: parsed.data.totalCents,
    rows: toPreviewRows(parsed.data, shares),
  };
}

/** Pairs each validated entry with its share; the engine returns shares in input order. */
function toPreviewRows(preview: ShiftPreview, shares: Share[]): PreviewRow[] {
  return preview.entries.map((entry, i) => ({ ...entry, cents: shares[i].cents }));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Could not split the tips for this shift";
}
