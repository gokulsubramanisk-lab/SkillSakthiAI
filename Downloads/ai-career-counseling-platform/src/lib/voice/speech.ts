export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  speechLocale: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechLocale: "ta-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechLocale: "hi-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speechLocale: "te-IN" },
  { code: "kn", name: "Kannada", nativeName: "கன்னட", speechLocale: "kn-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speechLocale: "ml-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", speechLocale: "bn-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", speechLocale: "mr-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", speechLocale: "gu-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", speechLocale: "pa-IN" },
  { code: "en", name: "English", nativeName: "English", speechLocale: "en-IN" },
];

export function getLanguageInfo(code: string): SupportedLanguage {
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0]
  );
}
