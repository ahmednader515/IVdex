"use client";

import { Suspense } from "react";
import { BarChart, Compass, Layout, List, Wallet, Shield, Users, FileText, Ticket, Award } from "lucide-react";
import { SidebarItem } from "./sidebar-item";
import { usePathname, useSearchParams } from "next/navigation";

const guestRoutes = [
    {
        icon: Layout,
        label: "Dashboard",
        href: "/dashboard",
    },
    {
        icon: Compass,
        label: "Courses",
        href: "/dashboard/search",
    },
    {
        icon: Wallet,
        label: "Balance",
        href: "/dashboard/balance",
    },
    {
        icon: Award,
        label: "Certificates",
        href: "/dashboard/certificates",
    },
];

const adminRoutes = [
    {
        icon: List,
        label: "My courses",
        href: "/dashboard/admin/courses",
    },
    {
        icon: FileText,
        label: "Quizzes & grades",
        href: "/dashboard/admin/assessments",
    },
    {
        icon: BarChart,
        label: "Analytics",
        href: "/dashboard/admin/analytics",
    },
    {
        icon: Users,
        label: "Students & accounts",
        href: "/dashboard/admin/management",
    },
    {
        icon: Ticket,
        label: "Access codes",
        href: "/dashboard/admin/codes",
    },
];

const adminAssistantRoutes = [
    {
        icon: Users,
        label: "Account management",
        href: "/dashboard/admin-assistant/management",
    },
    {
        icon: FileText,
        label: "Quizzes & progress",
        href: "/dashboard/admin-assistant/assessments",
    },
    {
        icon: Wallet,
        label: "Balances",
        href: "/dashboard/admin-assistant/balances",
    },
    {
        icon: Shield,
        label: "Create student account",
        href: "/dashboard/admin-assistant/create-account",
    },
    {
        icon: Ticket,
        label: "Access codes",
        href: "/dashboard/admin-assistant/codes",
    },
];

function SidebarRoutesInner({ closeOnClick = false }: { closeOnClick?: boolean }) {
    const pathName = usePathname();
    const searchParams = useSearchParams();
    const urlSearch = searchParams.toString();

    const isAdminAssistantPage = pathName?.includes("/dashboard/admin-assistant");
    const isAdminPage = pathName?.includes("/dashboard/admin");
    const routes = isAdminAssistantPage ? adminAssistantRoutes : isAdminPage ? adminRoutes : guestRoutes;

    return (
        <div className="flex w-full flex-col pt-0">
            {routes.map((route) => (
                <SidebarItem
                  key={`${route.label}-${route.href}`}
                  icon={route.icon}
                  label={route.label}
                  href={route.href}
                  urlSearch={urlSearch}
                  closeOnClick={closeOnClick}
                />
            ))}
        </div>
    );
}

export function SidebarRoutes({ closeOnClick = false }: { closeOnClick?: boolean }) {
    return (
        <Suspense fallback={<div className="flex w-full flex-col pt-0" aria-hidden />}>
            <SidebarRoutesInner closeOnClick={closeOnClick} />
        </Suspense>
    );
}