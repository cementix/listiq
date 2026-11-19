export const metadata = { title: "Discover" };
import { getDiscoveryCandidates } from "@/actions/discovery/getDiscoveryCandidates";
import DiscoveryDeck from "./DiscoveryDeck";
import { requireAuth } from "@/lib/auth/guards";
import { getDiscoverAllowance } from "@/lib/discovery/allowance";

export default async function DiscoverPage() {
  const session = await requireAuth();
  const [initialCards, allowance] = await Promise.all([getDiscoveryCandidates(), getDiscoverAllowance(session.userId)]);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 text-white">
      <DiscoveryDeck initialCards={initialCards} remainingToday={allowance.unlimited ? null : allowance.remaining} dailyLimit={allowance.unlimited ? null : allowance.limit} />
    </section>
  );
}
