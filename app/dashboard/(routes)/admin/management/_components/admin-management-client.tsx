"use client";

import { Suspense, useCallback, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUsersPanel } from "../../_components/admin-users-panel";
import { AdminBalancesPanel } from "../../_components/admin-balances-panel";
import { AdminAddCoursesPanel } from "../../_components/admin-add-courses-panel";
import { AdminPasswordsPanel } from "../../_components/admin-passwords-panel";
import { CreateStudentAccountPanel } from "@/app/dashboard/_components/create-student-account-panel";

const TAB_VALUES = [
  "users",
  "balances",
  "student-courses",
  "courses-list",
  "passwords",
  "create-account",
] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(v: string | null): v is TabValue {
  return (
    v === "users" ||
    v === "balances" ||
    v === "student-courses" ||
    v === "courses-list" ||
    v === "passwords" ||
    v === "create-account"
  );
}

function AdminManagementShell({ coursesTab }: { coursesTab: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : "users";

  const setTab = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("tab", value);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="space-y-4 p-4 text-right md:space-y-6 md:p-6" dir="rtl">
      <h1 className="text-right text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
        إدارة المنصة
      </h1>
      <Tabs value={activeTab} onValueChange={setTab} className="w-full">
        <TabsList className="ms-auto grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="users" className="text-[10px] leading-tight sm:text-xs">
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="balances" className="text-[10px] leading-tight sm:text-xs">
            الأرصدة
          </TabsTrigger>
          <TabsTrigger value="student-courses" className="text-[10px] leading-tight sm:text-xs">
            كورسات الطلاب
          </TabsTrigger>
          <TabsTrigger value="courses-list" className="text-[10px] leading-tight sm:text-xs">
            الكورسات
          </TabsTrigger>
          <TabsTrigger value="passwords" className="text-[10px] leading-tight sm:text-xs">
            كلمات المرور
          </TabsTrigger>
          <TabsTrigger value="create-account" className="text-[10px] leading-tight sm:text-xs">
            انشاء حساب طالب
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4 focus-visible:outline-none">
          <AdminUsersPanel embedded />
        </TabsContent>
        <TabsContent value="balances" className="mt-4 focus-visible:outline-none">
          <AdminBalancesPanel embedded />
        </TabsContent>
        <TabsContent value="student-courses" className="mt-4 focus-visible:outline-none">
          <AdminAddCoursesPanel embedded />
        </TabsContent>
        <TabsContent value="courses-list" className="mt-4 focus-visible:outline-none">
          {coursesTab}
        </TabsContent>
        <TabsContent value="passwords" className="mt-4 focus-visible:outline-none">
          <AdminPasswordsPanel embedded />
        </TabsContent>
        <TabsContent value="create-account" className="mt-4 focus-visible:outline-none">
          <CreateStudentAccountPanel variant="admin" embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function AdminManagementClient({ coursesTab }: { coursesTab: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <div className="text-center text-muted-foreground">جاري التحميل...</div>
        </div>
      }
    >
      <AdminManagementShell coursesTab={coursesTab} />
    </Suspense>
  );
}
