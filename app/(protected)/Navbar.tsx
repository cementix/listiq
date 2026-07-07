import Link from "next/link";
import LogoutButton from "./LogoutButton";

const navLinkClass =
  "rounded-md px-3 py-2 text-sm text-white/70 transition-colors duration-200 hover:bg-white/5 hover:text-white";

const Navbar = ({
  username,
  needsChangesCount,
}: {
  username: string;
  needsChangesCount: number;
}) => {
  return (
    <header className="border-b border-white/10 bg-black/60 backdrop-blur">
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
            <Link href="/dashboard" className={navLinkClass}>
              dashboard
            </Link>
            <Link href="/profile" className={navLinkClass}>
              profile
            </Link>
            <Link href="/add-title" className={navLinkClass}>
              add title
            </Link>
            <Link href="/submissions" className={navLinkClass}>
              submissions
            </Link>
            <Link href="/my-submissions" className={`${navLinkClass} relative`}>
              my submissions
              {needsChangesCount > 0 && (
                <span className="ml-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200">
                  {needsChangesCount}
                </span>
              )}
          </Link>
          </nav>
        </div>

        {/* right */}
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="rounded-md px-3 py-2 text-sm text-white/60 transition-colors duration-200 hover:bg-white/5 hover:text-white"
          >
            @{username}
          </Link>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
