"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type DashboardToastProps = {
  flash: string | null;
};

export default function DashboardToast({ flash }: DashboardToastProps) {
  useEffect(() => {
    if (!flash) {
      return;
    }

    toast.success(decodeURIComponent(flash));
  }, [flash]);

  return null;
}
