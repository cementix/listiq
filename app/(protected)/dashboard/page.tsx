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

export default async function DashboardPage() {
  const session = await getSession();
  const cookieStore = await cookies();
  const flash = cookieStore.get("flash")?.value ?? null;
  const { hero, randomSideTitles, rails } = await getDashboardTitles();

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
              No titles yet. Run the title sync to fill the dashboard.
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
        </div>
      </PageSection>
    </>
  );
}
