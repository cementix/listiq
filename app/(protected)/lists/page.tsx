import Link from "next/link";
import { List, Search } from "lucide-react";

import PageSection from "@/components/custom/PageSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPublicTitleLists,
  type PublicTitleListSort,
} from "@/lib/title-list/getPublicTitleLists";
import PublicListCard from "./PublicListCard";

type PublicListsPageProps = {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    page?: string;
  }>;
};

const allowedSorts: PublicTitleListSort[] = ["newest", "popular"];

export default async function PublicListsPage({
  searchParams,
}: PublicListsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const sort = allowedSorts.includes(params.sort as PublicTitleListSort)
    ? (params.sort as PublicTitleListSort)
    : "newest";

  const requestedPage = Number(params.page);
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const result = await getPublicTitleLists({
    query,
    sort,
    page,
    limit: 24,
  });

  const buildHref = (
    nextPage: number,
    nextSort: PublicTitleListSort = sort,
  ) => {
    const nextParams = new URLSearchParams();

    if (query) {
      nextParams.set("q", query);
    }

    if (nextSort !== "newest") {
      nextParams.set("sort", nextSort);
    }

    if (nextPage > 1) {
      nextParams.set("page", String(nextPage));
    }

    const search = nextParams.toString();

    return `/lists${search ? `?${search}` : ""}`;
  };

  return (
    <PageSection className="mx-auto w-full max-w-[1600px] px-4 lg:px-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-white/45">Community</p>

          <h1 className="mt-1 text-3xl font-semibold text-white">Lists</h1>

          <p className="mt-2 max-w-xl text-sm text-white/60">
            Browse collections created by the community.
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/my-lists">
            <List />
            My lists
          </Link>
        </Button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          action="/lists"
          className="flex w-full max-w-xl items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/35" />

            <Input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search lists or users"
              className="pl-10"
            />
          </div>

          {sort !== "newest" && (
            <input type="hidden" name="sort" value={sort} />
          )}

          <Button type="submit">Search</Button>
        </form>

        <div className="flex shrink-0 rounded-lg border border-white/10 bg-white/5 p-1">
          {allowedSorts.map((option) => {
            const active = sort === option;

            return (
              <Link
                key={option}
                href={buildHref(1, option)}
                className={
                  active
                    ? "rounded-md bg-white px-3 py-1.5 text-sm text-black"
                    : "rounded-md px-3 py-1.5 text-sm text-white/55 transition hover:text-white"
                }
              >
                {option === "newest" ? "Newest" : "Popular"}
              </Link>
            );
          })}
        </div>
      </div>

      {result.lists.length > 0 ? (
        <section
          aria-label="Public title lists"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {result.lists.map((list) => (
            <PublicListCard key={`${list.id}:${list.isSaved}`} list={list} />
          ))}
        </section>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 px-6 text-center">
          <List className="size-8 text-white/25" />

          <h2 className="mt-4 text-lg font-medium text-white">
            No lists found
          </h2>

          <p className="mt-2 text-sm text-white/45">
            Try another search or create your own list.
          </p>
        </div>
      )}

      {(page > 1 || result.hasMore) && (
        <nav
          aria-label="Lists pagination"
          className="flex items-center justify-center gap-3"
        >
          {page > 1 && (
            <Button asChild variant="outline">
              <Link href={buildHref(page - 1)}>Previous</Link>
            </Button>
          )}

          <span className="text-sm text-white/45">Page {page}</span>

          {result.hasMore && result.nextPage && (
            <Button asChild variant="outline">
              <Link href={buildHref(result.nextPage)}>Next</Link>
            </Button>
          )}
        </nav>
      )}
    </PageSection>
  );
}
