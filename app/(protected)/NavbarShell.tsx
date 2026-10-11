"use client";

import { useEffect, useState } from "react";
import { hasOpenDialog } from "@/lib/dialog-state";

type NavbarShellProps = {
  children: React.ReactNode;
};

export default function NavbarShell({ children }: NavbarShellProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || hasOpenDialog() || document.querySelector('[role="menu"][data-state="open"]') || window.innerWidth < 1024 ||
          (document.activeElement instanceof HTMLElement && document.activeElement.closest("header"))) {
        return;
      }

      if (event.deltaY < 0) {
        setIsVisible(true);
        return;
      }

      if (event.deltaY > 0 && window.scrollY > 24) {
        setIsVisible(false);
      }
    };

    const handleScroll = () => {
      if (hasOpenDialog()) return;

      if (window.scrollY < 24 || window.innerWidth < 1024) {
        setIsVisible(true);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-40 motion-safe:transition-transform motion-safe:duration-300 ${
        isVisible ? "" : "lg:-translate-y-full"
      }`}
    >
      {children}
    </div>
  );
}
