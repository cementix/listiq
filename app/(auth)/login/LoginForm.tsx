"use client";

import { loginUser, type AuthState } from "../../../actions/auth";
import FormInput from "../../../components/custom/FormInput";
import FormLabel from "../../../components/custom/FormLabel";
import MainButton from "../../../components/custom/MainButton";
import { Key, LoaderCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

const initialState: AuthState = {
  ok: false,
};

const LoginForm = () => {
  const [state, formAction, pending] = useActionState(loginUser, initialState);

  useEffect(() => {
    if (!state.ok && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className="space-y-4 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="w-full">
        <FormLabel>
          Email <Mail size={15} />
        </FormLabel>
        <FormInput
          type="email"
          name="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="w-full mb-6">
        <FormLabel>
          Password <Key size={15} />
        </FormLabel>
        <FormInput
          type="password"
          name="password"
          placeholder="**********"
          required
        />
      </div>

      <MainButton type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : "Login"}
      </MainButton>

      <Link href="/register" className="text-sm">
        Do not have <b className="text-accent">an account? </b>
        Register.
      </Link>
    </form>
  );
};

export default LoginForm;
