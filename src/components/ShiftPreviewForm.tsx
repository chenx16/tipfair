"use client";

import { useActionState, useState } from "react";
import type { ShiftRowValues } from "@/lib/validation/shift-preview-schema";
import { previewShiftSplit } from "@/server/preview-shift-split";
import { initialPreviewState, type PreviewState } from "@/server/shift-preview-state";
import { ShiftPreviewTable } from "./ShiftPreviewTable";

const ROLES = ["STAFF", "MANAGER", "OWNER"] as const;

interface RowDraft extends ShiftRowValues {
  id: number;
}

let nextRowId = 0;

function draftRow(values: Partial<ShiftRowValues> = {}): RowDraft {
  nextRowId += 1;
  return { id: nextRowId, name: "", role: "STAFF", hours: "", points: "1", ...values };
}

const inputClass =
  "w-full rounded border border-zinc-300 bg-transparent px-2 py-1 aria-[invalid=true]:border-red-600 dark:border-zinc-700";

/** Manager form: enter a shift's total tips and staff hours, then preview the split. */
export function ShiftPreviewForm(): React.JSX.Element {
  const [state, formAction, pending] = useActionState(previewShiftSplit, initialPreviewState);
  const [rows, setRows] = useState<RowDraft[]>(() => [draftRow(), draftRow()]);
  const [syncedState, setSyncedState] = useState<PreviewState>(state);

  // After each submission, rebuild rows from what was submitted so React's form reset
  // re-fills the inputs instead of clearing them.
  if (state !== syncedState) {
    setSyncedState(state);
    if (state.status !== "idle") {
      setRows(state.values.entries.map((values) => draftRow(values)));
    }
  }

  const values = state.status === "idle" ? undefined : state.values;
  const errors = state.status === "invalid" ? state.fieldErrors : {};

  return (
    <div className="flex flex-col gap-8">
      <form action={formAction} noValidate className="flex flex-col gap-6">
        <div className="flex max-w-xs flex-col gap-1">
          <label htmlFor="total" className="font-medium">Total tips ($)</label>
          <input
            id="total"
            name="total"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={values?.total ?? ""}
            className={inputClass}
            {...errorProps("total", errors)}
          />
          <FieldError name="total" errors={errors} />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-medium">Staff on this shift</legend>
          {rows.map((row, i) => (
            <StaffRow
              key={row.id}
              index={i}
              row={row}
              errors={errors}
              onRemove={() => setRows((current) => current.filter((r) => r.id !== row.id))}
            />
          ))}
          <FieldError name="entries" errors={errors} />
          <button
            type="button"
            onClick={() => setRows((current) => [...current, draftRow()])}
            className="self-start rounded border border-zinc-300 px-3 py-1 text-sm dark:border-zinc-700"
          >
            Add staff
          </button>
        </fieldset>

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60"
        >
          {pending ? "Calculating…" : "Preview split"}
        </button>
      </form>

      {state.status === "invalid" && state.formError && (
        <p role="alert" className="rounded border border-red-600 bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">
          {state.formError}
        </p>
      )}

      {state.status === "ok" && <ShiftPreviewTable rows={state.rows} />}
    </div>
  );
}

interface StaffRowProps {
  index: number;
  row: RowDraft;
  errors: Record<string, string>;
  onRemove: () => void;
}

function StaffRow({ index, row, errors, onRemove }: StaffRowProps): React.JSX.Element {
  const field = (name: keyof ShiftRowValues): string => `entries.${index}.${name}`;
  const label = (text: string): string => `Staff ${index + 1} ${text}`;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[2fr_1.2fr_1fr_1fr_auto] sm:items-start">
      <div>
        <input
          aria-label={label("name")}
          name={field("name")}
          placeholder="Name"
          defaultValue={row.name}
          className={inputClass}
          {...errorProps(field("name"), errors)}
        />
        <FieldError name={field("name")} errors={errors} />
      </div>
      <div>
        <select
          aria-label={label("role")}
          name={field("role")}
          defaultValue={row.role}
          className={inputClass}
          {...errorProps(field("role"), errors)}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <FieldError name={field("role")} errors={errors} />
      </div>
      <div>
        <input
          aria-label={label("hours")}
          name={field("hours")}
          inputMode="decimal"
          placeholder="Hours"
          defaultValue={row.hours}
          className={inputClass}
          {...errorProps(field("hours"), errors)}
        />
        <FieldError name={field("hours")} errors={errors} />
      </div>
      <div>
        <input
          aria-label={label("points")}
          name={field("points")}
          inputMode="decimal"
          placeholder="Points"
          defaultValue={row.points}
          className={inputClass}
          {...errorProps(field("points"), errors)}
        />
        <FieldError name={field("points")} errors={errors} />
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove staff ${index + 1}`}
        className="rounded px-2 py-1 text-sm text-zinc-600 hover:text-red-700 dark:text-zinc-400"
      >
        Remove
      </button>
    </div>
  );
}

function errorId(name: string): string {
  return `${name.replaceAll(".", "-")}-error`;
}

function errorProps(name: string, errors: Record<string, string>) {
  return name in errors ? { "aria-invalid": true, "aria-describedby": errorId(name) } : {};
}

interface FieldErrorProps {
  name: string;
  errors: Record<string, string>;
}

function FieldError({ name, errors }: FieldErrorProps): React.JSX.Element | null {
  const message = errors[name];
  if (!message) return null;
  return (
    <p id={errorId(name)} className="mt-1 text-sm text-red-700 dark:text-red-400">
      {message}
    </p>
  );
}
