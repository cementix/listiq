import type { SeedProvider } from "@/lib/catalog/types";

const permissionVariables: Partial<Record<SeedProvider, string>> = {
  anilist: "ANILIST_API_PERMISSION_CONFIRMED",
  "google-books": "GOOGLE_BOOKS_CATALOG_PERMISSION_CONFIRMED",
  "comic-vine": "COMIC_VINE_CATALOG_PERMISSION_CONFIRMED",
};

/** These providers need recorded permission for our persisted-catalog model. */
export function providerImportEnabled(provider: SeedProvider) {
  const variable = permissionVariables[provider];
  return !variable || process.env[variable] === "true";
}

export function replacementSyncEnabled(provider: "manga-updates" | "open-library" | "wikidata") {
  return process.env.CATALOG_REPLACEMENTS_DAILY === "true" &&
    (provider !== "open-library" || (
      process.env.OPEN_LIBRARY_CATALOG_PERMISSION_CONFIRMED === "true" &&
      Boolean(process.env.OPEN_LIBRARY_CONTACT?.trim())
    ));
}
