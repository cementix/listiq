import { getNeedsChangesSubmissionsCount } from "@/actions/submissions/getNeedsChangesSubmissionsCount";
import { requireAuth } from "@/lib/auth/guards";
import Navbar from "./Navbar";
import React from "react";
import { prisma } from "@/lib/prisma";
import NavbarShell from "./NavbarShell";
import DemoBanner from "./DemoBanner";
import StoreProvider from "../storeProvider";
import { canReviewSubmissions } from "@/actions/submissions/canReviewSubmissions";
import ProviderCredits from "@/components/custom/ProviderCredits";

const ProtectedLayout = async ({ children }: React.PropsWithChildren) => {
  const session = await requireAuth();
  const needsChangesCount = await getNeedsChangesSubmissionsCount();

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      avatarUrl: true,
      role: true,
      isGuest: true,
      guestExpiresAt: true,
    },
  });
  const guestHoursLeft = user?.isGuest && user.guestExpiresAt
    ? Math.max(1, Math.ceil((user.guestExpiresAt.getTime() - new Date().getTime()) / 3_600_000))
    : null;

  return (
    <StoreProvider>
      <div className="relative isolate min-h-dvh bg-black pt-16 pb-[calc(5rem+env(safe-area-inset-bottom))] text-white lg:pb-0">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-64 left-1/2 h-[560px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.16),transparent)]" />
          <div className="absolute top-1/3 -right-48 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.07),transparent)] animate-glow" />
          <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,#000_10%,transparent_60%)]" />
        </div>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-black">Skip to content</a>
        <NavbarShell>
          <Navbar
            username={session.username}
            needsChangesCount={needsChangesCount}
            avatarUrl={user?.avatarUrl ?? null}
            canReview={user ? canReviewSubmissions(user.role) : false}
          />
        </NavbarShell>
        {user?.isGuest && <DemoBanner hoursLeft={guestHoursLeft} />}
        <main id="main-content" tabIndex={-1} className="relative min-w-0 outline-none">{children}</main>
        <ProviderCredits />
      </div>
    </StoreProvider>
  );
};

export default ProtectedLayout;
