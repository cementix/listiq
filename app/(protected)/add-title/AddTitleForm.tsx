"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Check,
  ChevronsUpDown,
  ImagePlus,
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";

import { TitleType } from "@/generated/prisma/enums";
import { createTitle } from "@/actions/title/createTitle";
import { createTitleSubmission } from "@/actions/title/createTitleSubmission";
import { uploadImage } from "@/actions/upload/uploadImage";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const TITLE_TYPES: TitleType[] = [
  "MOVIE",
  "SERIES",
  "ANIME",
  "MANGA",
  "MANHWA",
  "BOOK",
  "GAME",
  "NOVEL",
  "COMIC",
  "OTHER",
];

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
  const [description, setDescription] = useState("");

  const [genresIds, setGenresIds] = useState<string[]>([]);
  const [genresOpen, setGenresOpen] = useState(false);

  const [imageUrl, setImageUrl] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");
  const [localPreview, setLocalPreview] = useState("");

  const [isPending, startTransition] = useTransition();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedGenres = useMemo(
    () => genres.filter((genre) => genresIds.includes(genre.id)),
    [genres, genresIds],
  );

  const toggleGenre = (genreId: string) => {
    setGenresIds((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId],
    );
  };

  const removeGenre = (genreId: string) => {
    setGenresIds((prev) => prev.filter((id) => id !== genreId));
  };

  const resetForm = () => {
    setName("");
    setYear("");
    setType("MOVIE");
    setDescription("");
    setGenresIds([]);
    setImageUrl("");
    setImagePublicId("");
    setLocalPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setLocalPreview(localUrl);
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadImage(formData);

      if (!result.ok) {
        toast.error(result.error || "upload failed");
        setImageUrl("");
        setImagePublicId("");
        return;
      }

      setImageUrl(result.imageUrl);
      setImagePublicId(result.imagePublicId);

      toast.success("image uploaded");
    } catch (error) {
      console.error(error);
      setImageUrl("");
      setImagePublicId("");
      toast.error("upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const clearImage = () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
    }

    setLocalPreview("");
    setImageUrl("");
    setImagePublicId("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(async () => {
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

      console.log("submit payload", payload);

      toast.success(result.message || "success");
      resetForm();
    });
  };

  return (
    <Card className="border-white/10 bg-white/5 text-white shadow-none backdrop-blur">
      <CardHeader className="space-y-4">
        <div className="space-y-1">
          <CardTitle className="text-2xl">Add title</CardTitle>
          <p className="text-sm text-white/55">
            Create a new title or submit it for review
          </p>
        </div>

        {canCreateDirectly && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "direct" ? "default" : "outline"}
              onClick={() => setMode("direct")}
              className={
                mode === "direct"
                  ? "bg-white text-black hover:bg-white/90"
                  : "border-white/10 bg-transparent text-white hover:bg-white/10"
              }
            >
              Create directly
            </Button>

            <Button
              type="button"
              variant={mode === "submit" ? "default" : "outline"}
              onClick={() => setMode("submit")}
              className={
                mode === "submit"
                  ? "bg-white text-black hover:bg-white/90"
                  : "border-white/10 bg-transparent text-white hover:bg-white/10"
              }
            >
              Submit for review
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Resident Evil 4 Remake"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/35"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={year}
                type="number"
                onChange={(e) => setYear(e.target.value)}
                placeholder="2023"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/35"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as TitleType)}
              >
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-zinc-950 text-white">
                  {TITLE_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Genres</Label>

              <Popover open={genresOpen} onOpenChange={setGenresOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    <span className="truncate text-left text-white/80">
                      {selectedGenres.length > 0
                        ? `${selectedGenres.length} selected`
                        : "Select genres"}
                    </span>
                    <ChevronsUpDown className="size-4 opacity-60" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  align="start"
                  className="w-[var(--radix-popover-trigger-width)] border-white/10 bg-zinc-950 p-0 text-white"
                >
                  <Command className="bg-transparent">
                    <CommandInput
                      placeholder="Search genres..."
                      className="text-white placeholder:text-white/40"
                    />
                    <CommandList>
                      <CommandEmpty>No genres found.</CommandEmpty>
                      <CommandGroup>
                        {genres.map((genre) => {
                          const selected = genresIds.includes(genre.id);

                          return (
                            <CommandItem
                              key={genre.id}
                              value={`${genre.name} ${genre.slug}`}
                              onSelect={() => toggleGenre(genre.id)}
                              className="cursor-pointer text-white aria-selected:bg-white/10"
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  selected ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {genre.name}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedGenres.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                  {selectedGenres.map((genre) => (
                    <div
                      key={genre.id}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-white"
                    >
                      <span>{genre.name}</span>
                      <button
                        type="button"
                        onClick={() => removeGenre(genre.id)}
                        className="rounded-full p-0.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                className="min-h-32 border-white/10 bg-white/5 text-white placeholder:text-white/35"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label>Cover image</Label>

              <input
                ref={fileInputRef}
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploadingImage}
                className="hidden"
              />

              {!localPreview && !imageUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="group flex min-h-[260px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center transition hover:bg-white/10 disabled:opacity-60"
                >
                  {isUploadingImage ? (
                    <>
                      <LoaderCircle className="mb-3 size-8 animate-spin text-white/70" />
                      <p className="text-sm text-white/70">
                        uploading image...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="mb-4 rounded-2xl border border-white/10 bg-white/10 p-4">
                        <ImagePlus className="size-7 text-white/75" />
                      </div>
                      <p className="text-sm font-medium text-white">
                        click to upload cover
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        png, jpg, webp
                      </p>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="relative aspect-[16/8] w-full">
                      <Image
                        src={localPreview || imageUrl}
                        alt="uploaded preview"
                        fill
                        className={cn(
                          "object-cover transition",
                          isUploadingImage &&
                            "scale-[1.02] opacity-70 blur-[1px]",
                        )}
                        unoptimized
                      />
                    </div>

                    {isUploadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-sm text-white">
                          <LoaderCircle className="size-4 animate-spin" />
                          uploading...
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="border-white/10 bg-transparent text-white hover:bg-white/10"
                    >
                      change image
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearImage}
                      disabled={isUploadingImage}
                      className="border-white/10 bg-transparent text-white hover:bg-white/10"
                    >
                      <Trash2 className="mr-2 size-4" />
                      remove image
                    </Button>
                  </div>

                  {!!imageUrl && !isUploadingImage && (
                    <p className="text-xs text-emerald-400">
                      image uploaded successfully
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={isPending || isUploadingImage}
                className="w-full bg-white text-black hover:bg-white/90"
              >
                {isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : canCreateDirectly && mode === "direct" ? (
                  "create title"
                ) : (
                  "submit for review"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
