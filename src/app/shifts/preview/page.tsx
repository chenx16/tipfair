import type { Metadata } from "next";
import { ShiftPreviewForm } from "@/components/ShiftPreviewForm";

export const metadata: Metadata = {
  title: "Shift split preview",
  description: "Enter a shift's tips and hours and preview each staff member's share.",
};

export default function ShiftPreviewPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Shift split preview</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Enter the shift&apos;s pooled tips and each staff member&apos;s hours and points.
          Nothing is saved until the split is approved.
        </p>
      </header>
      <ShiftPreviewForm />
    </main>
  );
}
