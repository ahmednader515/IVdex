import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminManagementClient } from "./_components/admin-management-client";

export default async function AdminManagementPage() {
  const { userId, user } = await auth();
  if (!userId) redirect("/");
  if (user?.role !== "ADMIN_ASSISTANT") redirect("/dashboard");

  return (
    <AdminManagementClient />
  );
}
