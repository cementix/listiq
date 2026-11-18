export const metadata = { title: "Add a title" };
import { getCurrentUser } from "@/lib/auth/guards";
import PageHeader from "@/components/custom/PageHeader";
import { Plus } from "lucide-react";
import AddTitleForm from "./AddTitleForm";
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
      <PageHeader eyebrow="Add title" title="Add new title" description="Submit a new movie, game, manga or other title to the database" icon={<Plus className="size-3.5" />} />

      <div className="mx-auto w-full max-w-5xl">
        <AddTitleForm canCreateDirectly={canCreateDirectly} genres={genres} />
      </div>
    </PageSection>
  );
}