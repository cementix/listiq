import { getTitles } from "@/actions/title/getTitles";
import PageHeader from "@/components/custom/PageHeader";
import { BookOpen } from "lucide-react";
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
    : "popular";

  const titlesResult = await getTitles({
    query,
    type,
    sort,
    page: 1,
    limit: 24,
  });

  return (
    <PageSection className="mx-auto w-full max-w-[1600px] px-4 lg:px-6">
      <PageHeader eyebrow="Catalog" title="Titles" description="Browse approved titles and add them to your library." icon={<BookOpen className="size-3.5" />} />

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
