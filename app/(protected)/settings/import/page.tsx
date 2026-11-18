import type { Metadata } from "next";
import Link from "next/link";
import { FileUp, Lock, Sparkles } from "lucide-react";

import PageHeader from "@/components/custom/PageHeader";
import PageSection from "@/components/custom/PageSection";
import { Plan } from "@/generated/prisma/enums";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import ImportForm from "./ImportForm";

export const metadata: Metadata = { title: "Import your library" };

const STEPS = [
  { name: "Letterboxd", how: "Settings → Import & Export → Export your data, then upload ratings.csv or diary.csv." },
  { name: "Goodreads", how: "My Books → Import and export → Export library, then upload the CSV." },
  { name: "Anything else", how: "Any CSV with a Title (or Name) column. Year, Rating and Review columns are picked up automatically." },
];

export default async function ImportPage() {
  const session = await requireAuth();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId }, select: { plan: true, isGuest: true } });
  const isPro = user.plan === Plan.PRO;

  return (
    <PageSection className="mx-auto w-full max-w-6xl px-4 lg:px-6">
      <PageHeader
        eyebrow="Import"
        title={<>Bring your <span className="font-display font-normal italic text-gradient">history</span> with you</>}
        description="Move years of ratings from other trackers in one go. Titles are matched against the Listiq catalog; ratings on 5-star scales are converted to 10 points."
        icon={<FileUp className="size-3.5" />}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
          {isPro ? (
            <ImportForm />
          ) : (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-violet-500/15 text-violet-300"><Lock className="size-6" /></span>
              <p className="text-lg font-semibold">Imports are part of Pro</p>
              <p className="max-w-sm text-sm text-white/55">
                {user.isGuest ? "Create a free account, then upgrade in Stripe test mode to try imports." : "Upgrade in Stripe test mode — no real money moves — and import your whole history."}
              </p>
              {!user.isGuest && (
                <Link href="/settings/billing" className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:-translate-y-0.5">
                  <Sparkles className="size-4 text-violet-600" />
                  See Pro
                </Link>
              )}
            </div>
          )}
        </section>

        <aside className="space-y-3">
          {STEPS.map((step, index) => (
            <div key={step.name} style={{ animationDelay: `${index * 80}ms` }} className="dashboard-pick-in rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-sm font-semibold text-white">{step.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/55">{step.how}</p>
            </div>
          ))}
        </aside>
      </div>
    </PageSection>
  );
}
