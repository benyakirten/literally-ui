import { createContext } from "@lit/context";

export type SelectContext = {
  popupRole: "listbox" | "tree";
  popupId: string;
};
export const selectContext = createContext<null>("selectContext");
