import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ShiftPreviewForm } from "./ShiftPreviewForm";

function type(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submit(): void {
  fireEvent.click(screen.getByRole("button", { name: "Preview split" }));
}

function fillTwoStaff(): void {
  type("Total tips ($)", "100.00");
  type("Staff 1 name", "Ana");
  type("Staff 1 hours", "6");
  type("Staff 2 name", "Ben");
  type("Staff 2 hours", "4");
}

describe("ShiftPreviewForm", () => {
  it("shows a preview table whose shares add up to the total", async () => {
    render(<ShiftPreviewForm />);
    fillTwoStaff();

    submit();

    const table = await screen.findByRole("table", { name: "Split preview" });
    const rows = within(table).getAllByRole("row");
    expect(rows.map((row) => row.textContent)).toEqual([
      "NameHoursPointsShare",
      "Ana61$60.00",
      "Ben41$40.00",
      "Total$100.00",
    ]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the submitted values in the form after previewing", async () => {
    render(<ShiftPreviewForm />);
    fillTwoStaff();

    submit();

    await screen.findByRole("table");
    expect(screen.getByLabelText("Total tips ($)")).toHaveValue("100.00");
    expect(screen.getByLabelText("Staff 2 name")).toHaveValue("Ben");
    expect(screen.getByLabelText("Staff 2 hours")).toHaveValue("4");
  });

  it("shows a clear error instead of a table when a manager is in the list", async () => {
    render(<ShiftPreviewForm />);
    fillTwoStaff();
    type("Staff 2 name", "Dana");
    fireEvent.change(screen.getByLabelText("Staff 2 role"), { target: { value: "MANAGER" } });

    submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "MANAGER Dana cannot receive a share of the tip pool",
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows field-level errors next to invalid inputs", async () => {
    render(<ShiftPreviewForm />);
    fillTwoStaff();
    type("Total tips ($)", "abc");
    type("Staff 2 hours", "");

    submit();

    expect(await screen.findByText("Hours is required")).toBeInTheDocument();
    const hours = screen.getByLabelText("Staff 2 hours");
    expect(hours).toHaveAttribute("aria-invalid", "true");
    expect(hours).toHaveAccessibleDescription("Hours is required");
    expect(screen.getByLabelText("Total tips ($)")).toHaveAccessibleDescription(
      "Enter an amount like 123.45",
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("adds and removes staff rows", async () => {
    render(<ShiftPreviewForm />);
    fireEvent.click(screen.getByRole("button", { name: "Add staff" }));
    type("Total tips ($)", "90");
    type("Staff 1 name", "Ana");
    type("Staff 1 hours", "5");
    type("Staff 2 name", "Gone");
    type("Staff 2 hours", "5");
    type("Staff 3 name", "Cy");
    type("Staff 3 hours", "5");
    type("Staff 3 points", "0.5");

    fireEvent.click(screen.getByRole("button", { name: "Remove staff 2" }));
    submit();

    const table = await screen.findByRole("table");
    expect(within(table).queryByText("Gone")).not.toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /Ana/ })).toHaveTextContent("$60.00");
    expect(within(table).getByRole("row", { name: /Cy/ })).toHaveTextContent("$30.00");
  });
});
