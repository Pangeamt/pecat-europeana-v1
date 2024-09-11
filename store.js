import { create } from "zustand";

export const userStore = create((set) => ({
  user: null,
  save: (newUser) => set({ user: newUser }),
  clear: () => set({ user: null }),
}));

export const textTmStore = create((set) => ({
  text: null,
  save: (text) => set({ text: text }),
  clear: () => set({ text: null }),
}));

export const tmStore = create((set) => ({
  tm: null,
  tu: null,
  config: {
    update: true,
    value: 1,
  },
  saveTm: (tm) => set({ tm: tm }),
  saveTu: (tu) => set({ tu: tu }),
  setConfig: (config) => set({ config: config }),
  clear: () => set({ tm: null, tu: null, config: { update: true, value: 1 } }),
}));
