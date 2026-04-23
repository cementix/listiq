import Link from "next/link";
import { redirect } from "next/navigation";

import Aurora from "@/components/custom/Aurora";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/session";

const previewTitles = [
  { name: "Resident Evil 4", type: "Game", year: "2005" },
  { name: "Monster", type: "Anime", year: "2004" },
  { name: "Interstellar", type: "Movie", year: "2014" },
  { name: "Vagabond", type: "Manga", year: "1998" },
];

const featureCards = [
  {
    title: "track titles",
    description: "movies, anime, manga, games, books and more",
    delay: "delay-100",
  },
  {
    title: "discover",
    description: "browse titles and grow your personal library",
    delay: "delay-150",
  },
  {
    title: "submit",
    description: "add new titles with moderation support",
    delay: "delay-200",
  },
];

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 z-0">
        <Aurora
          colorStops={["#8c3acf", "#370acd", "#29bfff"]}
          blend={0.7}
          amplitude={0.67}
          speed={0.53}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32%)]" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <section className="animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white/80">
              track what you watch, read and play
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
              listiq
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
              build your own media library for movies, series, anime, manga,
              games and more. simple, clean and focused.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
              <Button
                asChild
                size="lg"
                className="rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02]"
              >
                <Link href="/register">create account</Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="secondary"
                className="rounded-full border border-white/10 bg-white/5 text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white/10"
              >
                <Link href="/login">sign in</Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {featureCards.map((card) => (
                <Card
                  key={card.title}
                  className={`group relative overflow-hidden border-white/10 bg-white/5 text-white backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:border-white/20 hover:bg-white/[0.075] hover:shadow-[0_10px_40px_rgba(255,255,255,0.06)] animate-in fade-in slide-in-from-bottom-2 duration-700 ${card.delay}`}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_45%)]" />
                  </div>

                  <CardContent className="relative p-4">
                    <p className="text-sm font-medium transition-transform duration-300 group-hover:translate-x-0.5">
                      {card.title}
                    </p>

                    <p className="mt-2 text-xs leading-relaxed text-white/60 transition-colors duration-300 group-hover:text-white/75">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="animate-in fade-in slide-in-from-right-4 duration-700 delay-100">
            <Card className="group relative overflow-hidden rounded-3xl border-white/10 bg-white/5 text-white shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:scale-[1.01] hover:border-white/20 hover:shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.12),transparent_35%)]" />
              </div>

              <CardContent className="relative p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs text-white/50">
                  <span className="transition-colors duration-300 group-hover:text-white/70">
                    preview
                  </span>
                  <span className="transition-colors duration-300 group-hover:text-white/70">
                    your media space
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {previewTitles.map((item, index) => (
                    <div
                      key={item.name}
                      className={`group/item rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-white/20 hover:bg-white/5 animate-in fade-in slide-in-from-bottom-2 duration-700 ${
                        index === 1
                          ? "delay-150"
                          : index === 2
                            ? "delay-200"
                            : index === 3
                              ? "delay-300"
                              : "delay-100"
                      }`}
                    >
                      <p className="text-sm font-medium text-white transition-transform duration-300 group-hover/item:translate-x-0.5">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-white/50 transition-colors duration-300 group-hover/item:text-white/70">
                        {item.type} • {item.year}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white/75 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
                  clean pages, simple tracking and room to expand into reviews,
                  lists and moderation.
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}