"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type { LucideIcon } from "lucide-react";
import {
  Layout,
  Compass,
  Wallet,
  List,
  FileText,
  Users,
  BarChart,
  Ticket,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isDashboardSectionActive } from "@/lib/dashboard-nav";

type NavItem = { href: string; label: string; icon: LucideIcon };

const guestNav: NavItem[] = [
  { href: "/dashboard", label: "الرئيسية", icon: Layout },
  { href: "/dashboard/search", label: "الكورسات", icon: Compass },
  { href: "/dashboard/balance", label: "الرصيد", icon: Wallet },
];

const adminNav: NavItem[] = [
  { href: "/dashboard/admin/courses", label: "كورساتي", icon: List },
  { href: "/dashboard/admin/assessments", label: "اختبارات ودرجات", icon: FileText },
  { href: "/dashboard/admin/management", label: "إدارة الطلاب", icon: Users },
  { href: "/dashboard/admin/analytics", label: "إحصائيات", icon: BarChart },
  { href: "/dashboard/admin/codes", label: "الأكواد", icon: Ticket },
];

const adminAssistantNav: NavItem[] = [
  { href: "/dashboard/admin-assistant/management", label: "ادارة الحسابات", icon: Users },
  { href: "/dashboard/admin-assistant/assessments", label: "اختبارات وتقدم", icon: FileText },
  { href: "/dashboard/admin-assistant/balances", label: "الأرصدة", icon: Wallet },
  { href: "/dashboard/admin-assistant/create-account", label: "حساب طالب", icon: Shield },
  { href: "/dashboard/admin-assistant/codes", label: "الأكواد", icon: Ticket },
];

function navForRole(role: string | undefined): NavItem[] {
  if (role === "ADMIN_ASSISTANT") return adminAssistantNav;
  if (role === "ADMIN") return adminNav;
  return guestNav;
}

function gridColsClass(count: number) {
  if (count >= 5) return "grid-cols-5";
  if (count === 4) return "grid-cols-4";
  return "grid-cols-3";
}

function MobileBottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        aria-hidden
      >
        <div className="mx-auto flex h-14 max-w-lg items-center justify-center">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
      </nav>
    );
  }

  const items = navForRole(session?.user?.role);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-card/95 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      aria-label="التنقل السريع"
    >
      <div
        className={cn("mx-auto grid max-w-lg gap-1 px-1 pt-1", gridColsClass(items.length))}
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname
            ? isDashboardSectionActive(pathname, href, searchParams.toString())
            : false;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-medium leading-tight transition-colors sm:text-xs",
                active
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "text-brand")} aria-hidden />
              <span className="line-clamp-2 text-center">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense
      fallback={
        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 backdrop-blur-md md:hidden"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          aria-hidden
        >
          <div className="mx-auto flex h-14 max-w-lg items-center justify-center">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        </nav>
      }
    >
      <MobileBottomNavContent />
    </Suspense>
  );
}
