import { getNeedsChangesSubmissionsCount } from "@/actions/submissions/getNeedsChangesSubmissionsCount";
import { requireAuth } from "../../actions/auth";
import Navbar from "./Navbar";
import React from "react";

const ProtectedLayout = async ({ children }: React.PropsWithChildren) => {
  const session = await requireAuth();
  const needsChangesCount = await getNeedsChangesSubmissionsCount();
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar
        username={session.username}
        needsChangesCount={needsChangesCount}
      />
      {children}
    </div>
  );
};

export default ProtectedLayout;
