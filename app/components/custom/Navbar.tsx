import Link from "next/link";
import LogoutButton from "./LogoutButton";

const navLinkClass =
  "rounded-md px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white";

const Navbar = ({ username }: { username: string }) => {
  return (
    <header className="border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-full items-center justify-between px-12 py-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-semibold text-white">
            Listora
          </Link>

          <nav className="flex items-center gap-2">
            <Link href="/dashboard" className={navLinkClass}>
              Dashboard
            </Link>
            <Link href="/profile" className={navLinkClass}>
              Profile
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="text-sm text-white/60 hover:bg-white/5 hover:text-white"
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
