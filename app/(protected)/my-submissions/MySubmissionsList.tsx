"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { resubmitTitleSubmission } from "@/actions/submissions/resubmitTitleSubmission";
import { SubmissionStatus, TitleType } from "@/generated/prisma/enums";

import GlassCard from "@/components/custom/GlassCard";
import TitleFormFields from "@/components/custom/TitleFormFields";
import { Button } from "@/components/ui/button";

import CoverImageField from "@/components/custom/CoverImageField";
import Image from "next/image";

type Genre = {
  id: string;
  name: string;
  slug: string;
};

type Submission = {
  id: string;
  name: string;
  year: number | null;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  type: TitleType;
  status: SubmissionStatus;
  reviewComment: string | null;
  genres: Genre[];
};

type MySubmissionsListProps = {
  submissions: Submission[];
  genres: Genre[];
};

const statusClass: Record<SubmissionStatus, string> = {
  PENDING: "border-yellow-400/20 bg-yellow-400/10 text-yellow-200",
  RESUBMITTED: "border-yellow-400/20 bg-yellow-400/10 text-yellow-200",
  NEEDS_CHANGES: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  APPROVED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  REJECTED: "border-red-400/20 bg-red-400/10 text-red-200",
};

export default function MySubmissionsList({
  submissions,
  genres,
}: MySubmissionsListProps) {
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState<TitleType>("MOVIE");
  const [description, setDescription] = useState("");
  const [genresIds, setGenresIds] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");

  const [typeOpen, setTypeOpen] = useState(false);
  const [genresOpen, setGenresOpen] = useState(false);

  const startEdit = (submission: Submission) => {
    setImageUrl(submission.imageUrl ?? "");
    setImagePublicId(submission.imagePublicId ?? "");
    setEditingId(submission.id);
    setName(submission.name);
    setYear(submission.year ? String(submission.year) : "");
    setType(submission.type);
    setDescription(submission.description ?? "");
    setGenresIds(submission.genres.map((genre) => genre.id));
    setTypeOpen(false);
    setGenresOpen(false);
  };

  const cancelEdit = () => {
    setImageUrl("");
    setImagePublicId("");
    setEditingId(null);
    setPendingId(null);
    setTypeOpen(false);
    setGenresOpen(false);
  };

  const submitEdit = (submission: Submission) => {
    setPendingId(submission.id);

    startTransition(async () => {
      const result = await resubmitTitleSubmission(submission.id, {
        name: name.trim(),
        year: year.trim() ? Number(year) : null,
        description: description.trim() || null,
        imageUrl: imageUrl || null,
        imagePublicId: imagePublicId || null,
        type,
        genresIds,
      });

      setPendingId(null);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message || "Submitted");
      setEditingId(null);
      router.refresh();
    });
  };

  if (submissions.length === 0) {
    return (
      <GlassCard className="p-6 text-white/60">
        You have not submitted any titles yet.
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => {
        const isEditing = editingId === submission.id;
        const isSubmitting = isPending && pendingId === submission.id;
        const canEdit = submission.status === "NEEDS_CHANGES";

        return (
          <GlassCard key={submission.id} className="p-5">
            <div className="flex gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {submission.imageUrl ? (
                  <Image
                    src={submission.imageUrl}
                    alt={submission.name}
                    className="h-full w-full object-cover"
                    width={96}
                    height={96}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/40">
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
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      statusClass[submission.status]
                    }`}
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

                {submission.reviewComment && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-white/40">Moderator feedback</p>
                    <p className="mt-1 text-sm text-white/70">
                      {submission.reviewComment}
                    </p>
                  </div>
                )}

                {canEdit && !isEditing && (
                  <Button
                    type="button"
                    onClick={() => startEdit(submission)}
                    className="mt-4 h-9 bg-white text-black hover:bg-white/90"
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                )}

                {isEditing && (
                  <div className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <TitleFormFields
                      genres={genres}
                      name={name}
                      onNameChange={setName}
                      year={year}
                      onYearChange={setYear}
                      type={type}
                      onTypeChange={setType}
                      description={description}
                      onDescriptionChange={setDescription}
                      genresIds={genresIds}
                      onGenresIdsChange={setGenresIds}
                      typeOpen={typeOpen}
                      onTypeOpenChange={setTypeOpen}
                      genresOpen={genresOpen}
                      onGenresOpenChange={setGenresOpen}
                    />

                    <CoverImageField
                      imageUrl={imageUrl}
                      imagePublicId={imagePublicId}
                      onImageUrlChange={setImageUrl}
                      onImagePublicIdChange={setImagePublicId}
                      compact
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => submitEdit(submission)}
                        disabled={isPending}
                        className="h-9 bg-white text-black hover:bg-white/90"
                      >
                        {isSubmitting ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          "Submit again"
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={isPending}
                        className="h-9 border-white/10 bg-transparent text-white hover:bg-white/10"
                      >
                        <X className="size-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
