import { auth } from "@/lib/auth";
import { CreateStudentAccountPanel } from "@/app/dashboard/_components/create-student-account-panel";
import { redirect } from "next/navigation";

export default async function AdminAssistantCreateAccountPage() {
  const { userId, user } = await auth();
  if (!userId) redirect("/");
  if (user?.role !== "ADMIN_ASSISTANT") redirect("/dashboard");

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <h1 className="text-right text-3xl font-bold text-gray-900 dark:text-white">
        إنشاء حساب طالب جديد
      </h1>
      <CreateStudentAccountPanel
        variant="admin"
        apiPath="/api/admin-assistant/create-account"
        embedded
      />
    </div>
  );
}
