import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

const navLinkClass =
  "rounded-md px-3 py-2 text-sm text-white/70 transition-colors duration-200 hover:bg-white/5 hover:text-white";

const Navbar = ({
  username,
  avatarUrl,
  needsChangesCount,
}: {
  username: string;
  avatarUrl: string | null;
  needsChangesCount: number;
}) => {
  return (
    <header className="border-b border-white/10 bg-black/95 backdrop-blur">
      <div className="flex w-full items-center justify-between px-12 py-4">
        {/* left */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-white transition-opacity duration-200 hover:opacity-80"
          >
            listiq
          </Link>

          <nav className="flex items-center gap-2">
            <div className="group relative">
              <Link href="/titles" className={`${navLinkClass} flex items-end`}>
                Titles <ChevronDown size={14} />
              </Link>

              <div className="invisible absolute left-0 top-full z-20 pt-2 w-44 rounded-xl border border-white/10 bg-black/90 p-1 opacity-0 shadow-2xl backdrop-blur transition group-hover:visible group-hover:opacity-100">
                <Link
                  href="/titles"
                  className="block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                >
                  Browse titles
                </Link>
                <Link
                  href="/add-title"
                  className="block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                >
                  Add a title
                </Link>
              </div>
            </div>

            <div className="group relative">
              <Link
                href="/my-submissions"
                className={`${navLinkClass} relative flex items-end`}
              >
                Submissions <ChevronDown size={14} />
                {needsChangesCount > 0 && (
                  <span className="ml-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200">
                    {needsChangesCount}
                  </span>
                )}
              </Link>

              <div className="invisible absolute left-0 top-full z-20 pt-2 w-48 rounded-xl border border-white/10 bg-black/90 p-1 opacity-0 shadow-2xl backdrop-blur transition group-hover:visible group-hover:opacity-100">
                <Link
                  href="/my-submissions"
                  className="block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                >
                  My submissions
                </Link>
                <Link
                  href="/add-title"
                  className="block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                >
                  Add submission
                </Link>
                <Link
                  href="/submissions"
                  className="block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                >
                  Review queue
                </Link>
              </div>
            </div>
          </nav>
        </div>

        {/* right */}
        <div className="flex items-center gap-3">
          <Link
            href={`/users/${username}`}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <span>@{username}</span>

            <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-full bg-white/10">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="profile avatar"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-xs font-semibold text-white/60">
                  {username.slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
          </Link>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
