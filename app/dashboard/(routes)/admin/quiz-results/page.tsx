"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowLeft, Eye, Download, Filter } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

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
    };
}

const QuizResultsContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const quizId = searchParams.get('quizId');
    
    const [results, setResults] = useState<QuizResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [quizDetails, setQuizDetails] = useState<any>(null);
    const [filteredResults, setFilteredResults] = useState<QuizResult[]>([]);

    useEffect(() => {
        if (quizId) {
            fetchQuizResults();
            fetchQuizDetails();
        } else {
            toast.error("No quiz selected");
            router.push("/dashboard/admin/courses");
        }
    }, [quizId]);

    useEffect(() => {
        // Filter results based on search term
        let filtered = results;
        
        if (searchTerm) {
            filtered = filtered.filter(result =>
                result.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                result.user.phoneNumber.includes(searchTerm)
            );
        }
        
        setFilteredResults(filtered);
    }, [results, searchTerm]);

    const fetchQuizResults = async () => {
        try {
            const response = await fetch(`/api/admin/quiz-results?quizId=${quizId}`);
            if (response.ok) {
                const data = await response.json();
                setResults(data);
            } else {
                toast.error("Something went wrong while loading results");
            }
        } catch (error) {
            console.error("Error fetching quiz results:", error);
            toast.error("Something went wrong while loading results");
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizDetails = async () => {
        try {
            const response = await fetch(`/api/admin/quizzes/${quizId}`);
            if (response.ok) {
                const data = await response.json();
                setQuizDetails(data);
            }
        } catch (error) {
            console.error("Error fetching quiz details:", error);
        }
    };

    const handleViewDetails = (result: QuizResult) => {
        router.push(`/dashboard/admin/quiz-results/${result.id}`);
    };

    const calculatePercentage = (score: number, totalPoints: number) => {
        return totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    };

    const getGradeColor = (percentage: number) => {
        if (percentage >= 90) return "text-green-600";
        if (percentage >= 80) return "text-blue-600";
        if (percentage >= 70) return "text-yellow-600";
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

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (!quizId) {
        return (
            <div className="p-6">
                <div className="text-center text-muted-foreground">No quiz selected</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col items-start gap-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            const cid =
                                quizDetails?.courseId ?? quizDetails?.course?.id;
                            if (cid) {
                                router.push(
                                    `/dashboard/admin/courses/${cid}?tab=content`
                                );
                            } else {
                                router.push("/dashboard/admin/courses");
                            }
                        }}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to content
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Quiz results: {quizDetails?.title || "Loading…"}
                    </h1>
                </div>
            </div>

            {quizDetails && (
                <Card>
                    <CardHeader>
                        <CardTitle>Quiz information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="font-medium mb-1">Quiz title</h4>
                                <p className="text-sm text-muted-foreground">{quizDetails.title}</p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-1">Course</h4>
                                <p className="text-sm text-muted-foreground">{quizDetails.course?.title}</p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-1">Questions</h4>
                                <Badge variant="secondary">
                                    {quizDetails.questions?.length || 0} question{(quizDetails.questions?.length || 0) !== 1 ? "s" : ""}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total submissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{results.length}</div>
                        <p className="text-xs text-muted-foreground">submissions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Average score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {results.length > 0 
                                ? Math.round(results.reduce((sum, r) => sum + calculatePercentage(r.score, r.totalPoints), 0) / results.length)
                                : 0
                            }%
                        </div>
                        <p className="text-xs text-muted-foreground">average</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Highest</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {results.length > 0 
                                ? Math.max(...results.map(r => calculatePercentage(r.score, r.totalPoints)))
                                : 0
                            }%
                        </div>
                        <p className="text-xs text-muted-foreground">best</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Lowest</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {results.length > 0 
                                ? Math.min(...results.map(r => calculatePercentage(r.score, r.totalPoints)))
                                : 0
                            }%
                        </div>
                        <p className="text-xs text-muted-foreground">lowest</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Student results</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search students…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-left">Student</TableHead>
                                <TableHead className="text-left">Score</TableHead>
                                <TableHead className="text-left">Percent</TableHead>
                                <TableHead className="text-left">Grade</TableHead>
                                <TableHead className="text-left">Submitted</TableHead>
                                <TableHead className="text-left">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredResults.map((result) => {
                                const percentage = calculatePercentage(result.score, result.totalPoints);
                                const grade = getGradeBadge(percentage);
                                
                                return (
                                    <TableRow key={result.id}>
                                        <TableCell label="Student" className="font-medium">
                                            <div>
                                                <div>{result.user.fullName}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {result.user.phoneNumber}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell label="Score">
                                            <div className="font-medium">
                                                {result.score} / {result.totalPoints}
                                            </div>
                                        </TableCell>
                                        <TableCell label="Percent">
                                            <div className={`font-medium ${getGradeColor(percentage)}`}>
                                                {percentage}%
                                            </div>
                                        </TableCell>
                                        <TableCell label="Grade">
                                            <Badge variant={grade.variant}>
                                                {grade.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell label="Submitted">
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(result.submittedAt).toLocaleDateString("en-US")}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(result.submittedAt).toLocaleTimeString("en-US")}
                                            </div>
                                        </TableCell>
                                        <TableCell label="Actions">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleViewDetails(result)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    
                    {filteredResults.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No results to show</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const QuizResultsPage = () => {
    return (
        <Suspense fallback={
            <div className="p-6">
                <div className="text-center">Loading...</div>
            </div>
        }>
            <QuizResultsContent />
        </Suspense>
    );
};

export default QuizResultsPage; 