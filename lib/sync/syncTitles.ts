import { seedCatalog, type SeedProvider } from "@/lib/catalog/seedCatalog";
import { runDailySyncOnce } from "./syncRun";

export async function syncTitlesDaily() {
  return runDailySyncOnce(() => seedCatalog());
}

export async function syncTitlesDeep() {
  return seedCatalog(undefined, "broad");
}

export async function syncTitlesProvider(
  provider: SeedProvider,
  mode: "daily" | "deep",
) {
  return seedCatalog(provider, mode === "deep" ? "broad" : "curated");
}
