import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseQuizOptions, stringifyQuizOptions } from "@/lib/utils";

export async function GET(
  _req: Request,
  { params }: { params: { quizId: string } }
) {
  try {
    const { userId, user } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user?.role !== "ADMIN_ASSISTANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const quiz = await db.quiz.findUnique({
      where: { id: params.quizId },
      include: {
        course: { select: { id: true, title: true } },
        questions: {
          select: {
            id: true,
            text: true,
            type: true,
            options: true,
            correctAnswer: true,
            points: true,
            imageUrl: true,
            position: true,
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const quizWithParsedOptions = {
      ...quiz,
      questions: quiz.questions.map((question) => ({
        ...question,
        options: parseQuizOptions(question.options),
      })),
    };

    return NextResponse.json(quizWithParsedOptions);
  } catch (error) {
    console.error("[ADMIN_ASSISTANT_QUIZ_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { quizId: string } }
) {
  try {
    const { userId, user } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user?.role !== "ADMIN_ASSISTANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description, questions, position, timer, maxAttempts, courseId } = await req.json();

    const currentQuiz = await db.quiz.findUnique({
      where: { id: params.quizId },
      select: { courseId: true, position: true },
    });

    if (!currentQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const targetCourseId = courseId || currentQuiz.courseId;

    const updatedQuiz = await db.quiz.update({
      where: { id: params.quizId },
      data: {
        title,
        description,
        courseId: targetCourseId,
        position,
        timer,
        maxAttempts,
      },
    });

    if (Array.isArray(questions)) {
      // Simplest approach: replace questions (keeps behavior consistent with existing admin route)
      await db.question.deleteMany({ where: { quizId: params.quizId } });
      await db.question.createMany({
        data: questions.map((q: any, idx: number) => ({
          quizId: params.quizId,
          text: q.text,
          type: q.type,
          options: stringifyQuizOptions(q.options),
          correctAnswer: String(q.correctAnswer),
          points: Number(q.points),
          imageUrl: q.imageUrl ?? null,
          position: idx + 1,
        })),
      });
    }

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error("[ADMIN_ASSISTANT_QUIZ_PATCH]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { quizId: string } }
) {
  try {
    const { userId, user } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN_ASSISTANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { quizId } = params;

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        courseId: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.question.deleteMany({
        where: { quizId },
      });

      await tx.quiz.delete({
        where: { id: quizId },
      });

      const remainingQuizzes = await tx.quiz.findMany({
        where: { courseId: quiz.courseId },
        orderBy: { position: "asc" },
        select: { id: true, position: true },
      });

      await Promise.all(
        remainingQuizzes.map((remainingQuiz, index) =>
          remainingQuiz.position === index + 1
            ? Promise.resolve()
            : tx.quiz.update({
                where: { id: remainingQuiz.id },
                data: { position: index + 1 },
              })
        )
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_QUIZ_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

