import { cookies } from "next/headers";

import GlassCard from "@/components/custom/GlassCard";
import PageSection from "@/components/custom/PageSection";
import { getSession } from "@/lib/session";

import DashboardHero from "./DashboardHero";
import DashboardRandomPicks from "./DashboardRandomPicks";
import DashboardRail from "./DashboardRail";
import TitlePosterCard from "./TitlePosterCard";
import { getDashboardTitles } from "./dashboardQueries";
import DashboardToast from "./DashboardToast";
import { getPublicTitleLists } from "@/lib/title-list/getPublicTitleLists";
import PublicListCard from "../lists/PublicListCard";

export default async function DashboardPage() {
  const session = await getSession();
  const cookieStore = await cookies();
  const flash = cookieStore.get("flash")?.value ?? null;
  const { hero, randomSideTitles, rails } = await getDashboardTitles();
  const { lists: popularLists } = await getPublicTitleLists({
    sort: "popular",
    limit: 12,
  });

  return (
    <>
      <DashboardToast flash={flash} />

      <PageSection className="mx-auto w-full max-w-[1600px] px-4 lg:px-6">
        {!hero ? (
          <GlassCard className="p-6">
            <p className="text-sm text-white/50">Dashboard</p>

            <h1 className="mt-2 text-3xl font-semibold">
              Welcome back, {session?.username}
            </h1>

            <p className="mt-3 max-w-xl text-white/70">
              No titles yet. Check back soon or add a title to get started.
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <DashboardHero title={hero} />
            <DashboardRandomPicks titles={randomSideTitles} />
          </div>
        )}

        <div className="space-y-8">
          {rails.map((rail, index) => (
            <DashboardRail
              key={rail.title}
              title={rail.title}
              href={rail.href}
              icon={rail.icon}
              index={index}
            >
              {rail.titles.map((title, index) => (
                <TitlePosterCard key={title.id} title={title} index={index} />
              ))}
            </DashboardRail>
          ))}
          {popularLists.length > 0 && (
            <DashboardRail
              title="Popular lists"
              href="/lists?sort=popular"
              icon="list"
              index={rails.length}
            >
              {popularLists.map((list) => (
                <div key={list.id} className="w-72 shrink-0 sm:w-80">
                  <PublicListCard list={list} />
                </div>
              ))}
            </DashboardRail>
          )}
        </div>
      </PageSection>
    </>
  );
}
