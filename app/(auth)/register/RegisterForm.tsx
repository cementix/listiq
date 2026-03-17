"use client";

import { registerUser, type AuthState } from "../../../actions/auth";
import FormInput from "../../../components/custom/FormInput";
import FormLabel from "../../../components/custom/FormLabel";
import MainButton from "../../../components/custom/MainButton";
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
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 animate-in fade-in flex flex-col items-center slide-in-from-bottom-2 duration-300"
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

      <div className="w-full">
        <FormLabel>
          Username <User size={15} />
        </FormLabel>
        <FormInput
          type="text"
          name="username"
          placeholder="leonKennedyFan"
          required
        />
      </div>

      <div className="w-full mb-7">
        <FormLabel>
          Password <Key size={15} />
        </FormLabel>
        <FormInput
          type="password"
          name="password"
          placeholder="********"
          required
        />
      </div>

      <MainButton type="submit" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : "Register"}
      </MainButton>

      <Link href="/login" className="text-sm">
        Already have <b className="text-accent">an account?</b> Login.
      </Link>
    </form>
  );
};

export default RegisterForm;
