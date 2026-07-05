import { getCurrentUser } from "@/actions/auth";
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

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar username={session.username} />
      {children}
    </div>
  );
}
