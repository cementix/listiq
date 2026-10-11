import { caveat } from "@/app/fonts";
import { requireGuest } from "@/lib/auth/guards";
import LoginForm from "./LoginForm";

const LoginPage = async () => {
  await requireGuest();

  return (
    <main className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-8 text-white animate-in slide-in-from-top-2">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <h1 className="mb-6 text-center">
          <span
            className={`${caveat.className} title-float inline-block select-none text-5xl font-semibold`}
          >
            Login
          </span>
        </h1>

        <LoginForm />
      </div>
    </main>
  );
};

export default LoginPage;
