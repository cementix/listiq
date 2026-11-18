import type { Metadata } from "next";
import { redirect } from "next/navigation";

import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";
import LandingNav from "@/components/landing/LandingNav";
import { MotionProvider } from "@/components/landing/primitives";
import { Faq, FinalCta, Footer, Pricing, StatsStrip, Steps, TrendingStrip } from "@/components/landing/Sections";
import Showcase from "@/components/landing/Showcase";
import { getLandingData } from "@/lib/landing/getLandingData";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "Listiq — everything you watch, read and play, in one library" },
  description:
    "Track movies, series, anime, manga, games, books and comics. Rate, review, build lists and discover what to start next. Try the live demo — no signup.",
};

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  const { posters, stats } = await getLandingData();

  return (
    <MotionProvider>
      <div className={`relative min-h-screen overflow-x-clip bg-black text-white selection:bg-violet-500/40`}>
        <LandingNav />
        <main>
          <Hero posters={posters} />
          <StatsStrip stats={stats} />
          <Features posters={posters} />
          <Showcase posters={posters} />
          <TrendingStrip posters={posters} />
          <Steps />
          <Pricing />
          <Faq />
          <FinalCta />
        </main>
        <Footer year={new Date().getFullYear()} />
      </div>
    </MotionProvider>
  );
}
