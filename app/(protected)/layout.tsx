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
      <div className="min-h-dvh bg-black pt-16 pb-[calc(5rem+env(safe-area-inset-bottom))] text-white lg:pb-0">
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
        <main id="main-content" tabIndex={-1} className="min-w-0 outline-none">{children}</main>
        <ProviderCredits />
      </div>
    </StoreProvider>
  );
};

export default ProtectedLayout;
