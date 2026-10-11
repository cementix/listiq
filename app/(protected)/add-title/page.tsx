import { getCurrentUser } from "@/lib/auth/guards";
import AddTitleForm from "./AddTitleForm";
import GlassCard from "../../../components/custom/GlassCard";
import PageSection from "../../../components/custom/PageSection";
import { getSession } from "@/lib/session";
import getGenres from "@/actions/title/getGenres";

export default async function AddTitlePage() {
  const session = await getSession();
  const genres = await getGenres();

  const currentUser = await getCurrentUser(session!);

  const canCreateDirectly =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "MODERATOR" ||
    currentUser?.role === "VERIFIED";

  return (
    <PageSection className="mx-auto w-full max-w-6xl px-4">
      <GlassCard className="p-4 sm:p-6">
        <p className="text-sm text-white/50">Add title</p>
        <h1 className="mt-2 text-3xl font-semibold">Add new title</h1>
        <p className="mt-3 max-w-xl text-white/70">
          Submit a new movie, game, manga or other title to the database
        </p>
      </GlassCard>

      <div className="mx-auto w-full max-w-5xl">
        <AddTitleForm canCreateDirectly={canCreateDirectly} genres={genres} />
      </div>
    </PageSection>
  );
}