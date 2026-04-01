import type { Cell } from "@tanstack/react-table";

/** Resolve Arabic field label for stacked mobile layout (tanstack cells). */
export function mobileColumnLabel<TData, TValue>(
  cell: Cell<TData, TValue>
): string | undefined {
  const def = cell.column.columnDef;
  const meta = def.meta as { mobileLabel?: string } | undefined;
  if (meta?.mobileLabel) return meta.mobileLabel;
  if (typeof def.header === "string") return def.header;
  return undefined;
}
