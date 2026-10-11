import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Bookmark, Globe2, List, Lock } from "lucide-react";

import PageSection from "@/components/custom/PageSection";
import { getMyTitleLists } from "@/lib/title-list/getMyTitleLists";
import CreateTitleListDialog from "./CreateTitleListDialog";

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function ListsPage() {
  const lists = await getMyTitleLists();
  const sections = [
    { label: "Your lists", entries: lists.filter((list) => !list.isSaved) },
    { label: "Saved lists", entries: lists.filter((list) => list.isSaved) },
  ].filter((section) => section.entries.length > 0);

  return (
    <PageSection className="mx-auto w-full max-w-[1600px] px-4 lg:px-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-white/45">Library</p>
          <h1 className="mt-1 text-3xl font-semibold text-white">Your lists</h1>
        </div>
        <CreateTitleListDialog />
      </header>

      {sections.length === 0 && (
        <div role="status" className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
          <h2 className="font-medium text-white">No lists yet</h2>
          <p className="mt-2 text-sm">Create your first list with New list, or save a public list while browsing.</p>
        </div>
      )}
      {sections.map(({ label, entries }) => (
        <section key={label} aria-label={label} className="space-y-4">
          <h2 className="text-lg font-medium text-white">{label}</h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {entries.map((list) => {
              const preview = Array.from(
                { length: 4 },
                (_, index) => list.items[index] ?? null,
              );

              return (
                <Link
                  key={list.id}
                  href={`/lists/${list.user.username}/${list.slug}?from=my-lists`}
                  className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <div className="grid aspect-[2/1] grid-cols-4 gap-px overflow-hidden border-b border-white/10 bg-white/10">
                    {preview.map((item, index) => (
                      <div
                        key={item?.title.id ?? `empty-${index}`}
                        className="relative bg-black/40"
                      >
                        {item?.title.imageUrl ? (
                          <Image
                            src={item.title.imageUrl}
                            alt={item.title.name}
                            fill
                            sizes="160px"
                            className="object-cover transition duration-300 group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <List className="size-5 text-white/15" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-medium text-white">
                          {list.title}
                        </h3>
                        <p className="mt-1 text-xs text-white/45">
                          {list.isSaved
                            ? `by @${list.user.username}`
                            : list.systemType
                              ? "Default list"
                              : list.visibility === "PUBLIC"
                                ? "Public"
                                : "Private"}
                        </p>
                      </div>
                      <ArrowUpRight className="size-4 shrink-0 text-white/35 group-hover:text-white" />
                    </div>

                    <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-white/50">
                      {list.description || "No description"}
                    </p>

                    <div className="mt-3 flex justify-between gap-2 text-xs text-white/55">
                      <span>
                        {list.viewer.completedCount}/{list.viewer.totalCount}{" "}
                        completed ({list.viewer.completionPercentage}%)
                      </span>
                      <span>
                        {list.viewer.averageRating === null
                          ? "No ratings"
                          : `Your avg ${list.viewer.averageRating.toFixed(1)}/10`}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
                      {list.isSaved ? (
                        <Bookmark className="size-3.5" />
                      ) : list.visibility === "PUBLIC" ? (
                        <Globe2 className="size-3.5" />
                      ) : (
                        <Lock className="size-3.5" />
                      )}
                      <span>
                        {list._count.items}{" "}
                        {list._count.items === 1 ? "title" : "titles"}
                      </span>
                      <span>·</span>
                      <span>
                        Updated {dateFormatter.format(list.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div
                    role="progressbar"
                    aria-label={`Your completion of ${list.title}`}
                    aria-valuenow={list.viewer.completionPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-1.5 w-full bg-white/10"
                  >
                    <div
                      className="h-full bg-emerald-400"
                      style={{ width: `${list.viewer.completionPercentage}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </PageSection>
  );
}
