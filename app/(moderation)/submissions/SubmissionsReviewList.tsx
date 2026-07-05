"use client";

import { approveTitleSubmission } from "@/actions/submissions/approveTitleSubmission";
import { rejectTitleSubmission } from "@/actions/submissions/rejectTitleSubmission";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, LoaderCircle, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

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
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const review = (id: string, action: "approve" | "reject") => {
    setPendingId(id);

    startTransition(async () => {
      const comment = comments[id] ?? "";

      const result =
        action === "approve"
          ? await approveTitleSubmission(id, comment)
          : await rejectTitleSubmission(id, comment);

      setPendingId(null);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
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
        const isItemPending = isPending && pendingId === submission.id;

        return (
          <div
            key={submission.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-5"
          >
            <div className="flex gap-4">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {submission.imageUrl ? (
                  <img
                    src={submission.imageUrl}
                    alt={submission.name}
                    className="w-full h-full object-cover"
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
                    <h2 className="text-xl font-semibold text-white">
                      {submission.name}
                    </h2>

                    <p className="mt-1 text-sm text-white/50">
                      {submission.type}
                      {submission.year ? ` . ${submission.year}` : ""}
                      {" . "}
                      by @{submission.submittedBy.username}
                    </p>
                  </div>

                  <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs text-yellow-200">
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

                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    onClick={() => review(submission.id, "approve")}
                    disabled={isPending}
                    className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
                  >
                    {isItemPending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}{" "}
                    Approve
                  </Button>

                  <Button
                    type="button"
                    onClick={() => review(submission.id, "reject")}
                    disabled={isPending}
                    className="bg-red-500/15 text-red-200 hover:bg-red-500/25"
                  >
                    <X className="size-4" /> Reject
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
