import { redirect } from "next/navigation";

export default function Page({ params }: { params: { quizId: string } }) {
  redirect(`/dashboard/admin-assistant/quizzes/${params.quizId}/edit`);
}

