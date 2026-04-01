import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { quizId: string } }
) {
  try {
    const { userId, user } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (user?.role !== "ADMIN_ASSISTANT") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { isPublished } = await req.json();

    const quiz = await db.quiz.findUnique({
      where: { id: params.quizId },
      select: { id: true },
    });

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    const updatedQuiz = await db.quiz.update({
      where: { id: params.quizId },
      data: { isPublished: Boolean(isPublished) },
    });

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.log("[ADMIN_ASSISTANT_QUIZ_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

