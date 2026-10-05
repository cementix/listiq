import type { DiscoveryAction, TitleType } from "@/generated/prisma/enums";

type TasteTitle = {
  type: TitleType;
  genres: { id: string }[];
};

type History = {
  titleId: string;
  shownCount: number;
  skipCount: number;
  lastShownAt: Date | null;
  lastAction: DiscoveryAction | null;
  lastActionAt: Date | null;
};

type Candidate = TasteTitle & {
  id: string;
  releaseDate: Date | null;
  catalogScore: number | null;
};

type Input<T extends Candidate> = {
  candidates: T[];
  library: { rating: number | null; title: TasteTitle }[];
  saved: { title: TasteTitle }[];
  skipped: { skipCount: number; title: TasteTitle }[];
  history: History[];
  limit?: number;
};

export function rankDiscoveryCandidates<T extends Candidate>({
  candidates,
  library,
  saved,
  skipped,
  history,
  limit = 12,
}: Input<T>): T[] {
  const genreWeights = new Map<string, number>();
  const typeWeights = new Map<TitleType, number>();
  const historyByTitle = new Map(history.map((item) => [item.titleId, item]));

  const addSignal = (title: TasteTitle, weight: number) => {
    typeWeights.set(title.type, (typeWeights.get(title.type) ?? 0) + weight);

    for (const genre of title.genres) {
      genreWeights.set(genre.id, (genreWeights.get(genre.id) ?? 0) + weight);
    }
  };

  for (const entry of library) {
    addSignal(
      entry.title,
      entry.rating === null ? 0.15 : (entry.rating - 5.5) / 4.5,
    );
  }

  for (const entry of saved) addSignal(entry.title, 0.45);

  // Skips affect taste weakly; repeated skips affect that title strongly.
  for (const entry of skipped) {
    addSignal(entry.title, -0.12 * Math.min(entry.skipCount, 3));
  }

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const scored = candidates.flatMap((title) => {
    const record = historyByTitle.get(title.id);
    const lastInteraction = record?.lastActionAt ?? record?.lastShownAt;

    const cooldown =
      record?.lastAction === "SKIPPED"
        ? 14 * day
        : record?.lastAction
          ? 30 * day
          : day;

    if (lastInteraction && now - lastInteraction.getTime() < cooldown) {
      return [];
    }

    const genreAffinity = title.genres.reduce(
      (sum, genre) => sum + Math.tanh((genreWeights.get(genre.id) ?? 0) / 3),
      0,
    );

    const typeAffinity = Math.tanh((typeWeights.get(title.type) ?? 0) / 3);

    const affinity =
      typeAffinity +
      genreAffinity / Math.sqrt(Math.max(title.genres.length, 1));

    return [
      {
        title,
        affinity,
        score:
          affinity * 2 +
          (title.catalogScore ?? 0) / 20 -
          (record?.skipCount ?? 0) * 1.8 -
          (record?.shownCount ?? 0) * 0.3 +
          Math.random() * 0.15,
      },
    ];
  });

  const match = [...scored].sort((a, b) => b.score - a.score);
  const fresh = [...scored].sort(
    (a, b) =>
      (b.title.releaseDate?.getTime() ?? 0) -
      (a.title.releaseDate?.getTime() ?? 0),
  );
  const explore = scored
    .filter((item) => item.affinity < 0.5)
    .map((item) => ({ item, random: Math.random() }))
    .sort((a, b) => a.random - b.random)
    .map(({ item }) => item);

  const result: T[] = [];
  const used = new Set<string>();

  // Seven taste matches, two explorations, one fresh title per ten cards.
  const lanes = [
    match,
    match,
    explore,
    match,
    match,
    fresh,
    match,
    explore,
    match,
    match,
  ];

  for (let i = 0; i < limit; i++) {
    const lane = lanes[i % lanes.length];
    const options = lane.filter((item) => !used.has(item.title.id));
    const fallback = match.filter((item) => !used.has(item.title.id));
    const pool = options.length ? options : fallback;

    if (!pool.length) break;

    const recentGenres = new Set(
      result
        .slice(-2)
        .flatMap((title) => title.genres.map((genre) => genre.id)),
    );

    const recentType = result.at(-1)?.type;
    const topOptions = pool.slice(0, 12);

    const hasNewGenres = (item: (typeof pool)[number]) =>
      !item.title.genres.some((genre) => recentGenres.has(genre.id));

    const chosen =
      topOptions.find(
        (item) => item.title.type !== recentType && hasNewGenres(item),
      ) ??
      topOptions.find(hasNewGenres) ??
      pool[0];

    result.push(chosen.title);
    used.add(chosen.title.id);
  }

  return result;
}
