import Aurora from "@/components/custom/Aurora";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0 transition-opacity duration-500 opacity-100">
        <Aurora
          colorStops={["#cf3abb", "#0acd9c", "#29bfff"]}
          blend={0.7}
          amplitude={0.67}
          speed={0.53}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
