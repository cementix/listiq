"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ProfilePostsViewer = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

export type ProfileReviewOption = {
  id: string;
  rating: number | null;
  note: string | null;
  title: {
    name: string;
    slug: string;
    imageUrl: string | null;
  };
};

type ProfilePostsContextValue = {
  viewer: ProfilePostsViewer | null;
  reviewOptions: ProfileReviewOption[];
};

const ProfilePostsContext = createContext<ProfilePostsContextValue>({
  viewer: null,
  reviewOptions: [],
});

/**
 * Supplies the signed-in viewer and their attachable reviews to the profile wall.
 * Values come straight from the server page, so they are available on the first render.
 */
export function ProfilePostsProvider({
  viewer,
  reviewOptions,
  children,
}: ProfilePostsContextValue & { children: ReactNode }) {
  return (
    <ProfilePostsContext.Provider value={{ viewer, reviewOptions }}>
      {children}
    </ProfilePostsContext.Provider>
  );
}

export function useProfilePostsViewer() {
  return useContext(ProfilePostsContext).viewer;
}

export function useProfileReviewOptions() {
  return useContext(ProfilePostsContext).reviewOptions;
}
