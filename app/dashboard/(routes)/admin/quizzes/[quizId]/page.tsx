"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Quiz {
    id: string;
    title: string;
    description: string;
    courseId: string;
    position: number;
    isPublished: boolean;
    course: {
        id: string;
        title: string;
    };
    questions: Question[];
    createdAt: string;
    updatedAt: string;
}

interface Question {
    id: string;
    text: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
    options?: string[];
    correctAnswer: string;
    points: number;
}

const QuizViewPage = ({ params }: { params: Promise<{ quizId: string }> }) => {
    const router = useRouter();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Unwrap the params Promise
    const resolvedParams = use(params);
    const { quizId } = resolvedParams;

    useEffect(() => {
        fetchQuiz();
    }, [quizId]);

    const fetchQuiz = async () => {
        try {
            const response = await fetch(`/api/admin/quizzes/${quizId}`);
            if (response.ok) {
                const data = await response.json();
                setQuiz(data);
            } else {
                toast.error("Quiz not found");
                router.push("/dashboard/admin/courses");
            }
        } catch (error) {
            console.error("Error fetching quiz:", error);
            toast.error("Something went wrong while loading the quiz");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiz = async () => {
        if (!quiz || !confirm("Are you sure you want to delete this quiz?")) {
            return;
        }

        try {
            const response = await fetch(`/api/courses/${quiz.courseId}/quizzes/${quiz.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Quiz deleted");
                router.push(`/dashboard/admin/courses/${quiz.courseId}?tab=content`);
            } else {
                toast.error("Something went wrong while deleting the quiz");
            }
        } catch (error) {
            console.error("Error deleting quiz:", error);
            toast.error("Something went wrong while deleting the quiz");
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center text-muted-foreground">Loading…</div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="p-6">
                <div className="text-center text-muted-foreground">Quiz not found</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() =>
                            router.push(
                                `/dashboard/admin/courses/${quiz.courseId}?tab=content`
                            )
                        }
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to content
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {quiz.title}
                    </h1>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/admin/quizzes/${quiz.id}/edit`)}
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteQuiz}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quiz details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Description</h3>
                                <p className="text-muted-foreground">{quiz.description || "No description"}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium mb-1">Course</h4>
                                    <Badge variant="outline">{quiz.course.title}</Badge>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">Position</h4>
                                    <Badge variant="secondary">{quiz.position}</Badge>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">Status</h4>
                                    <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                                        {quiz.isPublished ? "Published" : "Draft"}
                                    </Badge>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-1">Questions</h4>
                                    <Badge variant="secondary">{quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                Questions ({quiz.questions.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {quiz.questions.map((question, index) => (
                                <div key={question.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium">Question {index + 1}</h4>
                                        <Badge variant="outline">{question.points} pt{question.points !== 1 ? "s" : ""}</Badge>
                                    </div>
                                    
                                    <p className="text-muted-foreground mb-3">{question.text}</p>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Badge variant="secondary">{question.type}</Badge>
                                        </div>
                                        
                                        {question.type === "MULTIPLE_CHOICE" && question.options && (
                                            <div className="space-y-2">
                                                <h5 className="font-medium text-sm">Options:</h5>
                                                <div className="space-y-1">
                                                    {question.options.map((option, optionIndex) => (
                                                        <div
                                                            key={optionIndex}
                                                            className={`p-2 rounded border ${
                                                                option === question.correctAnswer
                                                                    ? "bg-green-50 border-green-200"
                                                                    : "bg-gray-50"
                                                            }`}
                                                        >
                                                            <span className="text-sm">
                                                                {optionIndex + 1}. {option}
                                                                {option === question.correctAnswer && (
                                                                    <Badge variant="default" className="mr-2">
                                                                        Correct
                                                                    </Badge>
                                                                )}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {question.type === "TRUE_FALSE" && (
                                            <div className="space-y-2">
                                                <h5 className="font-medium text-sm">Correct answer:</h5>
                                                <Badge variant="default">
                                                    {question.correctAnswer === "true" ? "True" : "False"}
                                                </Badge>
                                            </div>
                                        )}
                                        
                                        {question.type === "SHORT_ANSWER" && (
                                            <div className="space-y-2">
                                                <h5 className="font-medium text-sm">Correct answer:</h5>
                                                <p className="text-sm bg-green-50 p-2 rounded border border-green-200">
                                                    {question.correctAnswer}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span>Total points</span>
                                <Badge variant="default">
                                    {quiz.questions.reduce((sum, q) => sum + q.points, 0)} pts
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Created</span>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(quiz.createdAt).toLocaleDateString("en-US")}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Last updated</span>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(quiz.updatedAt).toLocaleDateString("en-US")}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/admin/quizzes/${quiz.id}/edit`)}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit quiz
                            </Button>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/admin/quiz-results?quizId=${quiz.id}`)}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                View results
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default QuizViewPage; 