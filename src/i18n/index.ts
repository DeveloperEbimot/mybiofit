import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";
import zh from "./locales/zh.json";
import hi from "./locales/hi.json";
import ptBR from "./locales/pt-BR.json";
import de from "./locales/de.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";

const savedLang = localStorage.getItem("biofit-language");

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    ar: { translation: ar },
    zh: { translation: zh },
    hi: { translation: hi },
    "pt-BR": { translation: ptBR },
    de: { translation: de },
    ja: { translation: ja },
    ko: { translation: ko },
  },
  lng: savedLang || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "pt-BR", label: "Português (BR)", flag: "🇧🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
];

export default i18n;
