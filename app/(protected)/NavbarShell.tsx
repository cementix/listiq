"use client";

import { useEffect, useRef, useState } from "react";

type NavbarShellProps = {
  children: React.ReactNode;
};

export default function NavbarShell({ children }: NavbarShellProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        setIsVisible(true);
        return;
      }

      if (event.deltaY > 0 && window.scrollY > 24) {
        setIsVisible(false);
      }
    };

    const handleScroll = () => {
      if (window.scrollY < 24) {
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
      className={`fixed left-0 right-0 top-0 z-40 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {children}
    </div>
  );
}
