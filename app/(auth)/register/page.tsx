import DemoButton from "@/components/landing/DemoButton";
import { requireGuest } from "@/lib/auth/guards";
import RegisterForm from "./RegisterForm";

const RegisterPage = async () => {
  await requireGuest();

  return (
    <main className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-4xl font-semibold tracking-tight">
        Start your <span className="font-display font-normal italic text-gradient">library</span>
      </h1>
      <p className="mt-2 text-sm text-white/55">Free forever. Takes less than a minute.</p>

      <div className="mt-8">
        <RegisterForm />
      </div>

      <div className="my-8 flex items-center gap-3 text-xs text-white/35">
        <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
      </div>
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
        <p className="text-sm text-white/70">Just looking around?</p>
        <DemoButton className="sm:items-center" label="Explore the live demo" />
      </div>
    </main>
  );
};

export default RegisterPage;
