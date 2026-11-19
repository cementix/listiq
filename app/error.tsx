"use client";

import PageState from "@/components/custom/PageState";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageState code="oops" title="Couldn't load this page" description="Something went wrong. Try again, or return home.">
      <Button onClick={reset} className="rounded-full bg-white px-5 text-black hover:bg-white/90">Try again</Button>
    </PageState>
  );
}
