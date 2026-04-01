"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Grip, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface CourseItem {
    id: string;
    title: string;
    position: number;
    isPublished: boolean;
    type: "chapter" | "quiz";
    isFree?: boolean; // Only for chapters
}

interface CourseContentListProps {
    items: CourseItem[];
    onReorder: (updateData: { id: string; position: number; type: "chapter" | "quiz" }[]) => void;
    onEdit: (id: string, type: "chapter" | "quiz") => void;
    onDelete: (id: string, type: "chapter" | "quiz") => void;
    onQuizResults?: (quizId: string) => void;
}

const getActionLabel = (type: "chapter" | "quiz", isPublished: boolean) => {
    if (type === "chapter") {
        return isPublished ? "تعديل فيديو" : "اضافة فيديو";
    }
    return isPublished ? "تعديل اختبار" : "اضافة اختبار";
};

export const CourseContentList = ({
    items,
    onReorder,
    onEdit,
    onDelete,
    onQuizResults,
}: CourseContentListProps) => {
    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const reorderedItems = Array.from(items);
        const [movedItem] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, movedItem);

        const updateData = reorderedItems.map((item, index) => ({
            id: item.id,
            position: index + 1,
            type: item.type,
        }));

        onReorder(updateData);
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="course-content">
                {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                        {items.map((item, index) => (
                            <Draggable 
                                key={item.id} 
                                draggableId={item.id} 
                                index={index}
                            >
                                {(provided) => (
                                    <div
                                        className={cn(
                                            "mb-3 flex flex-col gap-3 rounded-xl border bg-muted/80 p-3 text-sm sm:mb-4 sm:flex-row sm:items-center sm:gap-2 sm:p-0 sm:pr-2",
                                            item.isPublished
                                                ? "border-primary/25 bg-primary/10"
                                                : "border-border/80"
                                        )}
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                    >
                                        <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center">
                                            <div
                                                className={cn(
                                                    "flex shrink-0 touch-manipulation items-center justify-center rounded-lg border border-border/60 bg-background px-2 py-3 sm:rounded-l-xl sm:rounded-r-none sm:border-0 sm:border-r sm:py-4",
                                                    item.isPublished && "border-primary/20 sm:border-r-primary/25"
                                                )}
                                                {...provided.dragHandleProps}
                                            >
                                                <Grip className="h-5 w-5 text-muted-foreground" aria-hidden />
                                            </div>
                                            <div className="min-w-0 flex-1 py-0.5 sm:px-2 sm:py-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-medium leading-snug text-foreground">
                                                        {item.title}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs shrink-0">
                                                        {item.type === "chapter" ? "درس" : "اختبار"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/50 pt-3 sm:ml-auto sm:border-0 sm:pt-0 sm:pr-1">
                                            {item.type === "chapter" && item.isFree && (
                                                <Badge className="shrink-0">مجاني</Badge>
                                            )}
                                            <Badge
                                                className={cn(
                                                    "shrink-0 bg-muted text-muted-foreground",
                                                    item.isPublished && "bg-primary text-primary-foreground"
                                                )}
                                            >
                                                {item.isPublished ? "تم النشر" : "غير منشور"}
                                            </Badge>
                                            <button
                                                type="button"
                                                onClick={() => onEdit(item.id, item.type)}
                                                className="min-h-10 rounded-md bg-brand/10 px-3 text-sm font-semibold text-brand transition hover:bg-brand/15 active:bg-brand/20 sm:min-h-9"
                                            >
                                                {getActionLabel(item.type, item.isPublished)}
                                            </button>
                                            {item.type === "quiz" && onQuizResults && (
                                                <button
                                                    type="button"
                                                    onClick={() => onQuizResults(item.id)}
                                                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition hover:border-brand/30 hover:text-brand sm:min-h-9"
                                                    title="نتائج الاختبار"
                                                >
                                                    <BarChart2 className="h-4 w-4 shrink-0" />
                                                    النتائج
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => onDelete(item.id, item.type)}
                                                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-destructive transition hover:bg-destructive/10 active:bg-destructive/15"
                                                aria-label="حذف"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}; 