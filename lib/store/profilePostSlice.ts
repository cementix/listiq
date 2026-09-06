import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type CurrentUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

type ReviewOption = {
  id: string;
  rating: number | null;
  note: string | null;
  title: {
    name: string;
    slug: string;
    imageUrl: string | null;
  };
};

type ProfilePostState = {
  currentUser: CurrentUser | null;
  reviewOptions: ReviewOption[];
};

const initialState: ProfilePostState = {
  currentUser: null,
  reviewOptions: [],
};

const profilePostsSlice = createSlice({
  name: "profilePosts",
  initialState,
  reducers: {
    setProfilePostsData(state, action: PayloadAction<ProfilePostState>) {
      state.currentUser = action.payload.currentUser;
      state.reviewOptions = action.payload.reviewOptions;
    },
  },
});

export const { setProfilePostsData } = profilePostsSlice.actions;
export default profilePostsSlice.reducer;
