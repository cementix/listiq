"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { cleanupExpiredGuests, createGuestSandbox, deleteGuestUser } from "@/lib/demo/guest";
import { logError } from "@/lib/observability/errors";
import { securityErrorMessage } from "@/lib/security/errors";
import { limitDemo } from "@/lib/security/limits";
import { createSession, deleteSession, getSession } from "@/lib/session";

export type DemoState = { ok: boolean; error?: string };

export async function startDemo(): Promise<DemoState> {
  if (await getSession()) redirect("/dashboard");

  try {
    await limitDemo();
    await cleanupExpiredGuests().catch((error) => logError("actions.demo.cleanup", error));
    const user = await createGuestSandbox();
    await createSession({ userId: user.id, username: user.username, email: user.email });

    const cookieStore = await cookies();
    cookieStore.set("flash", encodeURIComponent("Welcome to your Listiq sandbox — explore freely"), {
      path: "/",
      httpOnly: false,
      maxAge: 10,
    });
  } catch (error) {
    logError("actions.demo.startDemo", error);
    return { ok: false, error: securityErrorMessage(error, "Couldn't start the demo. Please try again.") };
  }

  redirect("/dashboard");
}

/** Leaves the sandbox (deleting it) so the visitor can register a real account. */
export async function exitDemo() {
  const session = await getSession();
  if (session) {
    await deleteGuestUser(session.userId).catch((error) => logError("actions.demo.exitDemo", error));
  }
  await deleteSession();
  redirect("/register");
}
