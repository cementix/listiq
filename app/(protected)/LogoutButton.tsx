"use client";

import { logoutUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const LogoutButton = () => {
  return (
    <form action={logoutUser}>
      <Button
        type="submit"
        size="sm"
        className="h-9 cursor-pointer border-0 px-3 text-primary-foreground
        bg-[linear-gradient(90deg,color-mix(in_oklab,var(--primary)_85%,black_15%),color-mix(in_oklab,var(--primary)_75%,black_25%))]
        transition-all duration-200 hover:brightness-110 active:brightness-95"
      >
        logout
      </Button>
    </form>
  );
};

export default LogoutButton;