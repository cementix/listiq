import "server-only";

import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getSession, type SessionPayload } from "@/lib/session";

type CurrentUser = {
  role: UserRole;
};

type AuthenticatedUserContext = {
  user: CurrentUser;
  session: SessionPayload;
};

export async function requireGuest() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function getCurrentUser(
  session: SessionPayload,
): Promise<CurrentUser | null> {
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
}

export async function requireUserServer(): Promise<AuthenticatedUserContext> {
  const session = await getSession();

  if (!session?.userId) {
    throw new Error("Unauthorized");
  }

  const user = await getCurrentUser(session);

  if (!user) {
    throw new Error("User not found");
  }

  return { user, session };
}
