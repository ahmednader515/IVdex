"use client";

import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeacherQuizzesPanel } from "../_components/teacher-quizzes-panel";
import { TeacherGradesPanel } from "../_components/teacher-grades-panel";

const TAB_VALUES = ["quizzes", "progress"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(v: string | null): v is TabValue {
  return v === "quizzes" || v === "progress";
}

function AdminAssessmentsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : "quizzes";

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
      <h1 className="text-2xl font-bold md:text-3xl">الاختبارات والتقدم</h1>
      <Tabs value={activeTab} onValueChange={setTab} className="w-full">
        <TabsList className="ms-auto flex h-auto w-full max-w-lg flex-row-reverse gap-1">
          <TabsTrigger value="quizzes" className="min-h-12 flex-1 px-4 text-sm sm:min-h-11 sm:text-sm">
            الاختبارات
          </TabsTrigger>
          <TabsTrigger value="progress" className="min-h-12 flex-1 px-4 text-sm sm:min-h-11 sm:text-sm">
            تقدم الطلاب
          </TabsTrigger>
        </TabsList>
        <TabsContent value="quizzes" className="mt-4 focus-visible:outline-none">
          <TeacherQuizzesPanel embedded />
        </TabsContent>
        <TabsContent value="progress" className="mt-4 focus-visible:outline-none">
          <TeacherGradesPanel embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminAssessmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <div className="text-right text-muted-foreground" dir="rtl">
            جاري التحميل...
          </div>
        </div>
      }
    >
      <AdminAssessmentsContent />
    </Suspense>
  );
}
