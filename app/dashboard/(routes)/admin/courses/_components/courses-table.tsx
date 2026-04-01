"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import Link from "next/link";
import { Pencil, Search, ImageIcon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatPrice } from "@/lib/format";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { mobileColumnLabel } from "@/lib/table-column-meta";
import type { Course } from "./columns";

interface DataTableProps<TData extends Course, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    hideActions?: boolean;
}

function CourseActions({
    courseId,
    hideActions,
    onDelete,
    layout = "row",
}: {
    courseId: string;
    hideActions?: boolean;
    onDelete: (id: string) => void;
    layout?: "row" | "stack";
}) {
    if (hideActions) return null;
    return (
        <div
            className={cn(
                "flex gap-2",
                layout === "stack" && "w-full flex-col sm:flex-row sm:flex-wrap"
            )}
        >
            <Button
                className={cn(
                    "bg-brand hover:bg-brand/90 gap-1.5 text-white min-h-11",
                    layout === "stack" ? "w-full sm:w-auto" : "shrink-0"
                )}
                asChild
            >
                <Link href={`/dashboard/admin/courses/${courseId}`}>
                    <Pencil className="h-4 w-4 shrink-0" />
                    تعديل الكورس
                </Link>
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="destructive"
                        className={cn(
                            "inline-flex min-h-11 shrink-0 items-center justify-center gap-2",
                            layout === "stack"
                                ? "h-11 w-full"
                                : "h-10 px-3 text-sm whitespace-nowrap"
                        )}
                    >
                        حذف الكورس
                        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            لا يمكن التراجع عن هذا العمل. سيتم حذف الكورس وكل محتواها بشكل دائم.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(courseId)}>حذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export function CoursesTable<TData extends Course, TValue>({
    columns,
    data,
    hideActions = false,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [filterValue, setFilterValue] = useState("");
    const router = useRouter();

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    const handleFilterChange = (value: string) => {
        setFilterValue(value);
        table.getColumn("title")?.setFilterValue(value);
    };

    const onDelete = async (courseId: string) => {
        try {
            const response = await fetch(`/api/courses/${courseId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("فشل حذف الكورس");
            }

            toast.success("تم حذف الكورس بنجاح");
            router.refresh();
        } catch {
            toast.error("حدث خطأ");
        }
    };

    const rows = table.getRowModel().rows;

    return (
        <div>
            <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
                    <Input
                        placeholder="ابحث عن الكورسات..."
                        value={filterValue}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="w-full min-h-11 ps-10"
                    />
                </div>
            </div>

            <div className="md:hidden space-y-3">
                {rows?.length ? (
                    rows.map((row) => {
                        const c = row.original;
                        const price = typeof c.price === "number" ? c.price : parseFloat(String(c.price));
                        const created = c.createdAt ? new Date(c.createdAt) : null;
                        const img = c.imageUrl;
                        return (
                            <div
                                key={row.id}
                                className="rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-3"
                            >
                                <div className="overflow-hidden rounded-lg border border-border/60 bg-muted aspect-video max-h-[180px] w-full">
                                    {img ? (
                                        <img
                                            src={img}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 text-muted-foreground">
                                            <ImageIcon className="h-10 w-10 opacity-50" aria-hidden />
                                            <span className="text-xs">لا توجد صورة غلاف</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug">
                                        {c.title || "بدون عنوان"}
                                    </h3>
                                    <Badge
                                        variant={c.isPublished ? "default" : "secondary"}
                                        className="shrink-0"
                                    >
                                        {c.isPublished ? "منشور" : "غير منشور"}
                                    </Badge>
                                </div>
                                <dl
                                    className="grid grid-cols-2 gap-3 text-sm"
                                    dir="rtl"
                                >
                                    <div className="min-w-0">
                                        <dt className="block text-right text-xs text-muted-foreground">
                                            السعر
                                        </dt>
                                        <dd className="mt-0.5 block text-right font-medium">
                                            <span
                                                dir="ltr"
                                                className="inline-block tabular-nums"
                                            >
                                                {formatPrice(Number.isFinite(price) ? price : 0)}
                                            </span>
                                        </dd>
                                    </div>
                                    <div className="min-w-0">
                                        <dt className="block text-right text-xs text-muted-foreground">
                                            تاريخ الإنشاء
                                        </dt>
                                        <dd className="mt-0.5 block text-right font-medium">
                                            {created && !Number.isNaN(created.getTime())
                                                ? format(created, "dd/MM/yyyy", { locale: ar })
                                                : "—"}
                                        </dd>
                                    </div>
                                </dl>
                                <CourseActions
                                    courseId={c.id}
                                    hideActions={hideActions}
                                    onDelete={onDelete}
                                    layout="stack"
                                />
                            </div>
                        );
                    })
                ) : (
                    <div className="rounded-xl border border-dashed border-muted-foreground/30 py-12 text-center text-sm text-muted-foreground">
                        لا يوجد نتائج.
                    </div>
                )}
            </div>

            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="text-right">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef.header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {rows?.length ? (
                            rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            label={mobileColumnLabel(cell)}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                    {!hideActions && (
                                        <TableCell label="الإجراءات">
                                            <CourseActions
                                                courseId={row.original.id}
                                                hideActions={hideActions}
                                                onDelete={onDelete}
                                                layout="row"
                                            />
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (hideActions ? 0 : 1)}
                                    className="h-24 text-center"
                                >
                                    لا يوجد نتائج.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    className="min-h-10"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    السابق
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="min-h-10"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    التالي
                </Button>
            </div>
        </div>
    );
}
