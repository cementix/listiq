import { importCatalog } from "./importCatalog";
import { scoreCatalog } from "./scoreCatalog";
import { setSyncProgress } from "@/lib/sync/syncUtils";
import type { SeedMode, SeedProvider } from "./types";

export async function seedCatalog(
  provider?: SeedProvider,
  mode: SeedMode = "curated",
) {
  const { results, failures } = await importCatalog(provider, mode);

  // Score successful imports even when another provider failed.
  setSyncProgress("catalog", "scoring");
  console.log("[catalog] scoring imported titles");
  const scoring = await scoreCatalog();

  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((failure) => failure.error),
      `Catalog seed failed for: ${failures.map((failure) => failure.provider).join(", ")}. Completed providers remain saved.`,
    );
  }

  return {
    titlesCreated: results.reduce(
      (sum, result) => sum + result.titlesCreated,
      0,
    ),
    titlesUpdated: results.reduce(
      (sum, result) => sum + result.titlesUpdated,
      0,
    ),
    providers: results,
    scoring,
  };
}
