"use client";

import { registerUser, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, LoaderCircle, Mail, User } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

const initialState: AuthState = {
  ok: false,
};

const RegisterForm = () => {
  const [state, formAction, pending] = useActionState(
    registerUser,
    initialState,
  );

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok && state.error) {
      toast.error(state.error);
    }

    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
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
          required
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
          required
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
          placeholder="********"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-48 h-10 hover:scale-105 cursor-pointer"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          "Register"
        )}
      </Button>

      <Link
        href="/login"
        className="group text-sm text-white/60 transition-colors hover:text-white/80"
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
