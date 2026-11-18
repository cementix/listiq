"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/actions/types";
import { requireUserServer } from "@/lib/auth/guards";
import { getStripe } from "@/lib/billing/stripe";
import { logError } from "@/lib/observability/errors";
import { prisma } from "@/lib/prisma";
import { securityErrorMessage } from "@/lib/security/errors";
import { limitUser } from "@/lib/security/limits";
import { deleteSession } from "@/lib/session";

/**
 * Permanently deletes the signed-in account after re-checking the password and
 * a typed username. Cascades remove library, lists, posts and activity.
 */
export async function deleteAccount(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const { session } = await requireUserServer();
    // Guests (demo sandboxes) are blocked here by limitUser; they leave via sign out.
    await limitUser("account", session.userId);

    const confirmation = String(formData.get("confirmation") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const account = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { username: true, passwordHash: true, stripeSubscriptionId: true },
    });
    if (!account) return { ok: false, error: "Account not found" };
    if (confirmation !== account.username) return { ok: false, error: `Type ${account.username} to confirm.` };
    if (!password || password.length > 1024 || !(await bcrypt.compare(password, account.passwordHash))) {
      return { ok: false, error: "Current password is incorrect" };
    }

    if (account.stripeSubscriptionId) {
      // Best effort: a failed cancellation must not keep a member from leaving.
      await getStripe()?.subscriptions.cancel(account.stripeSubscriptionId).catch((error) => logError("actions.profile.deleteAccount.stripe", error));
    }

    await prisma.user.delete({ where: { id: session.userId } });
    await deleteSession();
  } catch (error) {
    logError("actions.profile.deleteAccount", error);
    return { ok: false, error: securityErrorMessage(error, "Couldn't delete the account. Please try again.") };
  }
  redirect("/?account=deleted");
}
