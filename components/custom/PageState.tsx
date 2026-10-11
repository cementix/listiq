import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export default function PageState({ title, description, children }: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="mx-auto flex min-h-[55dvh] max-w-xl flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
      <p className="max-w-md text-sm leading-6 text-white/60">{description}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {children}
        <Button asChild variant="outline"><Link href="/">Go home</Link></Button>
      </div>
    </section>
  );
}
