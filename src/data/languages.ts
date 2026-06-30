export interface Language {
  code: string;
  name: string;
  native: string;
  region: string;
  speakers: number; // Millions
  script: string;
  rtl: boolean;
  is_active?: boolean;
}

export const AFRICAN_LANGUAGES: Language[] = [
  { code: "sw", name: "Swahili", native: "Kiswahili", region: "East Africa", speakers: 200.0, script: "Latin", rtl: false, is_active: true },
  { code: "zu", name: "Zulu", native: "isiZulu", region: "Southern Africa", speakers: 12.0, script: "Latin", rtl: false, is_active: true },
  { code: "xh", name: "Xhosa", native: "isiXhosa", region: "Southern Africa", speakers: 8.2, script: "Latin", rtl: false, is_active: true },
  { code: "yo", name: "Yoruba", native: "Yorùbá", region: "West Africa", speakers: 45.0, script: "Latin", rtl: false, is_active: true },
  { code: "ig", name: "Igbo", native: "Igbo", region: "West Africa", speakers: 27.0, script: "Latin", rtl: false, is_active: true },
  { code: "ha", name: "Hausa", native: "Hausa", region: "West Africa", speakers: 77.0, script: "Latin", rtl: false, is_active: true },
  { code: "am", name: "Amharic", native: "አማርኛ", region: "East Africa", speakers: 57.0, script: "Ethiopic", rtl: false, is_active: true },
  { code: "so", name: "Somali", native: "Soomaali", region: "East Africa", speakers: 21.8, script: "Latin", rtl: false, is_active: true },
  { code: "af", name: "Afrikaans", native: "Afrikaans", region: "Southern Africa", speakers: 7.2, script: "Latin", rtl: false, is_active: true },
  { code: "sn", name: "Shona", native: "chiShona", region: "Southern Africa", speakers: 14.0, script: "Latin", rtl: false, is_active: true },
  { code: "nd", name: "Ndebele", native: "isiNdebele", region: "Southern Africa", speakers: 1.6, script: "Latin", rtl: false, is_active: true },
  { code: "tw", name: "Twi", native: "Twi", region: "West Africa", speakers: 9.0, script: "Latin", rtl: false, is_active: true },
  { code: "wo", name: "Wolof", native: "Wolof", region: "West Africa", speakers: 5.4, script: "Latin", rtl: false, is_active: true },
  { code: "rw", name: "Kinyarwanda", native: "Ikinyarwanda", region: "East Africa", speakers: 9.8, script: "Latin", rtl: false, is_active: true },
  { code: "ln", name: "Lingala", native: "Lingála", region: "Central Africa", speakers: 45.0, script: "Latin", rtl: false, is_active: true },
  { code: "lg", name: "Luganda", native: "Luganda", region: "East Africa", speakers: 5.6, script: "Latin", rtl: false, is_active: true },
  { code: "ny", name: "Chichewa", native: "Chichewa", region: "Southern Africa", speakers: 12.0, script: "Latin", rtl: false, is_active: true },
  { code: "st", name: "Sesotho", native: "Sesotho", region: "Southern Africa", speakers: 5.6, script: "Latin", rtl: false, is_active: true },
  { code: "tn", name: "Setswana", native: "Setswana", region: "Southern Africa", speakers: 5.8, script: "Latin", rtl: false, is_active: true },
  { code: "ti", name: "Tigrinya", native: "ትግርኛ", region: "East Africa", speakers: 9.0, script: "Ethiopic", rtl: false, is_active: true },
  { code: "om", name: "Oromo", native: "Afaan Oromoo", region: "East Africa", speakers: 37.0, script: "Latin", rtl: false, is_active: true },
  { code: "mg", name: "Malagasy", native: "Malagasy", region: "Indian Ocean", speakers: 25.0, script: "Latin", rtl: false, is_active: true },
  { code: "sg", name: "Sango", native: "Sängö", region: "Central Africa", speakers: 0.5, script: "Latin", rtl: false, is_active: true },
  { code: "en", name: "English", native: "English", region: "Global", speakers: 1500.0, script: "Latin", rtl: false, is_active: true },
  { code: "fr", name: "French", native: "Français", region: "Global", speakers: 300.0, script: "Latin", rtl: false, is_active: true },
  { code: "pt", name: "Portuguese", native: "Português", region: "Global", speakers: 250.0, script: "Latin", rtl: false, is_active: true },
  { code: "ar", name: "Arabic", native: "العربية", region: "North Africa", speakers: 422.0, script: "Arabic", rtl: true, is_active: true },
];

export const LANG_MAP: Record<string, Language> = AFRICAN_LANGUAGES.reduce((acc, lang) => {
  acc[lang.code] = lang;
  return acc;
}, {} as Record<string, Language>);

// Offline translation keyword mapping for demonstration
export const DEMO_TRANSLATIONS: Record<string, Record<string, string>> = {
  "sw_en": {
    "habari": "Hello / How are you?",
    "asante": "Thank you",
    "karibu": "Welcome",
    "nzuri":  "Good / Fine",
    "kwaheri": "Goodbye",
    "ndio": "Yes",
    "hapana": "No",
    "sawa": "Okay",
  },
  "zu_en": {
    "sawubona": "Hello",
    "ngiyabonga": "Thank you",
    "unjani":  "How are you?",
    "yebo": "Yes",
    "hamba": "Go / Walk",
  },
  "yo_en": {
    "e kaaro":  "Good morning",
    "e kaale":  "Good afternoon / evening",
    "o se":     "Thank you",
    "bawoni":   "How is it?",
  },
  "ha_en": {
    "sannu":  "Hello / Greetings",
    "nagode": "Thank you",
    "lafiya": "Peace / Health",
  },
  "en_sw": {
    "hello": "Habari",
    "how are you": "Habari yako?",
    "thank you": "Asante",
    "welcome": "Karibu",
    "good": "Nzuri",
    "yes": "Ndio",
    "no": "Hapana",
    "okay": "Sawa",
  },
  "en_zu": {
    "hello": "Sawubona",
    "thank you": "Ngiyabonga",
    "how are you": "Unjani?",
    "yes": "Yebo",
  },
  "en_yo": {
    "good morning": "E kaaro",
    "thank you": "O se",
  }
};

export const LANG_SIGNALS: Record<string, string[]> = {
  sw: ["habari", "asante", "karibu", "nzuri", "kwaheri", "ndio", "hapana", "mimi", "wewe", "sawa", "tafadhali", "sana", "jambo", "rafiki", "baba", "mama", "mtoto", "shukrani", "pole", "naomba", "gani", "hapa", "kazi", "chakula", "maji", "jua", "mungu"],
  zu: ["sawubona", "ngiyabonga", "unjani", "yebo", "hamba", "khuluma", "isibongo", "umfana", "intombazane", "sala", "kahle", "amanzi", "isizulu", "cha", "bonga", "ukukhanya", "ubuntu", "ingane", "isinkwa"],
  xh: ["molo", "molweni", "enkosi", "camagu", "ewe", "hayi", "uxolo", "ndicela", "bhabha", "bhuti", "sisi", "isixhosa", "ndiyabulela", "kumnandi", "mhlobo", "mhle", "titshala", "unyaniso"],
  yo: ["kaaro", "kaale", "se", "bawoni", "bawo", "omo", "ile", "pelu", "dupe", "joo", "odabo", "olorun", "rere", "mimo", "ara", "orile", "ede", "abeg", "eṣe", "oluwa", "ire", "akọni"],
  ig: ["ndewo", "daalu", "nnoo", "oge", "isi", "nna", "nne", "ego", "chukwu", "biko", "ibia", "bia", "kachifo", "ututu", "anu", "mmiri", "oma", "obodo", "onyeso", "onye", "ahia"],
  ha: ["sannu", "nagode", "lafiya", "kai", "ina", "gida", "uwa", "maka", "mace", "guda", "gaskiya", "hanya", "ruwa", "allah", "barka", "kwana", "zo", "je", "kyau", "samari", "yarinya"],
  am: ["ሰላም", "አመሰግናለሁ", "ጤና", "አዎ", "አይ", "ነው", "እኔ", "እና", "ትምህርት", "ሀገር", "ቤት", "ውሃ", "እግዚአብሔር"],
  so: ["mahadsanid", "tahay", "haa", "maya", "fadlan", "nabad", "subax", "galab", "wanaagsan", "gabar", "wiil", "hooyo", "aabe", "macallin", "soomaali", "soo", "dhowow", "libax", "biyo"],
  af: ["hallo", "dankie", "totsiens", "asseblief", "ja", "nee", "baie", "is", "en", "nie", "van", "die", "ek", "jy", "goeie", "more", "goeienaand", "lekker", "saam", "wat", "hoe", "se"],
  sn: ["mhoro", "ndatenda", "hongu", "kwete", "zvakanaka", "waita", "basa", "maita", "mangwanani", "masikati", "manheru", "mwana", "shamwari", "shona", "shewe", "rudado"],
  nd: ["salibonani", "linjani", "ngiyabonga", "yebe", "hatshi", "uxolo", "kunjani", "umfana", "isindebele"],
  tw: ["akwaaba", "medaase", "ete", "sen", "eye", "da", "yie", "ane", "dabi", "pa", "kyew", "owura", "awuraa", "onyame", "nkran", "twi", "me", "wo", "ɔmo", "papa", "obaa"],
  wo: ["naadef", "na", "rees", "jerejef", "waaw", "deedeet", "bul", "ko", "laal", "jamm", "rekk", "nit", "goor", "jigeen", "yallah", "wolof", "lu", "lan", "fan"],
  rw: ["muraho", "murakoze", "yego", "oya", "amahoro", "bite", "urakoze", "mwaramutse", "mwiriwe", "genda", "umugabo", "umugore", "umwana", "inshuti", "rwanda", "neza"],
  ln: ["mbote", "melesi", "sango", "malamu", "yo", "biso", "te", "pe", "ya", "ndeko", "mwasi", "mobali", "muana", "kasi", "lingala", "tokende", "tina"],
  lg: ["kati", "webale", "olya", "otya", "ye", "nedda", "bambi", "osibye", "gyebaleko", "mukama", "nyabo", "sebo", "abaana", "luganda", "nnyabo", "kale"],
  ny: ["moni", "zikomo", "muli", "bwanji", "indeti", "ayi", "chonde", "tili", "bwino", "dzuka", "amayi", "mwana", "chichewa", "zazikuru", "kaya"],
  st: ["lumela", "dumela", "kea", "leboha", "tsile", "jwang", "ee", "tjhe", "hle", "khotso", "ntate", "mme", "lesotho", "rea", "utla"],
  tn: ["dumela", "leboga", "tsogo", "jwang", "ee", "nnyaa", "tshegofatso", "pula", "rra", "mma", "gaborone", "tswana", "borra"],
  ti: ["የቐንየለይ", "ሰላም", "ትግርኛ", "ክብርቲ", "እንኳዕ", "አዎ", "አይኮነን", "ደሓን", "መንእሰይ", "ማይ"],
  om: ["akkam", "galatoomi", "eeyyee", "lakki", "maal", "nagaa", "jirtu", "fayyaa", "oromoo", "jaalala", "biyya", "haadha", "abaabo"],
  mg: ["manao", "ahoana", "misaotra", "eny", "tsia", "azafady", "veloma", "tonga", "soa", "vola", "olona", "any", "koa", "gasy", "malagasy", "tsara"],
  sg: ["bara", "ala", "singila", "en", "opo", "tongana", "kota", "fani", "zo", "ndeke", "yeke", "sango"],
  en: ["the", "and", "to", "of", "a", "is", "that", "this", "for", "on", "with", "he", "she", "it", "they", "you", "we", "hello", "please", "thank"],
  fr: ["le", "la", "les", "et", "en", "un", "une", "est", "dans", "pour", "qui", "que", "bonjour", "merci", "de", "du", "des", "avec", "nous", "vous"],
  pt: ["os", "as", "um", "uma", "em", "para", "com", "que", "ola", "obrigado", "favor", "do", "da", "dos", "das", "na", "no"],
  ar: ["مرحبا", "شكرا", "نعم", "لا", "من", "في", "على", "هذا", "هذه", "أنا", "أنت", "هو", "هي", "نحن", "السلام", "عليكم", "بخير"]
};

export function detectLanguageOffline(text: string): { 
  langCode: string; 
  confidence: number; 
  alternatives: { lang: string; confidence: number }[] 
} {
  const textLower = text.toLowerCase();
  
  // 1. Script checks
  // Check Ethiopic script for Amharic or Tigrinya
  const hasEthiopic = /[\u1200-\u137F]/.test(text);
  if (hasEthiopic) {
    // Distinguish Amharic and Tigrinya
    const isTigrinyaChar = /[\u1250-\u125d\u12e8-\u12ef]/.test(text);
    const hasTigrinyaWords = /የቐንየለይ|ትግርኛ|እንኳዕ|ክብርቲ|ደሓን/.test(text);
    
    if (isTigrinyaChar || hasTigrinyaWords) {
      return { 
        langCode: "ti", 
        confidence: isTigrinyaChar ? 0.98 : 0.92, 
        alternatives: [{ lang: "am", confidence: 0.4 }] 
      };
    }
    
    // Default Ethiopic is Amharic
    return { 
      langCode: "am", 
      confidence: 0.95, 
      alternatives: [{ lang: "ti", confidence: 0.35 }] 
    };
  }

  // Check Arabic script for Arabic
  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  if (hasArabic) {
    return { langCode: "ar", confidence: 0.99, alternatives: [] };
  }

  // 2. Tokenize and exact match Latin-based words
  const words = textLower
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 0);

  const scores: Record<string, number> = {};

  // Score based on exact vocabulary match (high weight)
  for (const word of words) {
    for (const [langCode, signals] of Object.entries(LANG_SIGNALS)) {
      if (signals.includes(word)) {
        scores[langCode] = (scores[langCode] || 0) + 2.5;
      }
    }
  }

  // 3. Substring, diacritic, and feature-based matching
  // Yoruba under-dots
  const hasYorubaDiacritics = /[ẹọṣẸỌṢ]/.test(text);
  if (hasYorubaDiacritics) {
    scores["yo"] = (scores["yo"] || 0) + 4.0;
  }

  // Igbo under-dots
  const hasIgboDiacritics = /[ịọụṅỊỌỤṄ]/.test(text);
  if (hasIgboDiacritics) {
    scores["ig"] = (scores["ig"] || 0) + 4.0;
  }

  // Twi open-vowels
  const hasTwiDiacritics = /[ɛɔƐƆ]/.test(text);
  if (hasTwiDiacritics) {
    scores["tw"] = (scores["tw"] || 0) + 5.0;
  }

  // Sango circumflex/umlaut
  const hasSangoDiacritics = /[äëïöüâêîôû]/.test(textLower);
  if (hasSangoDiacritics && !(scores["fr"] > 5 || scores["af"] > 5)) {
    scores["sg"] = (scores["sg"] || 0) + 2.0;
  }

  // Xhosa clicks
  const hasXhosaClicks = /cq|xh|gq|ngx|nq|cx/.test(textLower);
  if (hasXhosaClicks) {
    scores["xh"] = (scores["xh"] || 0) + 3.0;
  }

  // Somali vowel doubling heuristics
  const hasSomaliPatterns = /aa|ee|oo|uu/.test(textLower);
  const lacksSomaliExcludedLetters = !/[pvz]/.test(textLower);
  if (hasSomaliPatterns && lacksSomaliExcludedLetters && textLower.length > 8) {
    scores["so"] = (scores["so"] || 0) + 1.5;
  }

  // Zulu and Xhosa shared clicks
  const hasZuluClick = /qa|qe|qi|qo|qu|ca|ce|ci|co|cu|xa|xe|xi|xo|xu/.test(textLower);
  if (hasZuluClick) {
    scores["zu"] = (scores["zu"] || 0) + 1.5;
    scores["xh"] = (scores["xh"] || 0) + 1.5;
  }

  // Sort matched languages by score descending
  const sortedLangs = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  // Default fallback if no languages match
  if (sortedLangs.length === 0) {
    const isVeryShort = text.trim().length <= 3;
    return { 
      langCode: "en", 
      confidence: isVeryShort ? 0.3 : 0.5, 
      alternatives: [] 
    };
  }

  const [bestLang, bestScore] = sortedLangs[0];
  const runnerUp = sortedLangs[1];
  const runnerUpScore = runnerUp ? runnerUp[1] : 0;

  // 4. Well-calibrated confidence score calculation
  let baseConfidence = 0.5;
  
  if (text.length < 5) {
    baseConfidence = Math.min(0.4 + bestScore * 0.1, 0.7);
  } else if (text.length < 15) {
    baseConfidence = Math.min(0.55 + bestScore * 0.12, 0.88);
  } else {
    baseConfidence = Math.min(0.65 + bestScore * 0.15, 0.98);
  }

  if (runnerUp) {
    const margin = bestScore - runnerUpScore;
    if (margin === 0) {
      baseConfidence *= 0.75;
    } else if (margin < 1.5) {
      baseConfidence *= 0.9;
    }
  }

  const alternatives = sortedLangs.slice(1, 4).map(([code, sc]) => {
    let altConfidence = baseConfidence * (sc / bestScore) * 0.8;
    altConfidence = Math.min(altConfidence, baseConfidence - 0.05);
    return {
      lang: code,
      confidence: Math.round(Math.max(0.1, altConfidence) * 100) / 100
    };
  });

  return {
    langCode: bestLang,
    confidence: Math.round(baseConfidence * 100) / 100,
    alternatives
  };
}
