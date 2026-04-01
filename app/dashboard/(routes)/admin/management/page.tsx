"use client";

import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeacherUsersPanel } from "../_components/teacher-users-panel";
import { TeacherBalancesPanel } from "../_components/teacher-balances-panel";
import { TeacherAddCoursesPanel } from "../_components/teacher-add-courses-panel";
import { TeacherPasswordsPanel } from "../_components/teacher-passwords-panel";
import { CreateStudentAccountPanel } from "@/app/dashboard/_components/create-student-account-panel";

const TAB_VALUES = ["users", "balances", "courses", "passwords", "create-account"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(v: string | null): v is TabValue {
  return (
    v === "users" ||
    v === "balances" ||
    v === "courses" ||
    v === "passwords" ||
    v === "create-account"
  );
}

function TeacherManagementContent() {
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
    <div className="space-y-4 p-4 md:space-y-6 md:p-6" dir="rtl">
      <h1 className="text-right text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
        إدارة الطلاب والحسابات
      </h1>
      <Tabs value={activeTab} onValueChange={setTab} className="w-full">
        <TabsList className="flex h-auto w-full flex-row-reverse flex-nowrap items-stretch justify-start gap-2 overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch] rounded-xl bg-transparent p-0 pb-1">
          <TabsTrigger
            value="users"
            className="min-h-11 shrink-0 rounded-xl border border-border/70 bg-card px-4 text-sm font-semibold text-foreground shadow-sm data-[state=active]:border-brand/40 data-[state=active]:bg-brand/10 data-[state=active]:text-brand data-[state=active]:shadow-none"
          >
            المستخدمين
          </TabsTrigger>
          <TabsTrigger
            value="balances"
            className="min-h-11 shrink-0 rounded-xl border border-border/70 bg-card px-4 text-sm font-semibold text-foreground shadow-sm data-[state=active]:border-brand/40 data-[state=active]:bg-brand/10 data-[state=active]:text-brand data-[state=active]:shadow-none"
          >
            الأرصدة
          </TabsTrigger>
          <TabsTrigger
            value="courses"
            className="min-h-11 shrink-0 rounded-xl border border-border/70 bg-card px-4 text-sm font-semibold text-foreground shadow-sm data-[state=active]:border-brand/40 data-[state=active]:bg-brand/10 data-[state=active]:text-brand data-[state=active]:shadow-none"
          >
            اضافة و حذف الكورسات
          </TabsTrigger>
          <TabsTrigger
            value="passwords"
            className="min-h-11 shrink-0 rounded-xl border border-border/70 bg-card px-4 text-sm font-semibold text-foreground shadow-sm data-[state=active]:border-brand/40 data-[state=active]:bg-brand/10 data-[state=active]:text-brand data-[state=active]:shadow-none"
          >
            كلمات المرور
          </TabsTrigger>
          <TabsTrigger
            value="create-account"
            className="min-h-11 shrink-0 rounded-xl border border-border/70 bg-card px-4 text-sm font-semibold text-foreground shadow-sm data-[state=active]:border-brand/40 data-[state=active]:bg-brand/10 data-[state=active]:text-brand data-[state=active]:shadow-none"
          >
            انشاء حساب طالب
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4 focus-visible:outline-none">
          <TeacherUsersPanel embedded />
        </TabsContent>
        <TabsContent value="balances" className="mt-4 focus-visible:outline-none">
          <TeacherBalancesPanel embedded />
        </TabsContent>
        <TabsContent value="courses" className="mt-4 focus-visible:outline-none">
          <TeacherAddCoursesPanel embedded />
        </TabsContent>
        <TabsContent value="passwords" className="mt-4 focus-visible:outline-none">
          <TeacherPasswordsPanel embedded />
        </TabsContent>
        <TabsContent value="create-account" className="mt-4 focus-visible:outline-none">
          <CreateStudentAccountPanel variant="admin" embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TeacherManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <div className="text-center text-muted-foreground">جاري التحميل...</div>
        </div>
      }
    >
      <TeacherManagementContent />
    </Suspense>
  );
}
