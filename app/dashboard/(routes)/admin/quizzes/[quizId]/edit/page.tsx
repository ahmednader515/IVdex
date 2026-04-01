"use client";

import { useParams } from "next/navigation";
import { EditQuizForm } from "../_components/edit-quiz-form";

export default function AdminEditQuizPage() {
    const params = useParams();
    const quizId = params.quizId as string;

    return (
        <EditQuizForm
            quizId={quizId}
            variant="page"
            dashboardPath="/dashboard/admin/assessments?tab=quizzes"
        />
    );
}
