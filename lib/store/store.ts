import { configureStore } from "@reduxjs/toolkit";

import profilePostsReducer from "./profilePostSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      profilePosts: profilePostsReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
