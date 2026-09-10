"use client";

import { useAppDispatch } from "@/lib/store/hooks";
import { setProfilePostsData } from "@/lib/store/profilePostSlice";
import { useEffect } from "react";

type ProfilePostsStateInitializerProps = {
  currentUser: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  reviewOptions: {
    id: string;
    rating: number | null;
    note: string | null;
    title: {
      name: string;
      slug: string;
      imageUrl: string | null;
    };
  }[];
};

export default function ProfilePostsStateInitializer({
  currentUser,
  reviewOptions,
}: ProfilePostsStateInitializerProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setProfilePostsData({ currentUser, reviewOptions }));
  }, [currentUser, reviewOptions, dispatch]);

  return null;
}
