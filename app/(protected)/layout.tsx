import { getNeedsChangesSubmissionsCount } from "@/actions/submissions/getNeedsChangesSubmissionsCount";
import { requireAuth } from "../../actions/auth";
import Navbar from "./Navbar";
import React from "react";
import { prisma } from "@/lib/prisma";
import NavbarShell from "./NavbarShell";
import StoreProvider from "../storeProvider";

const ProtectedLayout = async ({ children }: React.PropsWithChildren) => {
  const session = await requireAuth();
  const needsChangesCount = await getNeedsChangesSubmissionsCount();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      avatarUrl: true,
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
          />
        </NavbarShell>
        {children}
      </div>
    </StoreProvider>
  );
};

export default ProtectedLayout;
