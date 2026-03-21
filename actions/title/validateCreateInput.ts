import { CreateTitleInput } from "./types";

export function validateCreateInput(data: CreateTitleInput) {
  if (!data.name.trim()) return "Name is required";
  if (!data.genresIds.length) return "Select at least one genre";
  if (data.year && (data.year < 1800 || data.year > 2100))
    return "Invalid year";
  return null;
}
