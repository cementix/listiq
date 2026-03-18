"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type DashboardToastProps = {
  flash: string | null;
};

const DashboardToast = ({ flash }: DashboardToastProps) => {
  const shownRef = useRef(false);

  useEffect(() => {
    if (!flash || shownRef.current) return;

    shownRef.current = true;

    if (flash === "login-success") {
      toast.success("Successful login, welcome back <3");
    }

    if (flash === "registration-success") {
      toast.success("Successful registration, welcome <3");
    }

    document.cookie = "flash=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    cookieStore.delete(flash);
  }, [flash]);

  return null;
};

export default DashboardToast;
