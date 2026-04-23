"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import Cropper, { Area } from "react-easy-crop";
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

const TITLE_TYPE_OPTIONS: { value: TitleType; label: string }[] = [
  { value: "MOVIE", label: "Movie" },
  { value: "SERIES", label: "Series" },
  { value: "ANIME", label: "Anime" },
  { value: "MANGA", label: "Manga" },
  { value: "MANHWA", label: "Manhwa" },
  { value: "BOOK", label: "Book" },
  { value: "GAME", label: "Game" },
  { value: "NOVEL", label: "Novel" },
  { value: "COMIC", label: "Comic" },
  { value: "OTHER", label: "Other" },
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

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedFile(
  imageSrc: string,
  crop: Area,
  fileName = "cover.jpg",
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("canvas context not available");
  }

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("failed to create cropped image"));
          return;
        }

        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  });
}

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
  const [localPreview, setLocalPreview] = useState("");

  const [cropSource, setCropSource] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedGenres = useMemo(
    () => genres.filter((genre) => genresIds.includes(genre.id)),
    [genres, genresIds],
  );

  const selectedTypeLabel =
    TITLE_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? "Movie";

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
    setTypeOpen(false);
    setDescription("");
    setGenresIds([]);
    setImageUrl("");
    setImagePublicId("");
    setLocalPreview("");
    setCropSource("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setCropSource(localUrl);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
  };

  const handleUploadCroppedImage = async () => {
    if (!cropSource || !croppedAreaPixels) {
      toast.error("crop the image first");
      return;
    }

    setIsUploadingImage(true);

    try {
      const croppedFile = await getCroppedFile(cropSource, croppedAreaPixels);
      const nextPreviewUrl = URL.createObjectURL(croppedFile);

      const formData = new FormData();
      formData.append("file", croppedFile);

      const result = await uploadImage(formData);

      if (!result.ok) {
        toast.error(result.error || "upload failed");
        return;
      }

      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }

      setLocalPreview(nextPreviewUrl);
      setImageUrl(result.imageUrl);
      setImagePublicId(result.imagePublicId);
      setCropSource("");

      toast.success("image uploaded");
    } catch (error) {
      console.error(error);
      toast.error("upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const clearImage = () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
    }

    if (cropSource) {
      URL.revokeObjectURL(cropSource);
    }

    setLocalPreview("");
    setImageUrl("");
    setImagePublicId("");
    setCropSource("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

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
                  : "h-9 border-white/10 bg-white/5 text-white hover:bg-white/10"
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
                  : "h-9 border-white/10 bg-white/5 text-white hover:bg-white/10"
              }
            >
              Submit for review
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Resident Evil 4 Remake"
                    className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/35"
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
                    className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/35"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>

                  <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full justify-between border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        <span className="truncate text-left text-white/80">
                          {selectedTypeLabel}
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
                          placeholder="Search types..."
                          className="text-white placeholder:text-white/40"
                        />
                        <CommandList>
                          <CommandEmpty>No type found.</CommandEmpty>
                          <CommandGroup>
                            {TITLE_TYPE_OPTIONS.map((item) => {
                              const selected = item.value === type;

                              return (
                                <CommandItem
                                  key={item.value}
                                  value={`${item.label} ${item.value}`}
                                  onSelect={() => {
                                    setType(item.value);
                                    setTypeOpen(false);
                                  }}
                                  className="cursor-pointer text-white aria-selected:bg-white/10"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 size-4",
                                      selected ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  {item.label}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Genres</Label>

                  <Popover open={genresOpen} onOpenChange={setGenresOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full justify-between border-white/10 bg-white/5 text-white hover:bg-white/10"
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
                </div>
              </div>

              {selectedGenres.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                  {selectedGenres.map((genre) => (
                    <div
                      key={genre.id}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs text-white"
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

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                  className="min-h-24 resize-none border-white/10 bg-white/5 text-white placeholder:text-white/35"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending || isUploadingImage}
                className="h-10 w-full bg-white text-black hover:bg-white/90 sm:w-auto"
              >
                {isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : canCreateDirectly && mode === "direct" ? (
                  "Create title"
                ) : (
                  "Submit for review"
                )}
              </Button>
            </div>

            <div className="space-y-3 lg:sticky lg:top-4">
              <div className="space-y-2">
                <Label>Cover image</Label>

                <input
                  ref={fileInputRef}
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={isUploadingImage}
                  className="hidden"
                />

                {!cropSource && !localPreview && !imageUrl && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="flex aspect-square w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-center disabled:opacity-60"
                  >
                    <div className="mb-3 rounded-xl border border-white/10 bg-white/10 p-3">
                      <ImagePlus className="size-5 text-white/75" />
                    </div>
                    <p className="text-sm font-medium text-white">
                      Select cover
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      square crop 1:1
                    </p>
                  </button>
                )}

                {cropSource && (
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
                      <Cropper
                        image={cropSource}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="rect"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(_, croppedPixels) =>
                          setCroppedAreaPixels(croppedPixels)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-white/55">
                        <span>Zoom</span>
                        <span>{zoom.toFixed(1)}x</span>
                      </div>

                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleUploadCroppedImage}
                        disabled={isUploadingImage}
                        className="h-9 flex-1 bg-white text-black hover:bg-white/90"
                      >
                        {isUploadingImage ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          "Apply crop"
                        )}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={clearImage}
                        disabled={isUploadingImage}
                        className="h-9 border-white/10 bg-transparent text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {!cropSource && (localPreview || imageUrl) && (
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/20">
                      <Image
                        src={localPreview || imageUrl}
                        alt="uploaded preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    {!!imageUrl && !isUploadingImage && (
                      <p className="text-xs text-emerald-400">
                        image uploaded successfully
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="h-9 border-white/10 bg-transparent text-white hover:bg-white/10"
                      >
                        Change
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={clearImage}
                        disabled={isUploadingImage}
                        className="h-9 border-white/10 bg-transparent text-white hover:bg-white/10"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}