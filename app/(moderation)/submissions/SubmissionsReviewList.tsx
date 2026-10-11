"use client";

import { approveTitleSubmission } from "@/actions/submissions/approveTitleSubmission";
import { rejectTitleSubmission } from "@/actions/submissions/rejectTitleSubmission";
import { requestChangesTitleSubmission } from "@/actions/submissions/requestChangesTitleSubmission";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, LoaderCircle, RotateCcw, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Submission = {
  id: string;
  name: string;
  year: number | null;
  description: string | null;
  imageUrl: string | null;
  type: string;
  status: string;
  reviewComment: string | null;
  createdAt: Date;
  submittedBy: {
    username: string;
  };
  genres: {
    id: string;
    name: string;
  }[];
};

export default function SubmissionsReviewList({
  submissions,
}: {
  submissions: Submission[];
}) {
  const [comments, setComments] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: "approve" | "reject" | "changes";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();

  const review = (id: string, action: "approve" | "reject" | "changes") => {
    setPendingAction({ id, action });

    startTransition(async () => {
      const comment = comments[id] ?? "";

      const result =
        action === "approve"
          ? await approveTitleSubmission(id, comment)
          : action === "reject"
            ? await rejectTitleSubmission(id, comment)
            : await requestChangesTitleSubmission(id, comment);

      setPendingAction(null);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  };

  if (submissions.length === 0) {
    return (
      <div
        className="
    rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60"
      >
        No submission yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => {
        const statusClass =
          submission.status === "APPROVED"
            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
            : submission.status === "REJECTED"
              ? "border-red-400/20 bg-red-400/10 text-red-200"
              : submission.status === "NEEDS_CHANGES"
                ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                : submission.status === "RESUBMITTED"
                  ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-200"
                  : "border-yellow-400/20 bg-yellow-400/10 text-yellow-200";

        const isApprovePending =
          isPending &&
          pendingAction?.id === submission.id &&
          pendingAction.action === "approve";

        const isChangesPending =
          isPending &&
          pendingAction?.id === submission.id &&
          pendingAction.action === "changes";

        const isRejectPending =
          isPending &&
          pendingAction?.id === submission.id &&
          pendingAction.action === "reject";

        return (
          <div
            key={submission.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {submission.imageUrl ? (
                  <Image
                    src={submission.imageUrl}
                    alt={submission.name}
                    className="h-full w-full object-cover"
                    width={112}
                    height={112}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-ts text-white/40">
                    no image
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="break-words text-xl font-semibold text-white">
                      {submission.name}
                    </h2>

                    <p className="mt-1 text-sm text-white/50">
                      {submission.type}
                      {submission.year ? ` . ${submission.year}` : ""}
                      {" . "}
                      by @{submission.submittedBy.username}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${statusClass}`}
                  >
                    {submission.status}
                  </span>
                </div>

                {submission.description && (
                  <p className="mt-3 text-sm leading-relaxed text-white/65">
                    {submission.description}
                  </p>
                )}

                {submission.genres.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {submission.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs text-white/70"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                <Textarea
                  value={comments[submission.id] ?? ""}
                  onChange={(e) =>
                    setComments((prev) => ({
                      ...prev,
                      [submission.id]: e.target.value,
                    }))
                  }
                  placeholder="Review comment"
                  className="mt-4 min-h-20 border-white/10 bg-black/20 text-white placeholder:text-white/35"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => review(submission.id, "approve")}
                    disabled={isPending}
                    className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
                  >
                    {isApprovePending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}{" "}
                    Approve
                  </Button>

                  <Button
                    type="button"
                    onClick={() => review(submission.id, "changes")}
                    disabled={isPending}
                    className="bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 cursor-pointer"
                  >
                    {isChangesPending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )}{" "}
                    Needs changes
                  </Button>

                  <Button
                    type="button"
                    onClick={() => review(submission.id, "reject")}
                    disabled={isPending}
                    className="bg-red-500/15 text-red-200 hover:bg-red-500/25 cursor-pointer"
                  >
                    {isRejectPending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <X className="size-4" />
                    )}{" "}
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
