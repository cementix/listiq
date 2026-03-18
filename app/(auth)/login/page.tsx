import { caveat } from "@/app/fonts";
import { requireGuest } from "../../../actions/auth";
import LoginForm from "./LoginForm";
import Aurora from "@/components/custom/Aurora";

const LoginPage = async () => {
  await requireGuest();

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <div className="absolute inset-0 z-0">
          <Aurora
            colorStops={["#cf3abb", "#0acd9c", "#29bfff"]}
            blend={0.7}
            amplitude={0.67}
            speed={0.53}
          />
        </div>

        <main className="relative z-10 flex min-h-screen items-center justify-center px-4 text-white">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
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
      </div>
    </>
  );
};

export default LoginPage;
