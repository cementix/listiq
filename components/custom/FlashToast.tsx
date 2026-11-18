"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/** Shows a one-off toast once on mount (e.g. after a redirect with a status flag). */
export default function FlashToast({ message }: { message: string }) {
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    toast.success(message);
    window.history.replaceState(null, "", window.location.pathname);
  }, [message]);
  return null;
}
