import type { Language } from "../types";

export const AFRICAN_LANGUAGES: Language[] = [
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", region: "East Africa", stt: true, mt: true, tts: true },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá", region: "West Africa", stt: true, mt: true, tts: true },
  { code: "ha", name: "Hausa", nativeName: "Harshen Hausa", region: "West Africa", stt: true, mt: true, tts: true },
  { code: "ig", name: "Igbo", nativeName: "Asụsụ Igbo", region: "West Africa", stt: true, mt: true, tts: false },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", region: "East Africa", stt: true, mt: true, tts: true },
  { code: "zu", name: "Zulu", nativeName: "isiZulu", region: "Southern Africa", stt: true, mt: true, tts: true },
  { code: "xh", name: "Xhosa", nativeName: "isiXhosa", region: "Southern Africa", stt: true, mt: true, tts: false },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans", region: "Southern Africa", stt: true, mt: true, tts: true },
  { code: "rw", name: "Kinyarwanda", nativeName: "Ikinyarwanda", region: "East Africa", stt: false, mt: true, tts: false },
  { code: "so", name: "Somali", nativeName: "Soomaali", region: "Horn of Africa", stt: true, mt: true, tts: false },
  { code: "en", name: "English", nativeName: "English", region: "Global", stt: true, mt: true, tts: true },
  { code: "fr", name: "French", nativeName: "Français", region: "Global", stt: true, mt: true, tts: true },
  { code: "pt", name: "Portuguese", nativeName: "Português", region: "Global", stt: true, mt: true, tts: true },
  { code: "ar", name: "Arabic", nativeName: "العربية", region: "North Africa", stt: true, mt: true, tts: true }
];

AFRICAN_LANGUAGES.forEach((language) => {
  language.native = language.nativeName;
  language.is_active = true;
});

export const LANG_MAP = AFRICAN_LANGUAGES.reduce<Record<string, Language>>((acc, language) => {
  acc[language.code] = language;
  return acc;
}, {});

export const DEMO_TRANSLATIONS: Record<string, Record<string, string>> = {
  sw_en: { habari: "Hello, how are you?", asante: "Thank you", karibu: "Welcome" },
  en_sw: { hello: "Habari", thank: "Asante", welcome: "Karibu" },
  yo_en: { "o se": "Thank you", bawo: "How are you?" },
  ha_en: { nagode: "Thank you", sannu: "Hello" },
  zu_en: { sawubona: "Hello", ngiyabonga: "Thank you" },
  en_yo: { hello: "Bawo", thank: "O se" },
  en_ha: { hello: "Sannu", thank: "Nagode" },
  en_zu: { hello: "Sawubona", thank: "Ngiyabonga" }
};

export function detectLanguageOffline(text: string): { langCode: string; confidence: number; alternatives: string[] } {
  const normalized = text.toLowerCase();
  if (/\b(habari|asante|karibu)\b/.test(normalized)) return { langCode: "sw", confidence: 0.93, alternatives: ["en", "ha"] };
  if (/\b(nagode|sannu)\b/.test(normalized)) return { langCode: "ha", confidence: 0.92, alternatives: ["en", "yo"] };
  if (/\b(sawubona|ngiyabonga)\b/.test(normalized)) return { langCode: "zu", confidence: 0.94, alternatives: ["xh", "en"] };
  if (/\b(bawo|yoruba|o se)\b/.test(normalized)) return { langCode: "yo", confidence: 0.91, alternatives: ["en", "ig"] };
  return { langCode: "en", confidence: 0.75, alternatives: ["sw", "fr"] };
}
