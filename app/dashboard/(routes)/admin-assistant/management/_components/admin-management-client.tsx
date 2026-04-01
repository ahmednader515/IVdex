"use client";

import { Suspense } from "react";
import { AdminUsersPanel } from "../../_components/admin-users-panel";

function AdminManagementShell() {
  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">ادارة الحسابات</h1>
      <AdminUsersPanel embedded />
    </div>
  );
}

export function AdminManagementClient() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <div className="text-center text-muted-foreground">جاري التحميل...</div>
        </div>
      }
    >
      <AdminManagementShell />
    </Suspense>
  );
}
