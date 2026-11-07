import Image from "next/image";
import { catalogSourceLink, type CatalogSourceLink } from "@/lib/catalog/attribution";

export default function TitleSourceLinks({ sources = [] }: { sources?: CatalogSourceLink[] }) {
  const links = sources.flatMap(source => {
    const link = catalogSourceLink(source);
    return link ? [link] : [];
  });
  if (!links.length) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
      {links.map(link => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center underline decoration-white/25 underline-offset-4 hover:text-white">{link.label}</a>)}
      {links.some(link => link.label === "Google Books") && <Image src="/providers/google-books.png" alt="Powered by Google" width={62} height={29} unoptimized />}
    </div>
  );
}
