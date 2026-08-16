import { create } from "zustand";

export const useGmailAccessTokenStore = create((set) => ({
  accessToken: null,

  setAccessToken: (token) =>
    set({
      accessToken: token,
    }),

  clearAccessToken: () =>
    set({
      accessToken: null,
    })
    
}));
