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
    if (!confirm("Are you sure you want to delete this quiz?")) {
      return;
    }

    setIsDeleting(quiz.id);
    try {
      const response = await fetch(`/api/courses/${quiz.courseId}/quizzes/${quiz.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Quiz deleted successfully");
        fetchQuizzes();
      } else {
        toast.error("Something went wrong while deleting the quiz");
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Something went wrong while deleting the quiz");
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
        <div className="text-left">
          Loading...
        </div>
      </div>
    );
  }

  const wrapClass = embedded ? "space-y-4" : "p-6 space-y-6";

  return (
    <div className={wrapClass}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz management</h1>
          <Button
            onClick={() => router.push("/dashboard/admin/quizzes/create")}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create quiz
          </Button>
        </div>
      )}

      <Card>
        {embedded ? (
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-left">Quizzes</CardTitle>
              <Button
                onClick={() => router.push("/dashboard/admin/quizzes/create")}
                className="bg-brand hover:bg-brand/90 text-white shrink-0"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
            <div className="relative w-full">
              <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
              <Input
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-h-11 ps-10"
              />
            </div>
          </CardHeader>
        ) : (
          <CardHeader>
            <CardTitle className="text-left">Quizzes</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
              <Input
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full min-h-11 ps-10"
              />
            </div>
          </CardHeader>
        )}
        <CardContent className="text-left">
          <Table className="text-left">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Title</TableHead>
                <TableHead className="text-left">Course</TableHead>
                <TableHead className="text-left">Position</TableHead>
                <TableHead className="text-left">Status</TableHead>
                <TableHead className="text-left">Questions</TableHead>
                <TableHead className="text-left">Created</TableHead>
                <TableHead className="text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell label="Title" className="font-medium">
                    {quiz.title}
                  </TableCell>
                  <TableCell label="Course">
                    <Badge variant="outline">{quiz.course.title}</Badge>
                  </TableCell>
                  <TableCell label="Position">
                    <Badge variant="secondary">{quiz.position}</Badge>
                  </TableCell>
                  <TableCell label="Status">
                    <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                      {quiz.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell label="Questions">
                    <Badge variant="secondary">{quiz.questions.length} questions</Badge>
                  </TableCell>
                  <TableCell label="Created">
                    {new Date(quiz.createdAt).toLocaleDateString("en-US")}
                  </TableCell>
                  <TableCell label="Actions">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-brand hover:bg-brand/90 text-white gap-1"
                        onClick={() => handleViewQuiz(quiz)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="bg-brand hover:bg-brand/90 text-white gap-1"
                        onClick={() => router.push(`/dashboard/admin/quizzes/${quiz.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
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
                              toast.success(quiz.isPublished ? "Unpublished" : "Published successfully");
                              fetchQuizzes();
                            }
                          } catch (error) {
                            toast.error("Something went wrong");
                          }
                        }}
                      >
                        {quiz.isPublished ? "Unpublish" : "Publish"}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={() => handleDeleteQuiz(quiz)}
                        disabled={isDeleting === quiz.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting === quiz.id ? "Deleting..." : "Delete"}
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
