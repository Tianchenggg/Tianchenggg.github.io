"use client";

import { useEffect, useSyncExternalStore } from "react";
import { siteCopy, type Language } from "./portfolio-content";

const LANGUAGE_STORAGE_KEY = "tiancheng-portfolio-language";
const languageListeners = new Set<() => void>();
let memoryLanguage: Language = "en";

function getLanguageSnapshot(): Language {
  if (typeof window === "undefined") return "en";

  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage === "en" || storedLanguage === "zh") {
      memoryLanguage = storedLanguage;
    }
  } catch {
    // The in-memory preference still keeps the control usable in private modes.
  }

  return memoryLanguage;
}

function getServerLanguageSnapshot(): Language {
  return "en";
}

function subscribeToLanguage(listener: () => void) {
  languageListeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== LANGUAGE_STORAGE_KEY) return;

    memoryLanguage = event.newValue === "zh" ? "zh" : "en";
    listener();
  };

  window.addEventListener("storage", handleStorage);
  return () => {
    languageListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function setLanguagePreference(language: Language) {
  memoryLanguage = language;

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // The current tab still updates when storage is unavailable.
  }

  languageListeners.forEach((listener) => listener());
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribeToLanguage, getLanguageSnapshot, getServerLanguageSnapshot);
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.documentElement.dataset.language = language;
    document.title = siteCopy[language].documentTitle;
  }, [language]);
  return language;
}
