"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, X, Mic, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { UploadDropzone } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import axios from "axios";

interface Course {
    id: string;
    title: string;
    isPublished: boolean;
}

interface Chapter {
    id: string;
    title: string;
    position: number;
    isPublished: boolean;
}

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
    timer?: number;
    maxAttempts?: number;
}

interface Question {
    id: string;
    text: string;
    imageUrl?: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
    options?: string[];
    correctAnswer: string | number;
    points: number;
}

interface CourseItem {
    id: string;
    title: string;
    type: "chapter" | "quiz";
    position: number;
    isPublished: boolean;
}

const cardClass =
    "rounded-xl border border-border/80 bg-card p-4 shadow-sm md:p-5 ring-offset-background focus-within:ring-2 focus-within:ring-brand/20 focus-within:ring-offset-2";

export type EditQuizFormProps = {
    quizId: string;
    /** When set (e.g. course hub sheet), course is fixed and the selector is hidden */
    fixedCourseId?: string;
    variant: "page" | "sheet";
    dashboardPath: string;
    /** Base path for quiz API routes (default: /api/admin). */
    apiBasePath?: "/api/admin" | "/api/admin-assistant";
    onSaved?: () => void;
};

export function EditQuizForm({
    quizId,
    fixedCourseId,
    variant,
    dashboardPath,
    apiBasePath = "/api/admin",
    onSaved,
}: EditQuizFormProps) {
    const router = useRouter();
    const lockCourse = Boolean(fixedCourseId);

    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>(fixedCourseId ?? "");
    const [quizTitle, setQuizTitle] = useState("");
    const [quizDescription, setQuizDescription] = useState("");
    const [quizTimer, setQuizTimer] = useState<number | null>(null);
    const [quizMaxAttempts, setQuizMaxAttempts] = useState<number>(1);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<number>(1);
    const [courseItems, setCourseItems] = useState<CourseItem[]>([]);
    const [isLoadingCourseItems, setIsLoadingCourseItems] = useState(false);
    const [isUpdatingQuiz, setIsUpdatingQuiz] = useState(false);
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
    const [listeningQuestionId, setListeningQuestionId] = useState<string | null>(null);
    const [isPublished, setIsPublished] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (fixedCourseId) {
            setSelectedCourse(fixedCourseId);
        }
    }, [fixedCourseId]);

    useEffect(() => {
        if (!lockCourse) {
            fetchCourses();
        }
        fetchQuiz();
    }, [quizId, lockCourse]);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
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

    const fetchQuiz = async () => {
        try {
            const response = await fetch(`${apiBasePath}/quizzes/${quizId}`);
            if (response.ok) {
                const quiz: Quiz = await response.json();
                setQuizTitle(quiz.title);
                setQuizDescription(quiz.description);
                setQuizTimer(quiz.timer || null);
                setQuizMaxAttempts(quiz.maxAttempts || 1);
                setSelectedCourse(quiz.courseId);
                setIsPublished(!!quiz.isPublished);

                const processedQuestions = quiz.questions.map((question) => {
                    if (question.type === "MULTIPLE_CHOICE" && question.options) {
                        const validOptions = question.options.filter((option) => option.trim() !== "");
                        const correctAnswerIndex = validOptions.findIndex(
                            (option) => option === question.correctAnswer
                        );
                        return {
                            ...question,
                            correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
                        };
                    }
                    return question;
                });

                setQuestions(processedQuestions);
                setSelectedPosition(quiz.position);
                await fetchCourseItems(quiz.courseId);
            } else {
                toast.error("Something went wrong while loading the quiz");
                if (variant === "page") {
                    router.push(dashboardPath);
                }
            }
        } catch (error) {
            console.error("Error fetching quiz:", error);
            toast.error("Something went wrong while loading the quiz");
            if (variant === "page") {
                router.push(dashboardPath);
            }
        } finally {
            setIsLoadingQuiz(false);
        }
    };

    const fetchCourseItems = async (courseId: string) => {
        try {
            setIsLoadingCourseItems(true);
            setCourseItems([]);

            const [chaptersResponse, quizzesResponse] = await Promise.all([
                fetch(`/api/courses/${courseId}/chapters`),
                fetch(`/api/courses/${courseId}/quizzes`),
            ]);

            const chaptersData = chaptersResponse.ok ? await chaptersResponse.json() : [];
            const quizzesData = quizzesResponse.ok ? await quizzesResponse.json() : [];

            const items: CourseItem[] = [
                ...chaptersData.map((chapter: Chapter) => ({
                    id: chapter.id,
                    title: chapter.title,
                    type: "chapter" as const,
                    position: chapter.position,
                    isPublished: chapter.isPublished,
                })),
                ...quizzesData.map((q: Quiz) => ({
                    id: q.id,
                    title: q.title,
                    type: "quiz" as const,
                    position: q.position,
                    isPublished: q.isPublished,
                })),
            ];

            items.sort((a, b) => a.position - b.position);

            setCourseItems(items);

            const quizInList = items.find((item) => item.id === quizId);
            if (quizInList) {
                setSelectedPosition(quizInList.position);
            }
        } catch (error) {
            console.error("Error fetching course items:", error);
            setCourseItems([]);
        } finally {
            setIsLoadingCourseItems(false);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (error) {
                console.error("[SPEECH_RECOGNITION_STOP]", error);
            }
            recognitionRef.current = null;
        }
        setListeningQuestionId(null);
    };

    const handleSpeechInput = (index: number) => {
        if (typeof window === "undefined") {
            return;
        }

        const question = questions[index];
        if (!question) {
            return;
        }

        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            toast.error("This browser does not support voice dictation");
            return;
        }

        if (listeningQuestionId === question.id) {
            stopListening();
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = "en-US";
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setListeningQuestionId(question.id);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results?.[0]?.[0]?.transcript;
                if (transcript) {
                    setQuestions((prev) => {
                        const updated = [...prev];
                        const current = updated[index];
                        if (!current) {
                            return prev;
                        }
                        const newText = current.text ? `${current.text} ${transcript}` : transcript;
                        updated[index] = { ...current, text: newText };
                        return updated;
                    });
                }
            };

            recognition.onerror = (event: any) => {
                console.error("[SPEECH_RECOGNITION_ERROR]", event.error);
                toast.error("Could not recognize speech");
            };

            recognition.onend = () => {
                setListeningQuestionId(null);
                recognitionRef.current = null;
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (error) {
            console.error("[SPEECH_RECOGNITION]", error);
            toast.error("Could not start voice recording");
            stopListening();
        }
    };

    const handleUpdateQuiz = async () => {
        stopListening();
        if (!selectedCourse || !quizTitle.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        const validationErrors: string[] = [];

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];

            if (!question.text || question.text.trim() === "") {
                validationErrors.push(`Question ${i + 1}: question text is required`);
                continue;
            }

            if (question.type === "MULTIPLE_CHOICE") {
                const validOptions = question.options?.filter((option) => option.trim() !== "") || [];
                if (validOptions.length === 0) {
                    validationErrors.push(`Question ${i + 1}: add at least one option`);
                    continue;
                }

                if (
                    typeof question.correctAnswer !== "number" ||
                    question.correctAnswer < 0 ||
                    question.correctAnswer >= validOptions.length
                ) {
                    validationErrors.push(`Question ${i + 1}: select a correct answer`);
                    continue;
                }
            } else if (question.type === "TRUE_FALSE") {
                if (
                    !question.correctAnswer ||
                    (question.correctAnswer !== "true" && question.correctAnswer !== "false")
                ) {
                    validationErrors.push(`Question ${i + 1}: select a correct answer`);
                    continue;
                }
            } else if (question.type === "SHORT_ANSWER") {
                if (!question.correctAnswer || question.correctAnswer.toString().trim() === "") {
                    validationErrors.push(`Question ${i + 1}: correct answer is required`);
                    continue;
                }
            }

            if (question.points <= 0) {
                validationErrors.push(`Question ${i + 1}: points must be greater than zero`);
                continue;
            }
        }

        if (validationErrors.length > 0) {
            toast.error(validationErrors.join("\n"));
            return;
        }

        if (questions.length === 0) {
            toast.error("Add at least one question");
            return;
        }

        const cleanedQuestions = questions.map((question) => {
            if (question.type === "MULTIPLE_CHOICE" && question.options) {
                const filteredOptions = question.options.filter((option) => option.trim() !== "");
                return {
                    ...question,
                    options: filteredOptions,
                };
            }
            return question;
        });

        setIsUpdatingQuiz(true);
        try {
            const response = await fetch(`${apiBasePath}/quizzes/${quizId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: quizTitle,
                    description: quizDescription,
                    courseId: selectedCourse,
                    questions: cleanedQuestions,
                    position: selectedPosition,
                    timer: quizTimer,
                    maxAttempts: quizMaxAttempts,
                }),
            });

            if (response.ok) {
                toast.success("Quiz updated successfully");
                onSaved?.();
                router.refresh();
                if (variant === "page") {
                    router.push(dashboardPath);
                }
            } else {
                const error = await response.json();
                toast.error(error.message || "Something went wrong while updating the quiz");
            }
        } catch (error) {
            console.error("Error updating quiz:", error);
            toast.error("Something went wrong while updating the quiz");
        } finally {
            setIsUpdatingQuiz(false);
        }
    };

    const onPublishToggle = async () => {
        try {
            setPublishLoading(true);
            await axios.patch(`${apiBasePath}/quizzes/${quizId}/publish`, {
                isPublished: !isPublished,
            });
            setIsPublished(!isPublished);
            toast.success(isPublished ? "Quiz unpublished" : "Quiz published");
            onSaved?.();
            router.refresh();
        } catch {
            toast.error("Something went wrong");
        } finally {
            setPublishLoading(false);
        }
    };

    const addQuestion = () => {
        const newQuestion: Question = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: "",
            type: "MULTIPLE_CHOICE",
            options: ["", "", "", ""],
            correctAnswer: 0,
            points: 1,
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
        setQuestions(updatedQuestions);
    };

    const removeQuestion = (index: number) => {
        if (questions[index]?.id === listeningQuestionId) {
            stopListening();
        }
        const updatedQuestions = questions.filter((_, i) => i !== index);
        setQuestions(updatedQuestions);
    };

    const handleDragEnd = async (result: any) => {
        if (!result.destination) return;

        if (result.draggableId === quizId) {
            const newQuizPosition = result.destination.index + 1;
            setSelectedPosition(newQuizPosition);

            const reorderedItems = Array.from(courseItems);
            const [movedItem] = reorderedItems.splice(result.source.index, 1);
            reorderedItems.splice(result.destination.index, 0, movedItem);

            setCourseItems(reorderedItems);

            const updateData = reorderedItems.map((item, index) => ({
                id: item.id,
                type: item.type,
                position: index + 1,
            }));

            try {
                const response = await fetch(`/api/courses/${selectedCourse}/reorder`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        list: updateData,
                    }),
                });

                if (response.ok) {
                    toast.success("Quiz order updated");
                    onSaved?.();
                    router.refresh();
                } else {
                    toast.error("Something went wrong while reordering");
                }
            } catch (error) {
                console.error("Error reordering quiz:", error);
                toast.error("Something went wrong while reordering");
            }
        }
    };

    if (isLoadingQuiz) {
        return (
            <div className={cn(variant === "page" ? "p-6" : "py-12", "flex justify-center")}>
                <div className="text-center text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className={cn(variant === "page" ? "space-y-6 p-6" : "space-y-5")}>
            {variant === "page" && (
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit quiz</h1>
                    <Button variant="outline" className="min-h-10" onClick={() => router.push(dashboardPath)}>
                        Back to quizzes
                    </Button>
                </div>
            )}

            <div className={cn(cardClass, "space-y-4")}>
                <div>
                    <h3 className="text-base font-semibold">Quiz details</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Title and course linked to this quiz.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {!lockCourse && (
                        <div className="space-y-2">
                            <Label className="text-base font-medium">Select course</Label>
                            <Select
                                value={selectedCourse}
                                onValueChange={(value) => {
                                    setSelectedCourse(value);
                                    setCourseItems([]);
                                    if (value) {
                                        fetchCourseItems(value);
                                    }
                                }}
                            >
                                <SelectTrigger className="min-h-12">
                                    <SelectValue placeholder="Select a course..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {lockCourse && (
                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-base font-medium">Course</Label>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Linked to this course — to change the course, use the main quizzes page.
                            </p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label className="text-base font-medium">Quiz title</Label>
                        <Input
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            placeholder="Enter quiz title"
                            className="min-h-12 text-base"
                        />
                    </div>
                </div>
            </div>

            {selectedCourse && (
                <div className={cn(cardClass, "space-y-3")}>
                    <div>
                        <h3 className="text-base font-semibold">Quiz position in course</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Drag the quiz to the desired spot among existing lessons and quizzes.
                        </p>
                        <p className="text-sm font-medium text-brand">Selected position: {selectedPosition}</p>
                    </div>
                    {isLoadingCourseItems ? (
                        <div className="py-8 text-center text-muted-foreground">Loading course content...</div>
                    ) : courseItems.length > 0 ? (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="course-items">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-2"
                                    >
                                        {courseItems.map((item, index) => (
                                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={cn(
                                                            "flex items-center justify-between rounded-lg border p-3",
                                                            snapshot.isDragging ? "bg-muted/60" : "bg-card",
                                                            item.id === quizId &&
                                                                "border-2 border-dashed border-brand/40 bg-brand/5"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                {...provided.dragHandleProps}
                                                                className={
                                                                    item.id === quizId
                                                                        ? "cursor-grab active:cursor-grabbing"
                                                                        : ""
                                                                }
                                                            >
                                                                <GripVertical
                                                                    className={cn(
                                                                        "h-4 w-4",
                                                                        item.id === quizId
                                                                            ? "text-brand"
                                                                            : "text-muted-foreground/40"
                                                                    )}
                                                                />
                                                            </div>
                                                            <div>
                                                                <div
                                                                    className={cn(
                                                                        "font-medium",
                                                                        item.id === quizId && "text-foreground"
                                                                    )}
                                                                >
                                                                    {item.title}
                                                                </div>
                                                                <div
                                                                    className={cn(
                                                                        "text-sm text-muted-foreground",
                                                                        item.id === quizId && "text-brand/80"
                                                                    )}
                                                                >
                                                                    {item.type === "chapter" ? "Lesson" : "Quiz"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Badge
                                                            variant={
                                                                item.id === quizId ? "outline" : item.isPublished ? "default" : "secondary"
                                                            }
                                                            className={cn(
                                                                item.id === quizId && "border-brand/40 text-brand"
                                                            )}
                                                        >
                                                            {item.id === quizId
                                                                ? "Editing"
                                                                : item.isPublished
                                                                  ? "Published"
                                                                  : "Draft"}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}

                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    ) : (
                        <div className="py-8 text-center">
                            <p className="mb-4 text-muted-foreground">
                                This course has no lessons or quizzes yet. The quiz will be added in the first position.
                            </p>
                            <div className="rounded-lg border-2 border-dashed border-brand/30 bg-brand/5 p-3">
                                <div className="flex items-center justify-center gap-3">
                                    <div>
                                        <div className="font-medium">{quizTitle || "New quiz"}</div>
                                        <div className="text-sm text-brand/80">Quiz</div>
                                    </div>
                                    <Badge variant="outline" className="border-brand/40 text-brand">
                                        Editing
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className={cn(cardClass, "space-y-3")}>
                <Label className="text-base font-semibold">Quiz description</Label>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Shown to students before or during the quiz, depending on the UI.
                </p>
                <Textarea
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                    placeholder="Enter quiz description"
                    rows={3}
                    className="min-h-[100px] text-base"
                />
            </div>

            <div className={cn(cardClass, "grid grid-cols-1 gap-4 md:grid-cols-2")}>
                <div className="space-y-2">
                    <Label className="text-base font-medium">Time limit (minutes)</Label>
                    <Input
                        type="number"
                        value={quizTimer || ""}
                        onChange={(e) => setQuizTimer(e.target.value ? parseInt(e.target.value, 10) : null)}
                        placeholder="Leave blank for no time limit"
                        min="1"
                        className="min-h-12"
                    />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Leave empty if you do not want a time limit for this quiz.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label className="text-base font-medium">Allowed attempts</Label>
                    <Input
                        type="number"
                        value={quizMaxAttempts}
                        onChange={(e) => setQuizMaxAttempts(parseInt(e.target.value, 10) || 1)}
                        min="1"
                        max="10"
                        className="min-h-12"
                    />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        How many times a student may retake the quiz.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-base font-semibold">Questions</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Add questions and choose type and points.
                        </p>
                    </div>
                    <Button type="button" variant="outline" className="min-h-11 w-full sm:w-auto" onClick={addQuestion}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add question
                    </Button>
                </div>

                {questions.map((question, index) => (
                    <div key={question.id} className={cn(cardClass, "space-y-4")}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-lg font-semibold">Question {index + 1}</h4>
                                {(!question.text.trim() ||
                                    (question.type === "MULTIPLE_CHOICE" &&
                                        (!question.options ||
                                            question.options.filter((opt) => opt.trim() !== "").length === 0)) ||
                                    (question.type === "TRUE_FALSE" &&
                                        (typeof question.correctAnswer !== "string" ||
                                            (question.correctAnswer !== "true" &&
                                                question.correctAnswer !== "false"))) ||
                                    (question.type === "SHORT_ANSWER" &&
                                        (typeof question.correctAnswer !== "string" ||
                                            question.correctAnswer.trim() === ""))) && (
                                    <Badge variant="destructive" className="text-xs text-white">
                                        Incomplete
                                    </Badge>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="shrink-0"
                                onClick={() => removeQuestion(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <Label className="text-base font-medium">Question text</Label>
                                <div className="flex items-center gap-2">
                                    {listeningQuestionId === question.id && (
                                        <span className="text-xs text-brand">Listening...</span>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-pressed={listeningQuestionId === question.id}
                                        onClick={() => handleSpeechInput(index)}
                                        className={listeningQuestionId === question.id ? "animate-pulse text-destructive" : ""}
                                    >
                                        <Mic className="h-4 w-4" />
                                        <span className="sr-only">
                                            {listeningQuestionId === question.id
                                                ? "Stop voice recording"
                                                : "Start voice recording"}
                                        </span>
                                    </Button>
                                </div>
                            </div>
                            <Textarea
                                value={question.text}
                                onChange={(e) => updateQuestion(index, "text", e.target.value)}
                                placeholder="Enter question text"
                                className="min-h-[88px] text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-base font-medium">Question image (optional)</Label>
                            <div className="space-y-2">
                                {question.imageUrl ? (
                                    <div className="relative">
                                        <img
                                            src={question.imageUrl}
                                            alt=""
                                            className="max-h-48 max-w-full rounded-lg border"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute right-2 top-2"
                                            onClick={() => updateQuestion(index, "imageUrl", "")}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-4">
                                        <UploadDropzone
                                            endpoint="courseAttachment"
                                            onClientUploadComplete={(res) => {
                                                if (res && res[0]) {
                                                    updateQuestion(index, "imageUrl", res[0].url);
                                                    toast.success("Image uploaded successfully");
                                                }
                                            }}
                                            onUploadError={(error: Error) => {
                                                toast.error(`Something went wrong while uploading: ${error.message}`);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-base font-medium">Question type</Label>
                                <Select
                                    value={question.type}
                                    onValueChange={(value: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER") =>
                                        updateQuestion(index, "type", value)
                                    }
                                >
                                    <SelectTrigger className="min-h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MULTIPLE_CHOICE">Multiple choice</SelectItem>
                                        <SelectItem value="TRUE_FALSE">True / false</SelectItem>
                                        <SelectItem value="SHORT_ANSWER">Short answer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-base font-medium">Points</Label>
                                <Input
                                    type="number"
                                    value={question.points}
                                    onChange={(e) => updateQuestion(index, "points", parseInt(e.target.value, 10))}
                                    min="1"
                                    className="min-h-11"
                                />
                            </div>
                        </div>

                        {question.type === "MULTIPLE_CHOICE" && (
                            <div className="space-y-2">
                                <Label className="text-base font-medium">Options</Label>
                                {(question.options || ["", "", "", ""]).map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center gap-2">
                                        <Input
                                            value={option}
                                            onChange={(e) => {
                                                const newOptions = [...(question.options || ["", "", "", ""])];
                                                const oldOptionValue = newOptions[optionIndex];
                                                newOptions[optionIndex] = e.target.value;
                                                updateQuestion(index, "options", newOptions);

                                                if (question.correctAnswer === oldOptionValue) {
                                                    updateQuestion(index, "correctAnswer", optionIndex);
                                                }
                                            }}
                                            placeholder={`Option ${optionIndex + 1}`}
                                            className="min-h-11 flex-1"
                                        />
                                        <input
                                            type="radio"
                                            name={`correct-${index}`}
                                            checked={question.correctAnswer === optionIndex}
                                            onChange={() => updateQuestion(index, "correctAnswer", optionIndex)}
                                            className="h-4 w-4 shrink-0"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {question.type === "TRUE_FALSE" && (
                            <div className="space-y-2">
                                <Label className="text-base font-medium">Correct answer</Label>
                                <Select
                                    value={typeof question.correctAnswer === "string" ? question.correctAnswer : ""}
                                    onValueChange={(value) => updateQuestion(index, "correctAnswer", value)}
                                >
                                    <SelectTrigger className="min-h-11">
                                        <SelectValue placeholder="Select the correct answer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">True</SelectItem>
                                        <SelectItem value="false">False</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {question.type === "SHORT_ANSWER" && (
                            <div className="space-y-2">
                                <Label className="text-base font-medium">Correct answer</Label>
                                <Input
                                    value={typeof question.correctAnswer === "string" ? question.correctAnswer : ""}
                                    onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)}
                                    placeholder="Enter the correct answer"
                                    className="min-h-11"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className={cn(cardClass, "space-y-4")}>
                <div>
                    <h3 className="text-base font-semibold">
                        {isPublished ? "Quiz is published" : "Quiz is not published"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {isPublished
                            ? "Students can see this quiz. You can unpublish to hide it temporarily."
                            : "The quiz will not be visible to students until you publish it."}
                    </p>
                </div>
                <Button
                    type="button"
                    onClick={onPublishToggle}
                    disabled={publishLoading}
                    variant={isPublished ? "outline" : "default"}
                    className={cn(
                        "w-full min-h-12 text-base font-semibold sm:w-auto sm:min-h-11",
                        !isPublished && "bg-brand text-white hover:bg-brand/90"
                    )}
                >
                    {isPublished ? (
                        <>
                            <EyeOff className="h-5 w-5 mr-2 shrink-0" />
                            Unpublish
                        </>
                    ) : (
                        <>
                            <Eye className="h-5 w-5 mr-2 shrink-0" />
                            Publish quiz
                        </>
                    )}
                </Button>
            </div>

            <div
                className={cn(
                    "flex gap-2",
                    variant === "page" ? "flex-col-reverse sm:flex-row sm:justify-end" : "flex-col"
                )}
            >
                {variant === "page" && (
                    <Button
                        variant="outline"
                        className="min-h-11 w-full sm:w-auto"
                        onClick={() => router.push(dashboardPath)}
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    className="min-h-11 w-full bg-brand text-white hover:bg-brand/90 sm:w-auto"
                    onClick={handleUpdateQuiz}
                    disabled={isUpdatingQuiz || questions.length === 0}
                >
                    {isUpdatingQuiz ? "Updating..." : "Update quiz"}
                </Button>
            </div>
        </div>
    );
}
