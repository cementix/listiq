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
        />
      </div>

      {!state.ok && state.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}

      <Button
        type="submit"
        disabled={pending}
        className="w-48 h-10 cursor-pointer hover:scale-105"
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
