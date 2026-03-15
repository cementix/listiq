"use client";

import { logoutUser } from "@/actions/auth";
import MainButton from "./MainButton";

const LogoutButton = () => {
  return (
    <form action={logoutUser}>
      <MainButton type="submit">Logout</MainButton>
    </form>
  );
};

export default LogoutButton;
