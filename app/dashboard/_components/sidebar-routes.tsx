"use client";

import { Suspense } from "react";
import { BarChart, Compass, Layout, List, Wallet, Shield, Users, FileText, Ticket } from "lucide-react";
import { SidebarItem } from "./sidebar-item";
import { usePathname, useSearchParams } from "next/navigation";

const guestRoutes = [
    {
        icon: Layout,
        label: "لوحة التحكم",
        href: "/dashboard",
    },
    {
        icon: Compass,
        label: "الكورسات",
        href: "/dashboard/search",
    },
    {
        icon: Wallet,
        label: "الرصيد",
        href: "/dashboard/balance",
    },
];

const adminRoutes = [
    {
        icon: List,
        label: "كورساتي",
        href: "/dashboard/admin/courses",
    },
    {
        icon: FileText,
        label: "الاختبارات والدرجات",
        href: "/dashboard/admin/assessments",
    },
    {
        icon: BarChart,
        label: "الاحصائيات",
        href: "/dashboard/admin/analytics",
    },
    {
        icon: Users,
        label: "إدارة الطلاب والحسابات",
        href: "/dashboard/admin/management",
    },
    {
        icon: Ticket,
        label: "الاكواد",
        href: "/dashboard/admin/codes",
    },
];

const adminAssistantRoutes = [
    {
        icon: Users,
        label: "ادارة الحسابات",
        href: "/dashboard/admin-assistant/management",
    },
    {
        icon: FileText,
        label: "الاختبارات والتقدم",
        href: "/dashboard/admin-assistant/assessments",
    },
    {
        icon: Wallet,
        label: "الأرصدة",
        href: "/dashboard/admin-assistant/balances",
    },
    {
        icon: Shield,
        label: "إنشاء حساب طالب",
        href: "/dashboard/admin-assistant/create-account",
    },
    {
        icon: Ticket,
        label: "الاكواد",
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