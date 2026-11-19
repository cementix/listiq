"use client";

import { logoutUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const LogoutButton = () => {
  return (
    <form action={logoutUser}>
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        className="h-11 w-full cursor-pointer justify-start rounded-xl px-3 text-rose-200/80 transition hover:bg-rose-500/10 hover:text-rose-100"
      >
        Sign out
      </Button>
    </form>
  );
};

export default LogoutButton;