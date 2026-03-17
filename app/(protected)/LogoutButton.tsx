"use client";

import { logoutUser } from "@/actions/auth";
import MainButton from "@/components/custom/MainButton";

const LogoutButton = () => {
  return (
    <form action={logoutUser}>
      <MainButton type="submit">Logout</MainButton>
    </form>
  );
};

export default LogoutButton;
