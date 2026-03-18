"use client";

import { Label } from "@/components/ui/label";
import { loginUser, type AuthState } from "../../../actions/auth";
import { Key, LoaderCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: AuthState = {
  ok: false,
};

const LoginForm = () => {
  const [state, formAction, pending] = useActionState(loginUser, initialState);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!state.ok && state.error) {
      toast.error(state.error);
    }

    if (state.ok) {
      setEmail("");
      setPassword("");
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className="space-y-4 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="w-full space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          Email <Mail size={13} className="text-white/60" />
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="w-full mb-7 space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          Password <Key size={13} className="text-white/60" />
        </Label>
        <Input
          id="password"
          type="password"
          name="password"
          placeholder="*****************"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-10 w-48 cursor-pointer hover:scale-105"
      >
        {pending ? <LoaderCircle className="animate-spin size-4" /> : "Login"}
      </Button>

      <Link
        href="register"
        className="group text-sm text-white/60 transition-colors hover:text-white/80 select-none"
      >
        Do not have{" "}
        <span className="font-semibold text-primary/70 transition-colors group-hover:text-primary/90">
          an account?
        </span>{" "}
        Register.
      </Link>
    </form>
  );
};

export default LoginForm;
