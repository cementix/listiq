import { getTitles } from "@/actions/title/getTitles";
import GlassCard from "@/components/custom/GlassCard";
import PageSection from "@/components/custom/PageSection";
import { TitleType } from "@/generated/prisma/enums";
import TitlesList from "./TitlesList";

type TitlesPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: TitleType | "ALL";
    sort?: string;
  }>;
};

const allowedSorts = [
  "newest",
  "popular",
  "highest-rated",
  "most-reviewed",
  "recently-added",
] as const;

export default async function TitlesPage({ searchParams }: TitlesPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const type = params.type ?? "ALL";
  const sort = allowedSorts.includes(
    params.sort as (typeof allowedSorts)[number],
  )
    ? (params.sort as (typeof allowedSorts)[number])
    : "newest";

  const titlesResult = await getTitles({
    query,
    type,
    sort,
    page: 1,
    limit: 24,
  });

  return (
    <PageSection className="mx-auto w-full max-w-[1600px] px-4 lg:px-6">
      <GlassCard className="p-4 sm:p-6">
        <p className="text-sm text-white/50">Catalog</p>
        <h1 className="mt-2 text-3xl font-semibold">Titles</h1>
        <p className="mt-3 max-w-xl text-white/70">
          Browse approved titles and add them to your library.
        </p>
      </GlassCard>

      <TitlesList
        initialTitles={titlesResult.titles}
        initialHasMore={titlesResult.hasMore}
        initialNextPage={titlesResult.nextPage}
        query={query}
        type={type}
        sort={sort}
      />
    </PageSection>
  );
}
