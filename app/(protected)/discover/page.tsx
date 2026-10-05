import { getDiscoveryCandidates } from "@/actions/discovery/getDiscoveryCandidates";
import DiscoveryDeck from "./DiscoveryDeck";

export default async function DiscoverPage() {
  const initialCards = await getDiscoveryCandidates();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 text-white">
      <DiscoveryDeck initialCards={initialCards} />
    </main>
  );
}
