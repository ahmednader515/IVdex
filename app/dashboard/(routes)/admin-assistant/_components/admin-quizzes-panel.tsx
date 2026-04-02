"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useNavigationRouter } from "@/lib/hooks/use-navigation-router";

interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  position: number;
  isPublished: boolean;
  course: { id: string; title: string };
  questions: { id: string }[];
  createdAt: string;
}

export function AdminQuizzesPanel({ embedded = false }: { embedded?: boolean }) {
  const router = useNavigationRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch("/api/admin-assistant/quizzes");
        if (response.ok) {
          const data = await response.json();
          setQuizzes(data);
        } else {
          toast.error("Could not load quizzes");
        }
      } catch (e) {
        toast.error("Something went wrong while loading");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter((quiz) =>
    [quiz.title, quiz.course.title].some((value) =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleViewQuiz = (quiz: Quiz) => {
    router.push(`/dashboard/admin-assistant/quizzes/${quiz.id}/edit`);
  };

  const handleTogglePublish = async (quiz: Quiz) => {
    setPublishingId(quiz.id);
    try {
      const response = await fetch(`/api/admin-assistant/quizzes/${quiz.id}/publish`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublished: !quiz.isPublished }),
      });

      if (!response.ok) {
        throw new Error("Something went wrong while updating quiz status");
      }

      toast.success(quiz.isPublished ? "Unpublished" : "Published successfully");
      setQuizzes((prev) =>
        prev.map((item) =>
          item.id === quiz.id ? { ...item, isPublished: !quiz.isPublished } : item
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (quizId: string, quizTitle: string) => {
    const confirmed = window.confirm(
      `Delete quiz "${quizTitle}"? All associated questions will be removed.`
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(quizId);
    try {
      const response = await fetch(`/api/admin-assistant/quizzes/${quizId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Could not delete quiz");
      }

      setQuizzes((previous) => previous.filter((quiz) => quiz.id !== quizId));
      toast.success("Quiz deleted successfully");
    } catch (error) {
      console.error("[ADMIN_DELETE_QUIZ]", error);
      toast.error(error instanceof Error ? error.message : "Could not delete quiz");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className={embedded ? "py-4" : "p-6"}>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-4" : "p-6 space-y-6"}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">All quizzes</h1>
          <Button onClick={() => router.push("/dashboard/admin-assistant/quizzes/create")} className="bg-brand hover:bg-brand/90 text-white gap-2">
            <Plus className="h-4 w-4" />
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
                onClick={() => router.push("/dashboard/admin-assistant/quizzes/create")}
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
            <CardTitle>Quizzes</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
        )}
        <CardContent>
          <Table>
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
                    <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      className="bg-brand hover:bg-brand/90 text-white gap-1"
                      size="sm"
                      onClick={() => handleViewQuiz(quiz)}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      className="bg-brand hover:bg-brand/90 text-white gap-1"
                      size="sm"
                      onClick={() => router.push(`/dashboard/admin-assistant/quizzes/${quiz.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant={quiz.isPublished ? "destructive" : "default"}
                      className={!quiz.isPublished ? "bg-brand hover:bg-brand/90 text-white" : ""}
                      size="sm"
                      disabled={publishingId === quiz.id}
                      onClick={() => handleTogglePublish(quiz)}
                    >
                      {publishingId === quiz.id
                        ? "Updating..."
                        : quiz.isPublished
                        ? "Unpublish"
                        : "Publish"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      disabled={deletingId === quiz.id}
                      onClick={() => handleDelete(quiz.id, quiz.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === quiz.id ? "Deleting..." : "Delete"}
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
