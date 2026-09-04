"use client";

import { createProfilePostComment } from "@/actions/profile/createProfilePostComment";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/store/hooks";
import { AtSign, ChevronDown, Send, Smile, UserRound } from "lucide-react";
import Image from "next/image";
import { type KeyboardEvent, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

type ProfilePostComment = {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    username: string;
    avatarUrl: string | null;
  };
};

type ProfilePostCommentsProps = {
  postId: string;
  comments: ProfilePostComment[];
};

const TAB_SPACES = "    ";

export default function ProfilePostComments({
  postId,
  comments,
}: ProfilePostCommentsProps) {
  const currentUser = useAppSelector((state) => state.profilePosts.currentUser);

  const [content, setContent] = useState("");
  const [visibleCount, setVisibleCount] = useState(3);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visibleComments = comments.slice(0, visibleCount);
  const hasMoreComments = visibleCount < comments.length;

  const resizeTextarea = () => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
  };

  const handleSubmit = () => {
    if (!content.trim() || isPending) {
      return;
    }

    startTransition(async () => {
      const result = await createProfilePostComment({ postId, content });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setContent("");
      requestAnimationFrame(resizeTextarea);
      toast.success(result.message ?? "Comment posted");
    });
  };

  const replaceTextareaSelection = (
    textarea: HTMLTextAreaElement,
    replacement: string,
    cursorOffset = replacement.length,
  ) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextContent =
      content.slice(0, start) + replacement + content.slice(end);
    const nextCursorPosition = start + cursorOffset;

    setContent(nextContent);

    requestAnimationFrame(() => {
      textarea.setSelectionRange(nextCursorPosition, nextCursorPosition);
      resizeTextarea();
    });
  };

  const clearCurrentLine = (
    textarea: HTMLTextAreaElement,
    lineStart: number,
    cursorPosition: number,
  ) => {
    const nextContent =
      content.slice(0, lineStart) + content.slice(cursorPosition);

    setContent(nextContent);

    requestAnimationFrame(() => {
      textarea.setSelectionRange(lineStart, lineStart);
      resizeTextarea();
    });
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      replaceTextareaSelection(event.currentTarget, TAB_SPACES);
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (!event.shiftKey) {
      handleSubmit();
      return;
    }

    const textarea = event.currentTarget;
    const cursorPosition = textarea.selectionStart;
    const lineStart = content.lastIndexOf("\n", cursorPosition - 1) + 1;
    const currentLine = content.slice(lineStart, cursorPosition);
    const indentation = currentLine.match(/^[ \t]*/)?.[0] ?? "";
    const bulletMatch = currentLine.match(/^([ \t]*)([-*])\s+(.*)$/);
    const numberedMatch = currentLine.match(/^([ \t]*)(\d+)\.\s+(.*)$/);

    if (bulletMatch) {
      if (!bulletMatch[3]?.trim()) {
        clearCurrentLine(textarea, lineStart, cursorPosition);
        return;
      }

      replaceTextareaSelection(
        textarea,
        `\n${bulletMatch[1]}${bulletMatch[2]} `,
      );
      return;
    }

    if (numberedMatch) {
      if (!numberedMatch[3]?.trim()) {
        clearCurrentLine(textarea, lineStart, cursorPosition);
        return;
      }

      const nextNumber = Number(numberedMatch[2]) + 1;

      replaceTextareaSelection(
        textarea,
        `\n${numberedMatch[1]}${nextNumber}. `,
      );
      return;
    }

    replaceTextareaSelection(textarea, `\n${indentation}`);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {comments.length > 0 && (
        <div className="space-y-3">
          {visibleComments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2.5">
              <div className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                {comment.author.avatarUrl ? (
                  <Image
                    src={comment.author.avatarUrl}
                    alt={`${comment.author.username} avatar`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <UserRound className="size-3.5 text-white/35" />
                )}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-medium leading-5 text-white/70">
                    @{comment.author.username}
                  </p>
                  <p className="shrink-0 text-xs leading-5 text-white/25">
                    {comment.createdAt.toLocaleDateString("uk-UA")}
                  </p>
                </div>

                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-white/60">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
          {hasMoreComments && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setVisibleCount((current) => current + 3)}
              className="ml-9 h-7 px-2 text-xs text-white/35 hover:bg-white/[0.04] hover:text-white/65"
            >
              <ChevronDown className="size-3.5" />
              Load more comments
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2.5 border-t border-white/[0.08] pt-2">
        <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
          {currentUser.avatarUrl ? (
            <Image
              src={currentUser.avatarUrl}
              alt={`${currentUser.username} avatar`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <UserRound className="size-4 text-white/35" />
          )}
        </div>

        <div className="flex min-h-9 min-w-0 flex-1 items-end gap-1.5 rounded-xl bg-white/[0.07] px-3.5 py-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              requestAnimationFrame(resizeTextarea);
            }}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Add comment..."
            maxLength={500}
            rows={1}
            className="max-h-24 min-h-5 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent text-sm leading-5 text-white outline-none placeholder:text-white/32"
          />

          <button
            type="button"
            className="mb-0.5 text-white/35 transition hover:text-white/65"
          >
            <AtSign className="size-[17px]" />
          </button>

          <button
            type="button"
            className="mb-0.5 text-white/35 transition hover:text-white/65"
          >
            <Smile className="size-[17px]" />
          </button>
        </div>

        <Button
          type="button"
          size="icon-sm"
          onClick={handleSubmit}
          disabled={isPending || !content.trim()}
          className="size-9 shrink-0 rounded-xl bg-primary/80 text-white hover:bg-primary disabled:bg-white/[0.06] disabled:text-white/25"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
