import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCertificatePdf } from "@/lib/certificate";
import { QUIZ_PASS_PERCENTAGE } from "@/lib/quiz";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string; quizId: string }> }
) {
  try {
    const { userId } = await auth();
    const { courseId, quizId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!purchase) {
      return new NextResponse("Course access required", { status: 403 });
    }

    const latestPassedResult = await db.quizResult.findFirst({
      where: {
        studentId: userId,
        quizId,
        percentage: {
          gte: QUIZ_PASS_PERCENTAGE,
        },
      },
      orderBy: {
        attemptNumber: "desc",
      },
      include: {
        quiz: {
          select: {
            id: true,
            courseId: true,
            title: true,
            course: {
              select: {
                title: true,
              },
            },
          },
        },
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!latestPassedResult || latestPassedResult.quiz.courseId !== courseId) {
      return new NextResponse("Certificate unavailable until you pass this quiz", { status: 403 });
    }

    const pdfBytes = await generateCertificatePdf({
      studentName: latestPassedResult.user.fullName,
      courseName: latestPassedResult.quiz.course.title,
      issuedAt: latestPassedResult.submittedAt,
    });

    if (!pdfBytes?.byteLength) {
      console.error("[QUIZ_CERTIFICATE_GET] Generated PDF was empty");
      return new NextResponse("Certificate generation failed", { status: 500 });
    }

    const safeCourseName = latestPassedResult.quiz.course.title
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);
    const fileName = `certificate-${safeCourseName || "course"}-${latestPassedResult.id}.pdf`;

    const body = new Uint8Array(pdfBytes);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    console.log("[QUIZ_CERTIFICATE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

