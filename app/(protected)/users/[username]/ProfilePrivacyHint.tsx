import { LockKeyhole } from "lucide-react";

export default function ProfilePrivacyHint() {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs leading-4 text-white/50">
      <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />
      Only you can see this section
    </span>
  );
}
