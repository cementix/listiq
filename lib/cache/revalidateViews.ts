import "server-only";

import { revalidatePath } from "next/cache";

export function revalidateListViews() {
  revalidatePath("/my-lists");
  revalidatePath("/lists");
  revalidatePath("/lists/[username]/[slug]", "page");
  revalidatePath("/users/[username]", "page");
  revalidatePath("/dashboard");
  revalidatePath("/discover");
}

export function revalidateLibraryViews(titleSlug: string) {
  revalidatePath(`/titles/${titleSlug}`);
  revalidatePath("/titles");
  // List completion and profile statistics depend on library entries too.
  revalidateListViews();
}

export function revalidateCatalogViews() {
  revalidatePath("/titles");
  revalidatePath("/titles/[slug]", "page");
  revalidateListViews();
}
