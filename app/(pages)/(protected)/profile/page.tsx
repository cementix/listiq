import GlassCard from "@/components/custom/GlassCard";
import PageSection from "@/components/custom/PageSection";
import { getSession } from "@/lib/session";

const ProfilePage = async () => {
  const session = await getSession();

  return (
    <PageSection>
      <GlassCard className="p-6">
        <p className="text-sm text-white/50">Profile</p>
        <h1 className="mt-2 text-3xl font-semibold">@{session?.username}</h1>
        <p className="mt-3 text-white/70">{session?.email}</p>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold">About</h2>
        <p className="mt-3 text-white/70">
          Later here we can have avatar, bio, favorite titles, stats and recent
          reviews.
        </p>
      </GlassCard>
    </PageSection>
  );
};

export default ProfilePage;
