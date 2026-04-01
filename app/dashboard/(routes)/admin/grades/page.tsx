import { redirect } from "next/navigation";

export default function Page() {
  redirect("/dashboard/admin/assessments?tab=progress");
}
