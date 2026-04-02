"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, XCircle, FileText, User, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { parseQuizOptions } from "@/lib/utils";

interface QuizResult {
    id: string;
    studentId: string;
    quizId: string;
    score: number;
    totalPoints: number;
    submittedAt: string;
    user: {
        fullName: string;
        phoneNumber: string;
    };
    quiz: {
        title: string;
        course: {
            id: string;
            title: string;
        };
    };
    answers: QuizAnswer[];
}

interface QuizAnswer {
    id: string;
    questionId: string;
    answer: string;
    isCorrect: boolean;
    points: number;
    question: {
        text: string;
        type: string;
        points: number;
        options?: string[];
        correctAnswer?: string;
        imageUrl?: string;
    };
}

const QuizResultDetailPage = ({ params }: { params: Promise<{ resultId: string }> }) => {
    const router = useRouter();
    const [result, setResult] = useState<QuizResult | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Unwrap the params Promise
    const resolvedParams = use(params);
    const { resultId } = resolvedParams;

    useEffect(() => {
        fetchQuizResult();
    }, [resultId]);

    const fetchQuizResult = async () => {
        try {
            const response = await fetch(`/api/admin/quiz-results/${resultId}`);
            if (response.ok) {
                const data = await response.json();
                // Parse options for multiple choice questions
                const parsedData = {
                    ...data,
                    answers: data.answers.map((answer: any) => ({
                        ...answer,
                        question: {
                            ...answer.question,
                            options: parseQuizOptions(answer.question.options)
                        }
                    }))
                };
                setResult(parsedData);
            } else {
                toast.error("Result not found");
                router.push("/dashboard/admin/quiz-results");
            }
        } catch (error) {
            console.error("Error fetching quiz result:", error);
            toast.error("Something went wrong while loading the result");
        } finally {
            setLoading(false);
        }
    };

    const calculatePercentage = (score: number, totalPoints: number) => {
        return totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    };

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return "text-green-600";
        if (percentage >= 80) return "text-green-500";
        if (percentage >= 70) return "text-green-400";
        if (percentage >= 60) return "text-orange-600";
        return "text-red-600";
    };

    const getGradeBadge = (percentage: number) => {
        if (percentage >= 90) return { variant: "default" as const, text: "Excellent" };
        if (percentage >= 80) return { variant: "default" as const, text: "Very good" };
        if (percentage >= 70) return { variant: "secondary" as const, text: "Good" };
        if (percentage >= 60) return { variant: "outline" as const, text: "Pass" };
        return { variant: "destructive" as const, text: "Needs work" };
    };

    const renderQuestionChoices = (answer: QuizAnswer) => {
        if (answer.question.type === "MULTIPLE_CHOICE" && answer.question.options) {
            return (
                <div className="space-y-2">
                    <h5 className="font-medium text-sm">Options:</h5>
                    <div className="space-y-1">
                        {answer.question.options.map((option: string, optionIndex: number) => (
                            <div
                                key={optionIndex}
                                className={`p-2 rounded border ${
                                    option === answer.answer
                                        ? answer.isCorrect
                                            ? "bg-green-50 border-green-200"
                                            : "bg-red-50 border-red-200"
                                        : option === answer.question.correctAnswer
                                        ? "bg-green-50 border-green-200"
                                        : "bg-gray-50"
                                }`}
                            >
                                <span className="text-sm">
                                    {optionIndex + 1}. {option}
                                    {option === answer.answer && (
                                        <Badge variant={answer.isCorrect ? "default" : "destructive"} className="mr-2">
                                            Student answer
                                        </Badge>
                                    )}
                                    {option === answer.question.correctAnswer && option !== answer.answer && (
                                        <Badge variant="default" className="mr-2">
                                            Correct answer
                                        </Badge>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="p-6">
                <div className="text-center text-muted-foreground">Result not found</div>
            </div>
        );
    }

    const percentage = calculatePercentage(result.score, result.totalPoints);
    const grade = getGradeBadge(percentage);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col items-start gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/dashboard/admin/quiz-results")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Result details
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Student and quiz</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-3">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <h4 className="font-medium">Student</h4>
                                        <p className="text-sm text-muted-foreground">{result.user.fullName}</p>
                                        <p className="text-xs text-muted-foreground">{result.user.phoneNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <h4 className="font-medium">Quiz</h4>
                                        <p className="text-sm text-muted-foreground">{result.quiz.title}</p>
                                        <p className="text-xs text-muted-foreground">{result.quiz.course.title}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <h4 className="font-medium">Submitted date</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(result.submittedAt).toLocaleDateString("en-US")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <h4 className="font-medium">Submitted time</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(result.submittedAt).toLocaleTimeString("en-US")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Final score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-2xl font-bold">{result.score} / {result.totalPoints}</div>
                                    <p className="text-sm text-muted-foreground">Score</p>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <div className={`text-2xl font-bold ${getGradeColor(percentage)}`}>
                                        {percentage}%
                                    </div>
                                    <p className="text-sm text-muted-foreground">Percent</p>
                                </div>
                                <div className="text-center p-4 border rounded-lg">
                                    <Badge variant={grade.variant} className="text-lg px-4 py-2">
                                        {grade.text}
                                    </Badge>
                                    <p className="text-sm text-muted-foreground mt-2">Grade</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Answer breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {result.answers.map((answer, index) => (
                                <div key={answer.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium">Question {index + 1}</h4>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant="outline">{answer.question.points} pts</Badge>
                                            {answer.isCorrect ? (
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-600" />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <p className="text-muted-foreground mb-3">{answer.question.text}</p>
                                    
                                    {/* Question Image */}
                                    {answer.question.imageUrl && (
                                        <div className="mb-3">
                                            <img 
                                                src={answer.question.imageUrl} 
                                                alt="Question" 
                                                className="max-w-full h-auto max-h-64 rounded-lg border shadow-sm"
                                            />
                                        </div>
                                    )}
                                    
                                    {answer.question.type === "MULTIPLE_CHOICE" && renderQuestionChoices(answer)}
                                    
                                    {answer.question.type === "TRUE_FALSE" && (
                                        <div className="space-y-2">
                                            <h5 className="font-medium text-sm">Correct answer:</h5>
                                            <div className="space-y-1">
                                                <div className={`p-2 rounded border ${
                                                    answer.question.correctAnswer === "true"
                                                        ? "bg-green-50 border-green-200"
                                                        : "bg-gray-50"
                                                }`}>
                                                    <span className="text-sm">True</span>
                                                    {answer.question.correctAnswer === "true" && (
                                                        <Badge variant="default" className="mr-2">Correct</Badge>
                                                    )}
                                                </div>
                                                <div className={`p-2 rounded border ${
                                                    answer.question.correctAnswer === "false"
                                                        ? "bg-green-50 border-green-200"
                                                        : "bg-gray-50"
                                                }`}>
                                                    <span className="text-sm">False</span>
                                                    {answer.question.correctAnswer === "false" && (
                                                        <Badge variant="default" className="mr-2">Correct</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <span className="text-sm font-medium">Student answer: </span>
                                                <Badge variant={answer.isCorrect ? "default" : "destructive"}>
                                                    {answer.answer === "true" ? "True" : "False"}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {answer.question.type === "SHORT_ANSWER" && (
                                        <div className="space-y-2">
                                            <h5 className="font-medium text-sm">Correct answer:</h5>
                                            <p className="text-sm bg-green-50 p-2 rounded border border-green-200">
                                                {answer.question.correctAnswer}
                                            </p>
                                            <div className="mt-2">
                                                <span className="text-sm font-medium">Student answer: </span>
                                                <p className={`text-sm p-2 rounded border ${
                                                    answer.isCorrect 
                                                        ? "bg-green-50 border-green-200" 
                                                        : "bg-red-50 border-red-200"
                                                }`}>
                                                    {answer.answer}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="mt-3 pt-3 border-t">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Points earned:</span>
                                            <span className={`text-sm font-medium ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                {answer.points} / {answer.question.points}
                                            </span>
                                        </div>
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
                                <Badge variant="default">{result.totalPoints} pts</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Earned</span>
                                <Badge variant="secondary">{result.score} pts</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Missed</span>
                                <Badge variant="outline">{result.totalPoints - result.score} pts</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Correct questions</span>
                                <Badge variant="default">
                                    {result.answers.filter(a => a.isCorrect).length} question{result.answers.filter(a => a.isCorrect).length !== 1 ? "s" : ""}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Incorrect questions</span>
                                <Badge variant="destructive">
                                    {result.answers.filter(a => !a.isCorrect).length} question{result.answers.filter(a => !a.isCorrect).length !== 1 ? "s" : ""}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/admin/quiz-results?quizId=${result.quizId}`)}
                            >
                                View all results for this quiz
                            </Button>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/admin/quizzes/${result.quizId}`)}
                            >
                                View quiz details
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default QuizResultDetailPage; 