import { requireAuth } from "@/actions/auth";
import Navbar from "@/components/custom/Navbar";
import { getSession } from "@/lib/session";
import React from "react";

const ProtectedLayout = async ({ children }: React.PropsWithChildren) => {
  const session = await requireAuth();
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar username={session.username} />
    </div>
  );
};

export default ProtectedLayout;
