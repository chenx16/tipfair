import { formatCents } from "@/lib/money/money";
import type { PreviewRow } from "@/server/shift-preview-state";

interface ShiftPreviewTableProps {
  rows: PreviewRow[];
}

/** Preview of each staff member's share; the footer total is the sum of displayed shares. */
export function ShiftPreviewTable({ rows }: ShiftPreviewTableProps): React.JSX.Element {
  const sumCents = rows.reduce((acc, row) => acc + row.cents, 0);

  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="mb-2 text-left text-base font-semibold">Split preview</caption>
      <thead>
        <tr className="border-b border-zinc-300 dark:border-zinc-700">
          <th scope="col" className="py-2 pr-4">Name</th>
          <th scope="col" className="py-2 pr-4 text-right">Hours</th>
          <th scope="col" className="py-2 pr-4 text-right">Points</th>
          <th scope="col" className="py-2 text-right">Share</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} className="border-b border-zinc-200 dark:border-zinc-800">
            <th scope="row" className="py-2 pr-4 font-normal">{row.name}</th>
            <td className="py-2 pr-4 text-right tabular-nums">{row.hours}</td>
            <td className="py-2 pr-4 text-right tabular-nums">{row.points}</td>
            <td className="py-2 text-right tabular-nums">{formatCents(row.cents)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="font-semibold">
          <th scope="row" colSpan={3} className="py-2 pr-4">Total</th>
          <td className="py-2 text-right tabular-nums">{formatCents(sumCents)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
