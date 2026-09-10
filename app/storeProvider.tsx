"use client";

import { AppStore, makeStore } from "@/lib/store/store";
import { ReactNode, useState } from "react";
import { Provider } from "react-redux";

type StoreProviderProps = {
  children: ReactNode;
};

export default function StoreProvider({ children }: StoreProviderProps) {
  const [store] = useState<AppStore>(makeStore);

  return <Provider store={store}>{children}</Provider>;
}
