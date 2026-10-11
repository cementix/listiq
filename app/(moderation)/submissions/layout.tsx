import { getCurrentUser } from "@/lib/auth/guards";
import { getNeedsChangesSubmissionsCount } from "@/actions/submissions/getNeedsChangesSubmissionsCount";
import Navbar from "@/app/(protected)/Navbar";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ModerationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await getCurrentUser(session);

  const canReview = user?.role === "ADMIN" || user?.role === "MODERATOR";

  if (!canReview) {
    redirect("/dashboard");
  }

  const needsChangesCount = await getNeedsChangesSubmissionsCount();

  return (
    <div className="min-h-dvh bg-black pb-[calc(5rem+env(safe-area-inset-bottom))] text-white lg:pb-0">
      <Navbar
        username={session.username}
        needsChangesCount={needsChangesCount}
        avatarUrl={null}
        canReview={canReview}
      />
      {children}
    </div>
  );
}
