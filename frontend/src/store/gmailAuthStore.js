import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useGmailAuthStoreDetails = create(
  persist(
    (set) => ({
      gmailUser: null,
      messagesIDs: [],
      pageToken: null,
      hasVisited: false,

      login: (gmailUser) => set({ gmailUser }),
      setMessagesIDs: (messagesIDs) => set({ messagesIDs }),
      setPageToken: (pageToken) => {
        set({ pageToken });
      },
      setHasVisited: (hasVisited) => {
        set({ hasVisited });
      },
      logout: () =>
        set({
          gmailUser: null,
          messagesIDs: [],
          pageToken: null,
          hasVisited: false,
        }),
    }),
    { name: "gmail-auth-storage" },
  ),
);
