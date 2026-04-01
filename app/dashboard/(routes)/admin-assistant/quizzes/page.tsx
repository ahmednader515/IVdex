import { redirect } from "next/navigation";

export default function Page() {
  redirect("/dashboard/admin-assistant/assessments?tab=quizzes");
}
