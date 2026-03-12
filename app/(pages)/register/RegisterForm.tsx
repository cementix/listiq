"use client";

import { PropsWithChildren, useActionState, useEffect, useRef } from "react";
import { registerUser, type RegisterState } from "@/actions/auth";
import MainButton from "@/components/custom/MainButton";
import { toast } from "sonner";
import { Key, Loader, LoaderCircle, Mail, User } from "lucide-react";

const initialState: RegisterState = {
  ok: false,
};

const FormLabel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <label
      className={
        className || "mb-2 flex items-center gap-2 text-md w-full text-white/70"
      }
    >
      {children}
    </label>
  );
};

const FormInput = ({
  type,
  name,
  placeholder,
  required,
  className,
}: {
  type: string;
  name: string;
  placeholder: string;
  required: boolean;
  className?: string;
}) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      required={required}
      className={
        className ||
        "w-full rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-foreground/90 placeholder:text-xs placeholder:text-muted-foreground/70 outline-none transition-all duration-200 focus:-translate-y-[1px] focus:border-ring focus:bg-background/80 focus:shadow-[0_0_0_1px_rgba(129,140,248,0.45)] focus:placeholder:text-muted-foreground/40"
      }
    />
  );
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
