"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigationRouter } from "@/lib/hooks/use-navigation-router";

interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  position: number;
  isPublished: boolean;
  course: {
    title: string;
  };
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

interface Question {
  id: string;
  text: string;
  imageUrl?: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  options?: string[];
  correctAnswer: string;
  points: number;
}

export function TeacherQuizzesPanel({ embedded = false }: { embedded?: boolean }) {
  const router = useNavigationRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/api/admin/quizzes");
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (!confirm("هل أنت متأكد من حذف هذا الاختبار؟")) {
      return;
    }

    setIsDeleting(quiz.id);
    try {
      const response = await fetch(`/api/courses/${quiz.courseId}/quizzes/${quiz.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("تم حذف الاختبار بنجاح");
        fetchQuizzes();
      } else {
        toast.error("حدث خطأ أثناء حذف الاختبار");
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("حدث خطأ أثناء حذف الاختبار");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewQuiz = (quiz: Quiz) => {
    router.push(`/dashboard/admin/quizzes/${quiz.id}`);
  };

  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={embedded ? "py-4" : "p-6"}>
        <div className="text-right" dir="rtl">
          جاري التحميل...
        </div>
      </div>
    );
  }

  const wrapClass = embedded ? "space-y-4" : "p-6 space-y-6";

  return (
    <div className={wrapClass} dir="rtl">
      {!embedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-right text-3xl font-bold text-gray-900 dark:text-white">إدارة الاختبارات</h1>
          <Button
            onClick={() => router.push("/dashboard/admin/quizzes/create")}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            إنشاء اختبار جديد
          </Button>
        </div>
      )}

      <Card>
        {embedded ? (
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-right">الاختبارات</CardTitle>
              <Button
                onClick={() => router.push("/dashboard/admin/quizzes/create")}
                className="bg-brand hover:bg-brand/90 text-white shrink-0"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                إنشاء جديد
              </Button>
            </div>
            <div className="relative w-full">
              <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
              <Input
                placeholder="البحث في الاختبارات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-h-11 ps-10"
              />
            </div>
          </CardHeader>
        ) : (
          <CardHeader>
            <CardTitle className="text-right">الاختبارات</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
              <Input
                placeholder="البحث في الاختبارات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-h-11 ps-10"
              />
            </div>
          </CardHeader>
        )}
        <CardContent className="text-right">
          <Table className="text-right">
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">عنوان الاختبار</TableHead>
                <TableHead className="text-right">الكورس</TableHead>
                <TableHead className="text-right">الموقع</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">عدد الأسئلة</TableHead>
                <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell label="عنوان الاختبار" className="font-medium">
                    {quiz.title}
                  </TableCell>
                  <TableCell label="الكورس">
                    <Badge variant="outline">{quiz.course.title}</Badge>
                  </TableCell>
                  <TableCell label="الموقع">
                    <Badge variant="secondary">{quiz.position}</Badge>
                  </TableCell>
                  <TableCell label="الحالة">
                    <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                      {quiz.isPublished ? "منشور" : "غير منشور"}
                    </Badge>
                  </TableCell>
                  <TableCell label="عدد الأسئلة">
                    <Badge variant="secondary">{quiz.questions.length} سؤال</Badge>
                  </TableCell>
                  <TableCell label="تاريخ الإنشاء">
                    {new Date(quiz.createdAt).toLocaleDateString("ar-EG")}
                  </TableCell>
                  <TableCell label="الإجراءات">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-brand hover:bg-brand/90 text-white"
                        onClick={() => handleViewQuiz(quiz)}
                      >
                        <Eye className="h-4 w-4" />
                        عرض
                      </Button>
                      <Button
                        size="sm"
                        className="bg-brand hover:bg-brand/90 text-white"
                        onClick={() => router.push(`/dashboard/admin/quizzes/${quiz.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant={quiz.isPublished ? "destructive" : "default"}
                        className={!quiz.isPublished ? "bg-brand hover:bg-brand/90 text-white" : ""}
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/admin/quizzes/${quiz.id}/publish`, {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                isPublished: !quiz.isPublished,
                              }),
                            });
                            if (response.ok) {
                              toast.success(quiz.isPublished ? "تم إلغاء النشر" : "تم النشر بنجاح");
                              fetchQuizzes();
                            }
                          } catch (error) {
                            toast.error("حدث خطأ");
                          }
                        }}
                      >
                        {quiz.isPublished ? "إلغاء النشر" : "نشر"}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteQuiz(quiz)}
                        disabled={isDeleting === quiz.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting === quiz.id ? "جاري الحذف..." : "حذف"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
