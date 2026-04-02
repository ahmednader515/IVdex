"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Search, Eye, Award, TrendingUp, Users, FileText } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

interface Course {
  id: string;
  title: string;
}

interface Quiz {
  id: string;
  title: string;
  courseId: string;
  course: {
    title: string;
  };
  totalPoints: number;
}

interface QuizResult {
  id: string;
  studentId: string;
  user: {
    fullName: string;
    phoneNumber: string;
  };
  quizId: string;
  quiz: {
    title: string;
    course: {
      id: string;
      title: string;
    };
    totalPoints: number;
  };
  score: number;
  totalPoints: number;
  percentage: number;
  submittedAt: string;
  answers: QuizAnswer[];
}

interface QuizAnswer {
  questionId: string;
  question: {
    text: string;
    type: string;
    points: number;
  };
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
}

export function TeacherGradesPanel({ embedded = false }: { embedded?: boolean }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedQuiz, setSelectedQuiz] = useState<string>("");
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchQuizzes();
    fetchQuizResults();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/api/admin/quizzes");
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };

  const fetchQuizResults = async () => {
    try {
      const response = await fetch("/api/admin/quiz-results");
      if (response.ok) {
        const data = await response.json();
        setQuizResults(data);
      }
    } catch (error) {
      console.error("Error fetching quiz results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = (result: QuizResult) => {
    setSelectedResult(result);
    setIsDialogOpen(true);
  };

  const filteredResults = quizResults.filter((result) => {
    const matchesSearch =
      result.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.quiz.course.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = !selectedCourse || selectedCourse === "all" || result.quiz.course.id === selectedCourse;
    const matchesQuiz = !selectedQuiz || selectedQuiz === "all" || result.quizId === selectedQuiz;

    return matchesSearch && matchesCourse && matchesQuiz;
  });

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 70) return "text-green-400";
    if (percentage >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 90) return { variant: "default" as const, className: "bg-green-600 text-white" };
    if (percentage >= 80) return { variant: "default" as const, className: "bg-green-500 text-white" };
    if (percentage >= 70) return { variant: "default" as const, className: "bg-green-400 text-white" };
    if (percentage >= 60) return { variant: "default" as const, className: "bg-orange-600 text-white" };
    return { variant: "destructive" as const, className: "" };
  };

  if (loading) {
    return (
      <div className={embedded ? "py-4" : "p-6"}>
        <div className="text-left text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  const wrapClass = embedded ? "space-y-4" : "p-6 space-y-6";

  return (
    <div className={wrapClass}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-left text-3xl font-bold text-gray-900 dark:text-white">Student grades</h1>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-muted-foreground">Total students</p>
                <p className="text-2xl font-bold">{new Set(quizResults.map((r) => r.studentId)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Award className="h-8 w-8 text-green-600" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-muted-foreground">Average score</p>
                <p className="text-2xl font-bold">
                  {quizResults.length > 0
                    ? Math.round(quizResults.reduce((sum, r) => sum + r.percentage, 0) / quizResults.length)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-muted-foreground">Highest score</p>
                <p className="text-2xl font-bold">
                  {quizResults.length > 0 ? Math.max(...quizResults.map((r) => r.percentage)) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-muted-foreground">Total attempts</p>
                <p className="text-2xl font-bold">{quizResults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-left">Search filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-left text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
                <Input
                  placeholder="Search by student or quiz…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-h-11 ps-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-left text-sm font-medium">Course</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-left text-sm font-medium">Quiz</label>
              <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
                <SelectTrigger className="min-h-11">
                  <SelectValue placeholder="All quizzes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All quizzes</SelectItem>
                  {quizzes.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-left">Quiz results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Student</TableHead>
                <TableHead className="text-left">Quiz</TableHead>
                <TableHead className="text-left">Course</TableHead>
                <TableHead className="text-left">Score</TableHead>
                <TableHead className="text-left">Percent</TableHead>
                <TableHead className="text-left">Submitted</TableHead>
                <TableHead className="text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((result) => {
                const gradeBadge = getGradeBadge(result.percentage);
                return (
                  <TableRow key={result.id}>
                    <TableCell label="Student" className="font-medium">
                      {result.user.fullName}
                    </TableCell>
                    <TableCell label="Quiz">{result.quiz.title}</TableCell>
                    <TableCell label="Course">
                      <Badge variant="outline">{result.quiz.course.title}</Badge>
                    </TableCell>
                    <TableCell label="Score">
                      <span className="font-bold">
                        {result.score}/{result.totalPoints}
                      </span>
                    </TableCell>
                    <TableCell label="Percent">
                      <Badge {...gradeBadge}>{result.percentage}%</Badge>
                    </TableCell>
                    <TableCell label="Submitted">
                      {format(new Date(result.submittedAt), "MM/dd/yyyy", { locale: enUS })}
                    </TableCell>
                    <TableCell label="Actions">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-11 w-full justify-center gap-2 sm:w-auto"
                        onClick={() => handleViewResult(result)}
                      >
                        <Eye className="h-4 w-4 shrink-0" />
                        View details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-left">Result details — {selectedResult?.user.fullName}</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedResult.score}/{selectedResult.totalPoints}
                      </div>
                      <div className="text-sm text-muted-foreground">Score</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${getGradeColor(selectedResult.percentage)}`}>
                        {selectedResult.percentage}%
                      </div>
                      <div className="text-sm text-muted-foreground">Percent</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {selectedResult.answers.filter((a) => a.isCorrect).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Correct</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {selectedResult.answers.filter((a) => !a.isCorrect).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Incorrect</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Overall progress</span>
                      <span className="text-sm font-medium">{selectedResult.percentage}%</span>
                    </div>
                    <Progress value={selectedResult.percentage} className="w-full" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Answer details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedResult.answers.map((answer, index) => (
                      <div key={answer.questionId} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-medium">Question {index + 1}</h4>
                          <Badge variant={answer.isCorrect ? "default" : "destructive"}>
                            {answer.isCorrect ? "Correct" : "Wrong"}
                          </Badge>
                        </div>
                        <p className="mb-2 text-sm text-muted-foreground">{answer.question.text}</p>
                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                          <div>
                            <span className="font-medium">Student answer:</span>
                            <p className="text-muted-foreground">{answer.studentAnswer}</p>
                          </div>
                          <div>
                            <span className="font-medium">Correct answer:</span>
                            <p className="text-green-600">{answer.correctAnswer}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Points:</span>
                          <span className="text-muted-foreground">
                            {" "}
                            {answer.pointsEarned}/{answer.question.points}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
