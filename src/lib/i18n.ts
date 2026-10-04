// Indic language registry + UI dictionary for the voice-first interface.
// Locale codes map directly to Web Speech API (STT + TTS) BCP-47 tags.

export type LocaleCode =
  | "hi-IN"
  | "en-IN"
  | "mr-IN"
  | "bn-IN"
  | "ta-IN"
  | "te-IN"
  | "kn-IN"
  | "gu-IN"
  | "pa-IN"
  | "or-IN";

export type LanguageOption = {
  code: LocaleCode;
  name: string;
  nativeName: string;
  dialects: string[];
};

export const LANGUAGES: LanguageOption[] = [
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", dialects: ["Khari Boli", "Bhojpuri", "Awadhi", "Haryanvi"] },
  { code: "en-IN", name: "Indian English", nativeName: "English", dialects: ["Standard"] },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी", dialects: ["Varhadi", "Khandeshi"] },
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা", dialects: ["Rarhi", "Sylheti"] },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்", dialects: ["Kongu", "Madurai"] },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు", dialects: ["Telangana", "Rayalaseema"] },
  { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", dialects: ["Dharwad", "Mysuru"] },
  { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", dialects: ["Kathiawadi", "Surti"] },
  { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", dialects: ["Majhi", "Malwai"] },
  { code: "or-IN", name: "Odia", nativeName: "ଓଡ଼ିଆ", dialects: ["Sambalpuri", "Standard"] },
];

type Dict = {
  askAnything: string;
  listening: string;
  tapToSpeak: string;
  stop: string;
  typeInstead: string;
  send: string;
  verified: string;
  counselorRouted: string;
  speakAnswer: string;
};

const EN: Dict = {
  askAnything: "Ask anything about courses, jobs, fees or schemes",
  listening: "Listening… speak naturally",
  tapToSpeak: "Tap to speak",
  stop: "Stop",
  typeInstead: "Type instead",
  send: "Send",
  verified: "Government verified",
  counselorRouted: "A human counsellor has been alerted",
  speakAnswer: "Play answer",
};

export const UI_STRINGS: Record<string, Dict> = {
  "en-IN": EN,
  "hi-IN": {
    askAnything: "कोर्स, नौकरी, फीस या योजना के बारे में कुछ भी पूछें",
    listening: "सुन रहे हैं… आराम से बोलिए",
    tapToSpeak: "बोलने के लिए दबाएँ",
    stop: "रोकें",
    typeInstead: "टाइप करें",
    send: "भेजें",
    verified: "सरकारी सत्यापित",
    counselorRouted: "काउंसलर को सूचना भेज दी गई है",
    speakAnswer: "उत्तर सुनें",
  },
  "mr-IN": {
    askAnything: "कोर्स, नोकरी, फी किंवा योजनेबद्दल काहीही विचारा",
    listening: "ऐकत आहोत… सहज बोला",
    tapToSpeak: "बोलण्यासाठी दाबा",
    stop: "थांबा",
    typeInstead: "टाइप करा",
    send: "पाठवा",
    verified: "शासन प्रमाणित",
    counselorRouted: "समुपदेशकाला कळवले आहे",
    speakAnswer: "उत्तर ऐका",
  },
  "bn-IN": {
    askAnything: "কোর্স, চাকরি, ফি বা প্রকল্প নিয়ে যা খুশি জিজ্ঞাসা করুন",
    listening: "শুনছি… স্বাভাবিকভাবে বলুন",
    tapToSpeak: "বলতে চাপুন",
    stop: "থামান",
    typeInstead: "টাইপ করুন",
    send: "পাঠান",
    verified: "সরকারি যাচাইকৃত",
    counselorRouted: "কাউন্সেলরকে জানানো হয়েছে",
    speakAnswer: "উত্তর শুনুন",
  },
  "ta-IN": {
    askAnything: "படிப்பு, வேலை, கட்டணம் அல்லது திட்டம் பற்றி கேளுங்கள்",
    listening: "கேட்கிறோம்… இயல்பாக பேசுங்கள்",
    tapToSpeak: "பேச அழுத்துங்கள்",
    stop: "நிறுத்து",
    typeInstead: "தட்டச்சு செய்க",
    send: "அனுப்பு",
    verified: "அரசு சான்றளித்தது",
    counselorRouted: "ஆலோசகருக்கு தகவல் அனுப்பப்பட்டது",
    speakAnswer: "பதிலை கேளுங்கள்",
  },
  "te-IN": {
    askAnything: "కోర్సు, ఉద్యోగం, ఫీజు లేదా పథకం గురించి అడగండి",
    listening: "వింటున్నాం… సహజంగా మాట్లాడండి",
    tapToSpeak: "మాట్లాడటానికి నొక్కండి",
    stop: "ఆపు",
    typeInstead: "టైప్ చేయండి",
    send: "పంపు",
    verified: "ప్రభుత్వ ధృవీకరణ",
    counselorRouted: "కౌన్సెలర్‌కు సమాచారం పంపబడింది",
    speakAnswer: "సమాధానం వినండి",
  },
};

export function t(locale: string): Dict {
  return UI_STRINGS[locale] ?? EN;
}

export function languageLabel(code: string): string {
  const found = LANGUAGES.find((l) => l.code === code);
  return found ? `${found.nativeName} (${found.name})` : code;
}
