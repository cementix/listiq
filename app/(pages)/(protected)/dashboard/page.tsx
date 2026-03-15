import GlassCard from "@/components/custom/GlassCard";
import PageSection from "@/components/custom/PageSection";
import { getSession } from "@/lib/session";

const DashboardPage = async () => {
  const session = await getSession();

  return (
    <PageSection>
      <GlassCard className="p-6">
        <p className="text-sm text-white/50">Dashboard</p>

        <h1 className="mt-2 text-3xl font-semibold">
          Welcome back, {session?.username}
        </h1>

        <p className="mt-3 max-w-xl text-white/70">
          This is your base dashboard. Later here we can show recent activity,
          quick stats, list counts and shortcuts to add new entries.
        </p>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-5">
          <p className="text-sm text-white/50">movies</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="text-sm text-white/50">manga</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="text-sm text-white/50">games</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </GlassCard>
      </div>
    </PageSection>
  );
};

export default DashboardPage;
