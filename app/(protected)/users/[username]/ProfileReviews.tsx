import Link from "next/link";
import { ChevronDown } from "lucide-react";

import GlassCard from "@/components/custom/GlassCard";
import ProfilePrivacyHint from "./ProfilePrivacyHint";

type ProfileReview = {
  id: string;
  rating: number | null;
  note: string | null;
  title: {
    name: string;
    slug: string;
  };
};

type ProfileReviewsProps = {
  reviews: ProfileReview[];
  privateForOthers?: boolean;
};

export default function ProfileReviews({
  reviews,
  privateForOthers = false,
}: ProfileReviewsProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-white">Latest reviews</h2>
        {privateForOthers && <ProfilePrivacyHint />}
      </div>

      <div className="mt-4 space-y-3">
        {reviews.length === 0 ? (
          <p className="text-sm text-white/50">No reviews yet.</p>
        ) : (
          <>
            {reviews.slice(0, 5).map((entry) => (
              <Link
                key={entry.id}
                href={`/titles/${entry.title.slug}`}
                className="block rounded-2xl border border-white/10 bg-black/20 p-[14.5] transition hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{entry.title.name}</p>
                  {entry.rating !== null && (
                    <p className="text-sm text-primary">
                      {entry.rating.toFixed(1)}/10
                    </p>
                  )}
                </div>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">
                  {entry.note}
                </p>
              </Link>
            ))}

            {reviews.length > 5 && (
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/55 transition hover:bg-white/10 hover:text-white">
                  Show older reviews
                  <ChevronDown className="size-4 transition group-open:rotate-180" />
                </summary>

                <div className="mt-3 space-y-3">
                  {reviews.slice(5).map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/titles/${entry.title.slug}`}
                      className="block rounded-xl border border-white/10 bg-black/20 p-3 transition hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-white">
                          {entry.title.name}
                        </p>
                        {entry.rating !== null && (
                          <p className="shrink-0 text-xs text-primary">
                            {entry.rating.toFixed(1)}/10
                          </p>
                        )}
                      </div>

                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/60">
                        {entry.note}
                      </p>
                    </Link>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
}
