import { requireGuest } from "../../../actions/auth";
import LoginForm from "./LoginForm";

const LoginPage = async () => {
  await requireGuest();

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="mb-6 text-2xl font-semibold text-center">Login</h1>

        <LoginForm />
      </div>
    </main>
  );
};

export default LoginPage;
