"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type DashboardToastProps = {
  flash: string | null;
};

export default function DashboardToast({ flash }: DashboardToastProps) {
  const shownFlash = useRef<string | null>(null);

  useEffect(() => {
    if (
      !flash ||
      shownFlash.current === flash ||
      !document.cookie.split("; ").some((cookie) => cookie.startsWith("flash="))
    ) {
      return;
    }

    shownFlash.current = flash;
    document.cookie = "flash=; path=/; max-age=0";
    toast.success(decodeURIComponent(flash));
  }, [flash]);

  return null;
}
