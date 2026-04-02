"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, X, Mic } from "lucide-react";
import { toast } from "sonner";
import { usePathname, useSearchParams } from "next/navigation";
import { useNavigationRouter } from "@/lib/hooks/use-navigation-router";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { UploadDropzone } from "@/lib/uploadthing";

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
}

interface Question {
    id: string;
    text: string;
    imageUrl?: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
    options?: string[];
    correctAnswer: string | number; // Can be string for TRUE_FALSE/SHORT_ANSWER or number for MULTIPLE_CHOICE
    points: number;
}

interface CourseItem {
    id: string;
    title: string;
    type: "chapter" | "quiz";
    position: number;
    isPublished: boolean;
}

const CreateQuizContent = () => {
    const router = useNavigationRouter();
    const searchParams = useSearchParams();
    const dashboardPath = "/dashboard/admin/assessments?tab=quizzes";
    const adminCourseContentPath = (courseId: string) =>
        `/dashboard/admin/courses/${courseId}?tab=content`;
    const goBackAfterQuizFlow = () => {
        if (selectedCourse) {
            router.push(adminCourseContentPath(selectedCourse));
            return;
        }
        router.push("/dashboard/admin/courses");
    };
    const [courses, setCourses] = useState<Course[]>([]);
    const courseIdFromUrl = searchParams.get("courseId") ?? "";
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [quizTitle, setQuizTitle] = useState("");
    const [quizDescription, setQuizDescription] = useState("");
    const [quizTimer, setQuizTimer] = useState<number | null>(null);
    const [quizMaxAttempts, setQuizMaxAttempts] = useState<number>(1);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<number>(1);
    const [courseItems, setCourseItems] = useState<CourseItem[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoadingCourseItems, setIsLoadingCourseItems] = useState(false);
    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
    const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({});
    const [listeningQuestionId, setListeningQuestionId] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (courseIdFromUrl) {
            setSelectedCourse(courseIdFromUrl);
            fetchCourseItems(courseIdFromUrl);
        }
    }, [courseIdFromUrl]);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const fetchCourses = async () => {
        try {
            // Admin needs to see drafts (unpublished) too.
            const response = await fetch("/api/admin/courses");
            if (response.ok) {
                const data = await response.json();
                setCourses(data);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    };

    const fetchCourseItems = async (courseId: string) => {
        try {
            setIsLoadingCourseItems(true);
            // Clear existing items first
            setCourseItems([]);
            
            const [chaptersResponse, quizzesResponse] = await Promise.all([
                fetch(`/api/courses/${courseId}/chapters`),
                fetch(`/api/courses/${courseId}/quizzes`)
            ]);
            
            const chaptersData = chaptersResponse.ok ? await chaptersResponse.json() : [];
            const quizzesData = quizzesResponse.ok ? await quizzesResponse.json() : [];
            
            // Combine chapters and existing quizzes for display
            const items: CourseItem[] = [
                ...chaptersData.map((chapter: Chapter) => ({
                    id: chapter.id,
                    title: chapter.title,
                    type: "chapter" as const,
                    position: chapter.position,
                    isPublished: chapter.isPublished
                })),
                ...quizzesData.map((quiz: Quiz) => ({
                    id: quiz.id,
                    title: quiz.title,
                    type: "quiz" as const,
                    position: quiz.position,
                    isPublished: quiz.isPublished
                }))
            ];
            
            // Sort by position
            items.sort((a, b) => a.position - b.position);
            
            // Add the new quiz item to the end of the list
            const itemsWithNewQuiz = [
                ...items,
                {
                    id: "new-quiz",
                    title: quizTitle || "New quiz",
                    type: "quiz" as const,
                    position: items.length + 1,
                    isPublished: false
                }
            ];
            
            setCourseItems(itemsWithNewQuiz);
            setChapters(chaptersData);
            
            // Set the new quiz position to be the last position by default
            const lastPosition = items.length + 1;
            setSelectedPosition(lastPosition);
        } catch (error) {
            console.error("Error fetching course items:", error);
            // Clear items on error
            setCourseItems([]);
            setSelectedPosition(1);
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

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            toast.error("This browser does not support speech recognition");
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
            toast.error("Could not start voice input");
            stopListening();
        }
    };

    const handleCreateQuiz = async () => {
        stopListening();
        if (!selectedCourse || !quizTitle.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Validate questions
        const validationErrors: string[] = [];

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            
            // Validate question text
            if (!question.text || question.text.trim() === "") {
                validationErrors.push(`Question ${i + 1}: question text is required`);
                continue;
            }

            // Validate correct answer
            if (question.type === "MULTIPLE_CHOICE") {
                const validOptions = question.options?.filter(option => option.trim() !== "") || [];
                if (validOptions.length === 0) {
                    validationErrors.push(`Question ${i + 1}: add at least one option`);
                    continue;
                }
                
                // Check if correct answer index is valid
                if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer >= validOptions.length) {
                    validationErrors.push(`Question ${i + 1}: select a correct answer`);
                    continue;
                }
            } else if (question.type === "TRUE_FALSE") {
                if (!question.correctAnswer || (question.correctAnswer !== "true" && question.correctAnswer !== "false")) {
                    validationErrors.push(`Question ${i + 1}: select a correct answer`);
                    continue;
                }
            } else if (question.type === "SHORT_ANSWER") {
                if (!question.correctAnswer || question.correctAnswer.toString().trim() === "") {
                    validationErrors.push(`Question ${i + 1}: correct answer is required`);
                    continue;
                }
            }

            // Check if points are valid
            if (question.points <= 0) {
                validationErrors.push(`Question ${i + 1}: points must be greater than zero`);
                continue;
            }
        }

        if (validationErrors.length > 0) {
            toast.error(validationErrors.join('\n'));
            return;
        }

        // Additional validation: ensure no questions are empty
        if (questions.length === 0) {
            toast.error("Add at least one question");
            return;
        }

        // Clean up questions before sending
        const cleanedQuestions = questions.map(question => {
            if (question.type === "MULTIPLE_CHOICE" && question.options) {
                // Filter out empty options and ensure correct answer is included
                const filteredOptions = question.options.filter(option => option.trim() !== "");
                return {
                    ...question,
                    options: filteredOptions
                };
            }
            return question;
        });

        setIsCreatingQuiz(true);
        try {
            const response = await fetch("/api/admin/quizzes", {
                method: "POST",
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
                toast.success("Quiz created");
                // After creating a quiz, return to the course editor (content tab)
                // (content tab). If courseId is missing, fall back to quizzes dashboard.
                if (selectedCourse) {
                    router.push(`/dashboard/admin/courses/${selectedCourse}?tab=content`);
                } else {
                    router.push(dashboardPath);
                }
            } else {
                const error = await response.json();
                toast.error(error.message || "Something went wrong while creating the quiz");
            }
        } catch (error) {
            console.error("Error creating quiz:", error);
            toast.error("Something went wrong while creating the quiz");
        } finally {
            setIsCreatingQuiz(false);
        }
    };

    const addQuestion = () => {
        const newQuestion: Question = {
            id: `question-${Date.now()}`,
            text: "",
            type: "MULTIPLE_CHOICE",
            options: ["", "", "", ""],
            correctAnswer: 0, // Use index 0 for first option
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

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        // Only handle dragging the "new-quiz" item
        if (result.draggableId === "new-quiz") {
            // Calculate the position for the new quiz based on where it was dropped
            const newQuizPosition = result.destination.index + 1;
            setSelectedPosition(newQuizPosition);
            
            // Reorder the items array to reflect the new position
            const reorderedItems = Array.from(courseItems);
            const [movedItem] = reorderedItems.splice(result.source.index, 1);
            reorderedItems.splice(result.destination.index, 0, movedItem);
            
            setCourseItems(reorderedItems);
        }
        // For existing items, we don't want to reorder them, so we ignore the drag
        // The drag and drop library will handle the visual feedback, but we don't update state
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Create quiz
                </h1>
                <Button variant="outline" onClick={goBackAfterQuizFlow}>
                    {selectedCourse
                        ? "Back to course content"
                        : "Back to quizzes"}
                </Button>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Course</Label>
                        <Select value={selectedCourse} onValueChange={(value) => {
                            setSelectedCourse(value);
                            // Clear previous data immediately
                            setCourseItems([]);
                            setSelectedPosition(1);
                            if (value) {
                                fetchCourseItems(value);
                            }
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a course…" />
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
                    <div className="space-y-2">
                        <Label>Quiz title</Label>
                        <Input
                            value={quizTitle}
                            onChange={(e) => {
                                setQuizTitle(e.target.value);
                                // Update the new quiz item in the course items list
                                setCourseItems(prev => 
                                    prev.map(item => 
                                        item.id === "new-quiz" 
                                            ? { ...item, title: e.target.value || "New quiz" }
                                            : item
                                    )
                                );
                            }}
                            placeholder="Enter quiz title"
                        />
                    </div>
                </div>

                {selectedCourse && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Quiz position in course</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Drag the new quiz to the desired spot among existing lessons and quizzes.
                            </p>
                            <p className="text-sm text-blue-600">
                                Selected position: {selectedPosition}
                            </p>
                        </CardHeader>
                        <CardContent>
                            {isLoadingCourseItems ? (
                                <div className="text-center py-8">
                                    <div className="text-muted-foreground">Loading course content…</div>
                                </div>
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
                                                                className={`p-3 border rounded-lg flex items-center justify-between ${
                                                                    snapshot.isDragging ? "bg-blue-50" : "bg-white"
                                                                } ${item.id === "new-quiz" ? "border-2 border-dashed border-blue-300 bg-blue-50" : ""}`}
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    <div {...provided.dragHandleProps} className={item.id === "new-quiz" ? "cursor-grab active:cursor-grabbing" : ""}>
                                                                        <GripVertical className={`h-4 w-4 ${item.id === "new-quiz" ? "text-blue-600" : "text-gray-300 cursor-not-allowed"}`} />
                                                                    </div>
                                                                    <div>
                                                                        <div className={`font-medium ${item.id === "new-quiz" ? "text-blue-800" : ""}`}>
                                                                            {item.title}
                                                                        </div>
                                                                        <div className={`text-sm ${item.id === "new-quiz" ? "text-blue-600" : "text-muted-foreground"}`}>
                                                                            {item.type === "chapter" ? "Lesson" : "Quiz"}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <Badge variant={item.id === "new-quiz" ? "outline" : (item.isPublished ? "default" : "secondary")} className={item.id === "new-quiz" ? "border-blue-300 text-blue-700" : ""}>
                                                                    {item.id === "new-quiz" ? "New" : (item.isPublished ? "Published" : "Draft")}
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
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-4">
                                        This course has no lessons or quizzes yet. The quiz will be added in the first position.
                                    </p>
                                    <div className="p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                                        <div className="flex items-center justify-center space-x-3">
                                            <div>
                                                <div className="font-medium text-blue-800">
                                                    {quizTitle || "New quiz"}
                                                </div>
                                                <div className="text-sm text-blue-600">Quiz</div>
                                            </div>
                                            <Badge variant="outline" className="border-blue-300 text-blue-700">
                                                New
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                        value={quizDescription}
                        onChange={(e) => setQuizDescription(e.target.value)}
                        placeholder="Enter quiz description"
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Time limit (minutes)</Label>
                        <Input
                            type="number"
                            value={quizTimer || ""}
                            onChange={(e) => setQuizTimer(e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Leave empty for no time limit"
                            min="1"
                        />
                        <p className="text-sm text-muted-foreground">
                            Leave blank if you do not want a time limit.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>Allowed attempts</Label>
                        <Input
                            type="number"
                            value={quizMaxAttempts}
                            onChange={(e) => setQuizMaxAttempts(parseInt(e.target.value))}
                            min="1"
                            max="10"
                        />
                        <p className="text-sm text-muted-foreground">
                            How many times a student may retake the quiz
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Questions</Label>
                        <Button type="button" variant="outline" onClick={addQuestion}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add question
                        </Button>
                    </div>

                    {questions.map((question, index) => (
                        <Card key={question.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                                        {(!question.text.trim() || !question.correctAnswer.toString().trim() || 
                                          (question.type === "MULTIPLE_CHOICE" && 
                                           (!question.options || question.options.filter(opt => opt.trim() !== "").length < 2))) && (
                                            <Badge variant="destructive" className="text-xs text-white">
                                                Incomplete
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => removeQuestion(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Question text</Label>
                                        <div className="flex items-center gap-2">
                                            {listeningQuestionId === question.id && (
                                                <span className="text-xs text-blue-600">
                                                    Listening…
                                                </span>
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-pressed={listeningQuestionId === question.id}
                                                onClick={() => handleSpeechInput(index)}
                                                className={listeningQuestionId === question.id ? "text-red-500 animate-pulse" : ""}
                                            >
                                                <Mic className="h-4 w-4" />
                                                <span className="sr-only">
                                                    {listeningQuestionId === question.id ? "Stop voice input" : "Start voice input"}
                                                </span>
                                            </Button>
                                        </div>
                                    </div>
                                    <Textarea
                                        value={question.text}
                                        onChange={(e) => updateQuestion(index, "text", e.target.value)}
                                        placeholder="Enter the question"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Question image (optional)</Label>
                                    <div className="space-y-2">
                                        {question.imageUrl ? (
                                            <div className="relative">
                                                <img 
                                                    src={question.imageUrl} 
                                                    alt="Question" 
                                                    className="max-w-full h-auto max-h-48 rounded-lg border"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-2 right-2"
                                                    onClick={() => updateQuestion(index, "imageUrl", "")}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                                <UploadDropzone
                                                    endpoint="courseAttachment"
                                                    onClientUploadComplete={(res) => {
                                                        if (res && res[0]) {
                                                            updateQuestion(index, "imageUrl", res[0].url);
                                                            toast.success("Image uploaded");
                                                        }
                                                        setUploadingImages(prev => ({ ...prev, [index]: false }));
                                                    }}
                                                    onUploadError={(error: Error) => {
                                                        toast.error(`Something went wrong while uploading the image: ${error.message}`);
                                                        setUploadingImages(prev => ({ ...prev, [index]: false }));
                                                    }}
                                                    onUploadBegin={() => {
                                                        setUploadingImages(prev => ({ ...prev, [index]: true }));
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Question type</Label>
                                        <Select
                                            value={question.type}
                                            onValueChange={(value: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER") =>
                                                updateQuestion(index, "type", value)
                                            }
                                        >
                                            <SelectTrigger>
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
                                        <Label>Points</Label>
                                        <Input
                                            type="number"
                                            value={question.points}
                                            onChange={(e) => updateQuestion(index, "points", parseInt(e.target.value))}
                                            min="1"
                                        />
                                    </div>
                                </div>

                                {question.type === "MULTIPLE_CHOICE" && (
                                    <div className="space-y-2">
                                        <Label>Options</Label>
                                        {(question.options || ["", "", "", ""]).map((option, optionIndex) => (
                                            <div key={`${question.id}-option-${optionIndex}`} className="flex items-center space-x-2">
                                                <Input
                                                    value={option}
                                                    onChange={(e) => {
                                                        const newOptions = [...(question.options || ["", "", "", ""])];
                                                        newOptions[optionIndex] = e.target.value;
                                                        updateQuestion(index, "options", newOptions);
                                                    }}
                                                    placeholder={`Option ${optionIndex + 1}`}
                                                />
                                                <input
                                                    type="radio"
                                                    name={`correct-${index}`}
                                                    checked={typeof question.correctAnswer === 'number' && question.correctAnswer === optionIndex}
                                                    onChange={() => updateQuestion(index, "correctAnswer", optionIndex)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {question.type === "TRUE_FALSE" && (
                                    <div className="space-y-2">
                                        <Label>Correct answer</Label>
                                        <Select
                                            value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
                                            onValueChange={(value) => updateQuestion(index, "correctAnswer", value)}
                                        >
                                            <SelectTrigger>
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
                                        <Label>Correct answer</Label>
                                        <Input
                                            value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
                                            onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)}
                                            placeholder="Enter the correct answer"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={goBackAfterQuizFlow}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateQuiz}
                        disabled={isCreatingQuiz || questions.length === 0}
                    >
                        {isCreatingQuiz ? "Saving…" : "Create quiz"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function CreateQuizPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px] text-muted-foreground">Loading…</div>}>
            <CreateQuizContent />
        </Suspense>
    );
} 