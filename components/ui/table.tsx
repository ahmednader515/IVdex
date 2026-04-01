import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-x-auto">
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm",
        // Mobile: stack each body row as a card (no horizontal table layout)
        "[&_tbody>tr]:max-md:mb-3 [&_tbody>tr]:max-md:block [&_tbody>tr]:max-md:rounded-xl [&_tbody>tr]:max-md:bg-card [&_tbody>tr]:max-md:p-3 [&_tbody>tr]:max-md:ring-1 [&_tbody>tr]:max-md:ring-border/80",
        // Full-width placeholder rows (colSpan) — keep flat, not a heavy card
        "[&_tbody>tr:has(>td[colspan])]:max-md:mb-2 [&_tbody>tr:has(>td[colspan])]:max-md:rounded-lg [&_tbody>tr:has(>td[colspan])]:max-md:ring-0 [&_tbody>tr:has(>td[colspan])]:max-md:bg-transparent [&_tbody>tr:has(>td[colspan])]:max-md:p-0",
        className
      )}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("[&_tr]:border-b", "max-md:hidden", className)}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "bg-primary font-medium text-primary-foreground",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      // Mobile: the "card" outline is handled by Table's ring styles
      "max-md:border-0 max-md:hover:bg-transparent",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    /** Shown above the cell on small screens (replaces hidden table header). */
    label?: string
  }
>(({ className, label, children, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle [&:has([role=checkbox])]:pr-0",
      "max-md:block max-md:w-full max-md:border-0 max-md:px-0 max-md:py-2.5 max-md:first:pt-0",
      label &&
        "max-md:border-b max-md:border-border/35 [&:last-child]:max-md:border-b-0",
      className
    )}
    {...props}
  >
    {label ? (
      <>
        <span className="mb-1 hidden max-md:block text-right text-[0.7rem] font-medium leading-snug text-muted-foreground">
          {label}
        </span>
        <div className="min-w-0 max-md:text-right">{children}</div>
      </>
    ) : (
      children
    )}
  </td>
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
