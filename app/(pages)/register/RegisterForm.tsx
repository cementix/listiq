"use client";

import { registerUser, type RegisterState } from "@/actions/auth";
import FormInput from "@/components/custom/FormInput";
import FormLabel from "@/components/custom/FormLabel";
import MainButton from "@/components/custom/MainButton";
import { Key, LoaderCircle, Mail, User } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

const initialState: RegisterState = {
  ok: false,
};

const RegisterForm = () => {
  const [state, formAction, pending] = useActionState(
    registerUser,
    initialState,
  );

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.success) {
      toast.success(state.success);
      formRef.current?.reset();
    }

    if (!state.ok && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div>
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

      <div>
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

      <div>
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
    </form>
  );
};

export default RegisterForm;
