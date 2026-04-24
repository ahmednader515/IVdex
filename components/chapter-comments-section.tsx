"use client";

import { useEffect, useMemo, useState } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CornerDownRight, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";

type CommentUser = {
  id: string;
  fullName: string;
  image: string | null;
  role?: string | null;
};

type ChapterComment = {
  id: string;
  body: string;
  createdAt: string | Date;
  userId: string;
  parentId?: string | null;
  user: CommentUser;
};

function formatCommenterDisplayName(
  user: CommentUser,
  courseOwnerId?: string | null
) {
  const base = user.fullName?.trim() || "Student";
  const role = user.role ?? "STUDENT";

  if (role === "ADMIN") return `${base} (Admin)`;
  if (role === "ADMIN_ASSISTANT") return `${base} (Admin assistant)`;

  if (courseOwnerId && user.id === courseOwnerId) {
    return `${base} (Teacher)`;
  }

  return base;
}

export function ChapterCommentsSection({
  courseId,
  chapterId,
  courseOwnerId,
}: {
  courseId: string;
  chapterId: string;
  courseOwnerId?: string | null;
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setForbidden(false);
      const res = await axios.get(
        `/api/courses/${courseId}/chapters/${chapterId}/comments`
      );
      setComments(res.data as ChapterComment[]);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 403) {
        setForbidden(true);
      } else {
        toast.error("Failed to load comments");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, chapterId]);

  const onSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;

    try {
      setSubmitting(true);
      await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/comments`,
        { body: trimmed }
      );
      setBody("");
      await load();
      toast.success("Comment posted");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitReply = async () => {
    const trimmed = replyBody.trim();
    if (!trimmed || !replyToId) return;
    try {
      setReplySubmitting(true);
      await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/comments`,
        { body: trimmed, parentId: replyToId }
      );
      setReplyBody("");
      setReplyToId(null);
      await load();
      toast.success("Reply posted");
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setReplySubmitting(false);
    }
  };

  const onDelete = async (commentId: string) => {
    try {
      setDeletingId(commentId);
      await axios.delete(
        `/api/courses/${courseId}/chapters/${chapterId}/comments/${commentId}`
      );
      await load();
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setDeletingId(null);
    }
  };

  if (forbidden) return null;

  const { roots, childrenByParentId } = useMemo(() => {
    const byParent = new Map<string, ChapterComment[]>();
    const rootItems: ChapterComment[] = [];
    for (const c of comments) {
      if (c.parentId) {
        const arr = byParent.get(c.parentId) ?? [];
        arr.push(c);
        byParent.set(c.parentId, arr);
      } else {
        rootItems.push(c);
      }
    }
    for (const [, arr] of byParent) {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    rootItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { roots: rootItems, childrenByParentId: byParent };
  }, [comments]);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Comments</p>
          <p className="text-xs text-muted-foreground">
            Ask questions, share notes, and discuss this lesson.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => load()}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          maxLength={2000}
          className="min-h-24"
        />
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={onSubmit}
            disabled={submitting || body.trim().length === 0}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            Post comment
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 w-full rounded-md bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No comments yet. Be the first to comment.
          </p>
        ) : (
          roots.map((c) => (
            <ChapterCommentThreadNode
              key={c.id}
              comment={c}
              depth={0}
              courseOwnerId={courseOwnerId}
              childrenByParentId={childrenByParentId}
              sessionUserId={session?.user?.id}
              replyToId={replyToId}
              replyBody={replyBody}
              replySubmitting={replySubmitting}
              deletingId={deletingId}
              onReplyToggle={(id) => {
                setReplyToId((prev) => (prev === id ? null : id));
                setReplyBody("");
              }}
              onReplyBodyChange={setReplyBody}
              onCancelReply={() => {
                setReplyToId(null);
                setReplyBody("");
              }}
              onSubmitReply={onSubmitReply}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ChapterCommentThreadNode({
  comment,
  depth,
  courseOwnerId,
  childrenByParentId,
  sessionUserId,
  replyToId,
  replyBody,
  replySubmitting,
  deletingId,
  onReplyToggle,
  onReplyBodyChange,
  onCancelReply,
  onSubmitReply,
  onDelete,
}: {
  comment: ChapterComment;
  depth: number;
  courseOwnerId?: string | null;
  childrenByParentId: Map<string, ChapterComment[]>;
  sessionUserId?: string;
  replyToId: string | null;
  replyBody: string;
  replySubmitting: boolean;
  deletingId: string | null;
  onReplyToggle: (id: string) => void;
  onReplyBodyChange: (v: string) => void;
  onCancelReply: () => void;
  onSubmitReply: () => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const created = new Date(comment.createdAt);
  const initials =
    comment.user?.fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  const children = childrenByParentId.get(comment.id) ?? [];

  return (
    <div className={cn(depth > 0 && "ml-6 sm:ml-10")}>
      <div
        className={cn(
          "rounded-lg border border-border/70 bg-background p-3",
          depth > 0 && "bg-muted/10"
        )}
      >
        <div className="flex items-start gap-3">
          {depth > 0 ? (
            <div className="mt-1 text-muted-foreground">
              <CornerDownRight className="h-4 w-4" />
            </div>
          ) : null}
          <Avatar className={cn(depth > 0 ? "h-7 w-7" : "h-8 w-8")}>
            <AvatarImage src={comment.user?.image || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {formatCommenterDisplayName(comment.user, courseOwnerId)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Number.isNaN(created.getTime())
                    ? ""
                    : formatDistanceToNow(created, { addSuffix: true })}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(comment.id)}
                disabled={deletingId === comment.id || sessionUserId !== comment.userId}
                className={cn(
                  "text-destructive hover:text-destructive",
                  (deletingId === comment.id || sessionUserId !== comment.userId) && "opacity-60"
                )}
                title={
                  sessionUserId !== comment.userId
                    ? "You can only delete your own comments"
                    : "Delete comment"
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{comment.body}</p>

            <div className="mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => onReplyToggle(comment.id)}
              >
                Reply
              </Button>
            </div>

            {replyToId === comment.id ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={replyBody}
                  onChange={(e) => onReplyBodyChange(e.target.value)}
                  placeholder="Write a reply…"
                  maxLength={2000}
                  className="min-h-20"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="outline" onClick={onCancelReply}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="bg-brand hover:bg-brand/90 text-white"
                    onClick={onSubmitReply}
                    disabled={replySubmitting || replyBody.trim().length === 0}
                  >
                    Post reply
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {children.length > 0 ? (
        <div className="mt-3 space-y-3">
          {children.map((child) => (
            <ChapterCommentThreadNode
              key={child.id}
              comment={child}
              depth={depth + 1}
              courseOwnerId={courseOwnerId}
              childrenByParentId={childrenByParentId}
              sessionUserId={sessionUserId}
              replyToId={replyToId}
              replyBody={replyBody}
              replySubmitting={replySubmitting}
              deletingId={deletingId}
              onReplyToggle={onReplyToggle}
              onReplyBodyChange={onReplyBodyChange}
              onCancelReply={onCancelReply}
              onSubmitReply={onSubmitReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

