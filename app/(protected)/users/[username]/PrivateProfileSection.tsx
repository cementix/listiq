import { LockKeyhole } from "lucide-react";

export default function PrivateProfileSection({ title }: { title: string }) {
  return (
    <section className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/45">
        <LockKeyhole className="size-5" />
      </div>
      <div>
        <h2 className="text-base font-medium text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/45">This section is private.</p>
      </div>
    </section>
  );
}
