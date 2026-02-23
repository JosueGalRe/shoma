import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, type AppLanguage } from "./resources";

const LANGUAGE_STORAGE_KEY = "appLanguage";

function resolveInitialLanguage(): AppLanguage {
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved === "en" || saved === "es") {
    return saved;
  }

  const browserLanguage = window.navigator.language.toLowerCase();
  if (browserLanguage.startsWith("es")) {
    return "es";
  }

  return "en";
}

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

i18n.on("languageChanged", (language) => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
});

export { i18n };
