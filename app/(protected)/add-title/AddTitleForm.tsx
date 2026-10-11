"use client";

import { useMutation } from "@/lib/hooks/use-mutation";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { createTitle } from "@/actions/title/createTitle";
import { createTitleSubmission } from "@/actions/title/createTitleSubmission";
import { TitleType } from "@/generated/prisma/enums";

import CoverImageField from "@/components/custom/CoverImageField";
import TitleFormFields from "@/components/custom/TitleFormFields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Genre = {
  id: string;
  name: string;
  slug: string;
};

type AddTitleFormProps = {
  genres: Genre[];
  canCreateDirectly: boolean;
};

export default function AddTitleForm({
  genres,
  canCreateDirectly,
}: AddTitleFormProps) {
  const [mode, setMode] = useState<"direct" | "submit">(
    canCreateDirectly ? "direct" : "submit",
  );

  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState<TitleType>("MOVIE");
  const [typeOpen, setTypeOpen] = useState(false);

  const [description, setDescription] = useState("");

  const [genresIds, setGenresIds] = useState<string[]>([]);
  const [genresOpen, setGenresOpen] = useState(false);

  const [imageUrl, setImageUrl] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");

  const [isPending, runMutation] = useMutation();

  const resetForm = () => {
    setName("");
    setYear("");
    setType("MOVIE");
    setTypeOpen(false);
    setDescription("");
    setGenresIds([]);
    setGenresOpen(false);
    setImageUrl("");
    setImagePublicId("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    runMutation(async () => {
      const payload = {
        name: name.trim(),
        year: year.trim() ? Number(year) : null,
        description: description.trim() || null,
        imageUrl: imageUrl || null,
        imagePublicId: imagePublicId || null,
        type,
        genresIds,
      };

      const result =
        canCreateDirectly && mode === "direct"
          ? await createTitle(payload)
          : await createTitleSubmission(payload);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message || "success");
      resetForm();
    });
  };

  return (
    <Card className="border-white/10 bg-white/5 text-white shadow-none backdrop-blur">
      <CardHeader className="space-y-3 p-4 sm:p-5">
        <div className="space-y-1">
          <CardTitle className="text-lg sm:text-xl">Add title</CardTitle>
          <p className="text-sm text-white/55">
            compact create / submit form with square cover
          </p>
        </div>

        {canCreateDirectly && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "direct" ? "default" : "outline"}
              onClick={() => setMode("direct")}
              className={
                mode === "direct"
                  ? "h-9 bg-white text-black hover:bg-white/90"
                  : "h-9 border-white/10 bg-white/5 text-white hover:bg-white/10 cursor-pointer"
              }
            >
              Create directly
            </Button>

            <Button
              type="button"
              size="sm"
              variant={mode === "submit" ? "default" : "outline"}
              onClick={() => setMode("submit")}
              className={
                mode === "submit"
                  ? "h-9 bg-white text-black hover:bg-white/90"
                  : "h-9 border-white/10 bg-white/5 text-white hover:bg-white/10 cursor-pointer"
              }
            >
              Submit for review
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        <form onSubmit={handleSubmit} aria-busy={isPending}>
          <fieldset disabled={isPending} className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
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
            />
          </fieldset>

          <Button
            type="submit"
            disabled={isPending}
            className="mt-4 h-10 w-full bg-white text-black hover:bg-white/90 sm:w-auto"
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : canCreateDirectly && mode === "direct" ? (
              "Create title"
            ) : (
              "Submit for review"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
