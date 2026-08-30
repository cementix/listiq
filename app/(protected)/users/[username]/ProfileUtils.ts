export const formatRelativeDate = (date: Date) => {
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);

  const units = [
    { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
    { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
    { unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
    { unit: "day", ms: 1000 * 60 * 60 * 24 },
  ] as const;

  const match = units.find((item) => absMs >= item.ms);

  if (!match) return "today";

  const value = Math.round(diffMs / match.ms);

  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    value,
    match.unit,
  );
};

export const getRoleLabel = (role: string) => {
  if (role === "ADMIN") return "Administrator";
  if (role === "MODERATOR") return "Moderator";
  if (role === "VERIFIED") return "Verified";

  return "Member";
};

export const getRoleClassName = (role: string) => {
  if (role === "ADMIN") return "text-yellow-300";
  if (role === "MODERATOR") return "text-cyan-300";
  if (role === "VERIFIED") return "text-emerald-300";

  return "text-sky-300";
};

export const getActivityCopy = (event: {
  type: string;
  rating: number | null;
}) => {
  if (event.type === "TITLE_ADDED") return "Added to library";
  if (event.type === "TITLE_RATED")
    return `Rated ${event.rating?.toFixed(1) ?? "-"}/10`;
  if (event.type === "TITLE_REMOVED") return "Removed from library";
  if (event.type === "TITLE_REVIEWED") return "Reviewed";
  if (event.type === "TITLE_SUBMITTED") return "Submitted title";

  return event.type;
};

export const getActivityIconClass = (type: string) => {
  if (type === "TITLE_ADDED") return "text-sky-300";
  if (type === "TITLE_REMOVED") return "text-indigo-300";
  if (type === "TITLE_RATED") return "text-violet-300";
  if (type === "TITLE_REVIEWED") return "text-blue-300";
  if (type === "TITLE_SUBMITTED") return "text-cyan-300";

  return "text-primary/80";
};
