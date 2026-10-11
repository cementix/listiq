"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";

import { TitleType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
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

export const TITLE_TYPE_OPTIONS: { value: TitleType; label: string }[] = [
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

export type TitleFormGenre = {
  id: string;
  name: string;
  slug: string;
};

type TitleFormFieldsProps = {
  genres: TitleFormGenre[];

  name: string;
  onNameChange: (value: string) => void;

  year: string;
  onYearChange: (value: string) => void;

  type: TitleType;
  onTypeChange: (value: TitleType) => void;

  description: string;
  onDescriptionChange: (value: string) => void;

  genresIds: string[];
  onGenresIdsChange: (value: string[]) => void;

  typeOpen: boolean;
  onTypeOpenChange: (value: boolean) => void;

  genresOpen: boolean;
  onGenresOpenChange: (value: boolean) => void;
};

export default function TitleFormFields({
  genres,
  name,
  onNameChange,
  year,
  onYearChange,
  type,
  onTypeChange,
  description,
  onDescriptionChange,
  genresIds,
  onGenresIdsChange,
  typeOpen,
  onTypeOpenChange,
  genresOpen,
  onGenresOpenChange,
}: TitleFormFieldsProps) {
  const selectedGenres = genres.filter((genre) => genresIds.includes(genre.id));

  const selectedTypeLabel =
    TITLE_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? "Movie";

  const toggleGenre = (genreId: string) => {
    onGenresIdsChange(
      genresIds.includes(genreId)
        ? genresIds.filter((id) => id !== genreId)
        : [...genresIds, genreId],
    );
  };

  const removeGenre = (genreId: string) => {
    onGenresIdsChange(genresIds.filter((id) => id !== genreId));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
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
            onChange={(e) => onYearChange(e.target.value)}
            placeholder="2023"
            className="h-10 border-white/10 bg-white/5 text-white placeholder:text-white/35"
          />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>

          <Popover open={typeOpen} onOpenChange={onTypeOpenChange}>
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
                            onTypeChange(item.value);
                            onTypeOpenChange(false);
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

          <Popover open={genresOpen} onOpenChange={onGenresOpenChange}>
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
                aria-label={`Remove ${genre.name} genre`}
                onClick={() => removeGenre(genre.id)}
                className="rounded-full cursor-pointer p-0.5 text-white/60 transition hover:bg-white/10 hover:text-white"
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
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Short description"
          className="min-h-24 resize-none border-white/10 bg-white/5 text-white placeholder:text-white/35"
        />
      </div>
    </div>
  );
}
