"use client";

import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import esES from "antd/locale/es_ES";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  translate,
} from "@/lib/i18n";
import { saveUser } from "@/services/user.services";
import { userStore } from "@/store";

const ANTD_LOCALES = { en: enUS, es: esES };

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => key,
});

const readStoredLanguage = () => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

const persistStoredLanguage = (language) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    /* ignore storage failures (private mode, quota, …) */
  }
};

export const LanguageProvider = ({ children }) => {
  // Locally cached preference, used before a user is known (e.g. login screen).
  const [localLanguage, setLocalLanguage] = useState(readStoredLanguage);
  const user = userStore((state) => state.user);
  const saveUserToStore = userStore((state) => state.save);

  // The account value is authoritative once the user is known: after login the
  // language always follows the preference saved on the account (the database).
  const language = user?.id
    ? normalizeLanguage(user.language)
    : localLanguage;

  const setLanguage = useCallback(
    (nextLanguage) => {
      const normalized = normalizeLanguage(nextLanguage);
      setLocalLanguage(normalized);
      persistStoredLanguage(normalized);

      // Persist the preference on the account so it follows the user across
      // devices and future logins.
      if (user?.id && normalized !== normalizeLanguage(user.language)) {
        saveUserToStore({ ...user, language: normalized });
        saveUser({ userId: user.id, language: normalized }).catch((error) => {
          console.error("Failed to persist language preference", error);
        });
      }
    },
    [user, saveUserToStore],
  );

  const t = useCallback(
    (key, params) => translate(language, key, params),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      <ConfigProvider locale={ANTD_LOCALES[language] ?? enUS}>
        {children}
      </ConfigProvider>
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);

export default LanguageProvider;
