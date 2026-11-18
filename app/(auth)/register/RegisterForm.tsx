"use client";

import { registerUser, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, LoaderCircle, Mail, User } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const initialState: AuthState = {
  ok: false,
};

const RegisterForm = () => {
  const [state, formAction, pending] = useActionState(
    registerUser,
    initialState,
  );

  const submitting = useRef(false);
  useEffect(() => { if (!pending) submitting.current = false; }, [pending, state]);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!state.ok && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      action={formAction}
      aria-busy={pending}
      onSubmit={(event) => {
        if (submitting.current) { event.preventDefault(); return; }
        submitting.current = true;
      }}
      className="animate-in slide-in-from-bottom-2 flex flex-col items-center space-y-4 fade-in duration-300"
    >
      <div className="w-full space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          Email <Mail size={13} className="text-white/60" />
        </Label>
        <Input
          id="email"
          type="email"
          name="email"
          placeholder="you@example.com"
          readOnly={pending}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="w-full space-y-2">
        <Label htmlFor="username" className="flex items-center gap-2">
          Username <User size={13} className="text-white/60" />
        </Label>
        <Input
          id="username"
          type="text"
          name="username"
          placeholder="leonKennedyFan"
          readOnly={pending}
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="mb-7 w-full space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          Password <Key size={13} className="text-white/60" />
        </Label>
        <Input
          id="password"
          type="password"
          name="password"
          placeholder="*****************"
          readOnly={pending}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby="password-strength"
        />
        <PasswordStrength password={password} />
      </div>

      {!state.ok && state.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full cursor-pointer rounded-full bg-white font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_40px_-12px_rgba(167,139,250,0.9)]"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          "Register"
        )}
      </Button>

      <Link
        href="/login"
        className="group text-sm text-white/60 transition-colors hover:text-white/80 select-none"
      >
        Already have{" "}
        <span className="font-semibold text-primary/70 transition-colors group-hover:text-primary/90">
          an account?
        </span>{" "}
        Login.
      </Link>
    </form>
  );
};

export default RegisterForm;

const STRENGTH = [
  { label: "Too short", color: "bg-rose-400" },
  { label: "Weak", color: "bg-rose-400" },
  { label: "Okay", color: "bg-amber-300" },
  { label: "Strong", color: "bg-emerald-400" },
  { label: "Excellent", color: "bg-emerald-400" },
];

/** Lightweight strength hint: length plus character variety (the server enforces the real rules). */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;
  const score = password.length < 6 ? 0 : Math.min(4, (password.length >= 12 ? 2 : 1) + Math.max(0, variety - 1));
  const { label, color } = STRENGTH[score];
  return (
    <div id="password-strength" aria-live="polite" className="flex items-center gap-3 pt-1">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((step) => (
          <span key={step} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${score >= step ? color : "bg-white/10"}`} />
        ))}
      </div>
      <span className="w-16 text-right text-xs text-white/60">{label}</span>
    </div>
  );
}
