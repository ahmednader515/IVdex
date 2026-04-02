"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

export type Course = {
    id: string;
    title: string;
    price: number;
    isPublished: boolean;
    createdAt: Date;
    imageUrl?: string | null;
};

export const columns: ColumnDef<Course>[] = [
    {
        id: "image",
        header: "Cover",
        meta: { mobileLabel: "Cover" },
        enableSorting: false,
        cell: ({ row }) => {
            const url = row.original.imageUrl;
            return (
                <div className="h-14 w-24 shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted">
                    {url ? (
                        <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-muted-foreground">
                            —
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "title",
        meta: { mobileLabel: "Title" },
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Title
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: "price",
        meta: { mobileLabel: "Price" },
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const price = parseFloat(row.getValue("price"));
            return <div>{formatPrice(price)}</div>;
        },
    },
    {
        accessorKey: "isPublished",
        meta: { mobileLabel: "Status" },
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const isPublished = row.getValue("isPublished") || false;
            return (
                <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "Published" : "Draft"}
                </Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        meta: { mobileLabel: "Created" },
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Created
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue("createdAt"));
            return <div>{format(date, "MM/dd/yyyy", { locale: enUS })}</div>;
        },
    }
]; 