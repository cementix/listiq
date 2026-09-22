import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bookmark, Globe2, Lock } from "lucide-react";

import PageSection from "@/components/custom/PageSection";
import { getTitleListPage } from "@/lib/title-list/getTitleListPage";
import AddTitlesDialog from "./AddTitlesDialog";
import SortableTitleGrid from "./SortableTitleGrid";

type Props = {
  params: Promise<{ username: string; slug: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function TitleListPage({ params, searchParams }: Props) {
  const { username, slug } = await params;
  const { from } = await searchParams;
  const list = await getTitleListPage(username, slug);

  if (!list) notFound();

  const { viewer } = list;
  const cameFromMyLists = from === "my-lists";

  return (
    <PageSection className="mx-auto w-full max-w-[1600px] px-4 lg:px-6">
      <Link
        href={cameFromMyLists ? "/my-lists" : "/lists"}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft className="size-4" />
        {cameFromMyLists ? "My lists" : "Browse lists"}
      </Link>

      <header className="border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
          <Link
            href={`/users/${list.user.username}`}
            className="hover:text-white"
          >
            @{list.user.username}
          </Link>

          {list.systemType && (
            <span className="inline-flex items-center gap-1">
              <Bookmark className="size-4" />
              Default list
            </span>
          )}

          <span className="inline-flex items-center gap-1">
            {list.visibility === "PUBLIC" ? (
              <Globe2 className="size-4" />
            ) : (
              <Lock className="size-4" />
            )}
            {list.visibility === "PUBLIC" ? "Public" : "Private"}
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-semibold text-white">{list.title}</h1>

        {list.description && (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
            {list.description}
          </p>
        )}

        {viewer.isOwner && (
          <div className="mt-5">
            <AddTitlesDialog
              listId={list.id}
              existingTitleIds={list.items.map((item) => item.title.id)}
            />
          </div>
        )}
      </header>

      <section aria-label="Your progress" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-medium text-white">
              Your completion
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {viewer.completedCount} of {viewer.totalCount} titles in your
              library
            </p>
          </div>

          <strong className="text-2xl font-semibold text-white">
            {viewer.completionPercentage}%
          </strong>
        </div>

        <div
          role="progressbar"
          aria-label="List completion"
          aria-valuenow={viewer.completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-emerald-400 transition-[width]"
            style={{ width: `${viewer.completionPercentage}%` }}
          />
        </div>

        <p className="text-xs text-white/45">
          {viewer.ratedCount} rated
          {viewer.averageRating !== null &&
            ` · Your average rating: ${viewer.averageRating.toFixed(1)}/10`}
        </p>
      </section>

      {list.items.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center border-t border-white/10 text-center">
          <p className="text-white/55">No titles in this list yet.</p>
          {viewer.isOwner && (
            <Link href="/titles" className="mt-4 text-sm text-primary">
              Browse titles
            </Link>
          )}
        </div>
      ) : (
        <SortableTitleGrid
          key={list.items
            .map((item) => `${item.id}:${item.position}`)
            .join("|")}
          listId={list.id}
          initialItems={list.items}
          isOwner={viewer.isOwner}
        />
      )}
    </PageSection>
  );
}
