import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getDashboardUrlByRole } from "@/lib/utils";
import { QUIZ_PASS_PERCENTAGE } from "@/lib/quiz";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuizCertificateDownloadButton } from "@/components/quiz-certificate-download-button";
import { Award } from "lucide-react";

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (session.user.role !== "STUDENT") {
    redirect(getDashboardUrlByRole(session.user.role));
  }

  const userId = session.user.id;

  const purchases = await db.purchase.findMany({
    where: { userId, status: "ACTIVE" },
    select: { courseId: true },
  });
  const allowedCourseIds = Array.from(new Set(purchases.map((p) => p.courseId)));

  const passedResults =
    allowedCourseIds.length === 0
      ? []
      : await db.quizResult.findMany({
          where: {
            studentId: userId,
            percentage: { gte: QUIZ_PASS_PERCENTAGE },
            quiz: {
              isPublished: true,
              courseId: { in: allowedCourseIds },
            },
          },
          orderBy: { submittedAt: "desc" },
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                courseId: true,
                course: { select: { title: true } },
              },
            },
          },
        });

  const latestByQuiz = new Map<string, (typeof passedResults)[number]>();
  for (const row of passedResults) {
    if (!latestByQuiz.has(row.quizId)) {
      latestByQuiz.set(row.quizId, row);
    }
  }

  const rows = Array.from(latestByQuiz.values()).sort(
    (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Certificates</h1>
          <p className="text-sm text-white/80 md:text-base">
            Download PDF certificates for quizzes you have passed. Each course quiz you complete with at
            least {QUIZ_PASS_PERCENTAGE}% appears here.
          </p>
        </div>

        {rows.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-brand" />
                No certificates yet
              </CardTitle>
              <CardDescription className="text-white/70">
                Pass a quiz in one of your enrolled courses to unlock a certificate here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/dashboard/search"
                className="inline-flex text-sm font-medium text-brand hover:underline"
              >
                Browse courses
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-4">
            {rows.map((row) => (
              <li key={row.quizId}>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="text-lg text-white">{row.quiz.course.title}</CardTitle>
                        <CardDescription className="text-white/75">{row.quiz.title}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0 bg-primary/15 text-primary">
                        {row.percentage.toFixed(0)}% · Passed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
                    <p className="text-xs text-white/60">
                      Issued from your result on{" "}
                      {row.submittedAt.toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <QuizCertificateDownloadButton
                        courseId={row.quiz.courseId}
                        quizId={row.quiz.id}
                        label="Download certificate"
                        size="sm"
                      />
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/courses/${row.quiz.courseId}/quizzes/${row.quiz.id}/result`}>
                          View result
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
