import { create } from "zustand";

const initialTmConfig = {
  update: true,
  value: 1,
};

export const userStore = create((set) => ({
  user: null,
  save: (newUser) => set({ user: newUser }),
  clear: () => set({ user: null }),
}));

export const textTmStore = create((set) => ({
  text: null,
  save: (text) => set({ text }),
  clear: () => set({ text: null }),
}));

export const tmStore = create((set) => ({
  tm: null,
  tu: null,
  config: initialTmConfig,
  saveTm: (tm) => set({ tm }),
  saveTu: (tu) => set({ tu }),
  setConfig: (config) => set({ config }),
  clear: () => set({ tm: null, tu: null, config: initialTmConfig }),
}));
