import { getNeedsChangesSubmissionsCount } from "@/actions/submissions/getNeedsChangesSubmissionsCount";
import { requireAuth } from "@/lib/auth/guards";
import Navbar from "./Navbar";
import React from "react";
import { prisma } from "@/lib/prisma";
import NavbarShell from "./NavbarShell";
import StoreProvider from "../storeProvider";
import { canReviewSubmissions } from "@/actions/submissions/canReviewSubmissions";

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
    },
  });
  return (
    <StoreProvider>
      <div className="min-h-screen bg-black pt-[73px] text-white">
        <NavbarShell>
          <Navbar
            username={session.username}
            needsChangesCount={needsChangesCount}
            avatarUrl={user?.avatarUrl ?? null}
            canReview={user ? canReviewSubmissions(user.role) : false}
          />
        </NavbarShell>
        {children}
      </div>
    </StoreProvider>
  );
};

export default ProtectedLayout;
