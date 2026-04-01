import { AdminBalancesPanel } from "../_components/admin-balances-panel";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminAssistantBalancesPage() {
  const { userId, user } = await auth();
  if (!userId) redirect("/");
  if (user?.role !== "ADMIN_ASSISTANT") redirect("/dashboard");

  return <AdminBalancesPanel />;
}
