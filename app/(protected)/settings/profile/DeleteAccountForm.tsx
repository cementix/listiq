"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

import { deleteAccount } from "@/actions/profile/deleteAccount";
import type { ActionResult } from "@/actions/types";
import PasswordInput from "@/components/custom/PasswordInput";
import { Input } from "@/components/ui/input";

export default function DeleteAccountForm({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(deleteAccount, null);

  return (
    <section id="danger" className="scroll-mt-24 rounded-3xl border border-rose-500/25 bg-rose-500/[0.04] p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-medium text-white"><AlertTriangle className="size-4 text-rose-300" />Danger zone</h2>
          <p className="mt-1 text-sm text-white/60">Permanently delete your account, library, lists, reviews and posts. This cannot be undone.</p>
        </div>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-rose-400/30 px-5 text-sm font-medium text-rose-200 transition hover:bg-rose-500/10">
            <Trash2 className="size-4" /> Delete account
          </button>
        )}
      </div>

      {open && (
        <form action={action} className="mt-5 grid gap-4 border-t border-rose-500/15 pt-5 sm:grid-cols-2 animate-in fade-in slide-in-from-top-2">
          <label className="space-y-2 text-sm">
            <span className="text-white/70">Type <b className="text-white">{username}</b> to confirm</span>
            <Input name="confirmation" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-white/70">Current password</span>
            <PasswordInput name="password" autoComplete="current-password" required />
          </label>
          {state && !state.ok && <p role="alert" className="text-sm text-rose-300 sm:col-span-2">{state.error}</p>}
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={pending || confirmation !== username}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-rose-500 px-5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete my account forever
            </button>
            <button type="button" onClick={() => { setOpen(false); setConfirmation(""); }} className="h-11 rounded-full px-5 text-sm text-white/70 transition hover:text-white">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
