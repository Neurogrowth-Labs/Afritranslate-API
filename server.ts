import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { AFRICAN_LANGUAGES, LANG_MAP, DEMO_TRANSLATIONS, detectLanguageOffline } from "./src/data/languages";
import { GoogleGenAI } from "@google/genai";

const PORT = 3000;
const SECRET_KEY = process.env.SECRET_KEY || "afritranslate-super-secret-key-2026";
const DB_FILE = path.join(process.cwd(), "db.json");

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API Client:", err);
  }
} else {
  console.log("Gemini API key is not configured. Falling back to offline translations.");
}

// ─── Local Database Management ────────────────────────────────────────────────

interface DbSchema {
  users: any[];
  history: any[];
  webhookConfigs: any[];
}

function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultSalt = crypto.randomBytes(16).toString("hex");
    const defaultHashedPassword = crypto.pbkdf2Sync("password", defaultSalt, 1000, 64, "sha512").toString("hex");

    const initialDb: DbSchema = {
      users: [
        {
          id: 1,
          username: "demo",
          email: "demo@afritranslate.com",
          hashed_password: `${defaultSalt}:${defaultHashedPassword}`,
          is_active: true,
          api_calls: 14,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        }
      ],
      history: [
        {
          id: 1,
          user_id: 1,
          source_text: "Habari yako mzee?",
          translated_text: "[Translated from Swahili → English]: How are you elder?",
          source_lang_code: "sw",
          target_lang_code: "en",
          detected_lang: "sw",
          confidence: 0.95,
          character_count: 18,
          source: "api",
          message_id: null,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          user_id: 1,
          source_text: "Sawubona! Ngiyabonga kakhulu.",
          translated_text: "[Translated from Zulu → English]: Hello! Thank you very much.",
          source_lang_code: "zu",
          target_lang_code: "en",
          detected_lang: "zu",
          confidence: 0.96,
          character_count: 31,
          source: "whatsapp",
          message_id: "wa_msg_98234",
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          user_id: null,
          source_text: "Nagode sarki.",
          translated_text: "[Translated from Hausa → English]: Thank you king.",
          source_lang_code: "ha",
          target_lang_code: "en",
          detected_lang: "ha",
          confidence: 0.92,
          character_count: 13,
          source: "telegram",
          message_id: "tg_update_234",
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 4,
          user_id: 1,
          source_text: "Hello, we are launching the new clinic on Tuesday. Please inform the team.",
          translated_text: "[sw] Habari, tunazindua kliniki mpya Jumanne. Tafadhali fahamisha timu.",
          source_lang_code: "en",
          target_lang_code: "sw",
          detected_lang: "en",
          confidence: 0.88,
          character_count: 73,
          source: "whatsapp",
          message_id: "wa_msg_56372",
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 5,
          user_id: 1,
          source_text: "O se omo mi.",
          translated_text: "[Translated from Yoruba → English]: Thank you my child.",
          source_lang_code: "yo",
          target_lang_code: "en",
          detected_lang: "yo",
          confidence: 0.94,
          character_count: 12,
          source: "api",
          message_id: null,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ],
      webhookConfigs: [
        {
          id: 1,
          user_id: 1,
          platform: "whatsapp",
          endpoint_url: "https://your-backend.com/webhooks/whatsapp",
          secret_token: "wa_wh_secret_xyz123",
          default_target_lang: "en",
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  }
}

initDb();

function readDb(): DbSchema {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return { users: [], history: [], webhookConfigs: [] };
  }
}

function writeDb(db: DbSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ─── Crypto Helpers (Hashing & Custom JWT) ───────────────────────────────────

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === testHash;
}

function generateToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 })).toString("base64url"); // 24 hours
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const testSignature = crypto.createHmac("sha256", SECRET_KEY).update(`${header}.${body}`).digest("base64url");
    if (testSignature !== signature) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// Middleware: Authenticated User
function getOptionalUser(req: any, res: any, next: any) {
  let token = req.headers.authorization;
  if (token && token.startsWith("Bearer ")) {
    token = token.slice(7);
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  const payload = verifyToken(token);
  if (!payload) {
    req.user = null;
    return next();
  }

  const db = readDb();
  const user = db.users.find(u => u.id === payload.sub);
  req.user = user || null;
  next();
}

function getRequiredUser(req: any, res: any, next: any) {
  getOptionalUser(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ detail: "Could not validate credentials or token expired" });
    }
    next();
  });
}

// ─── Real-Time Translation Core Engine (Gemini AI & Offline Fallback) ─────────

async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
  engineType: "demo" | "gemini" | "google" | "deepl" | "libretranslate" = "gemini"
): Promise<{ text: string; confidence: number }> {
  if (sourceLang === targetLang) {
    return { text, confidence: 1.0 };
  }

  const sLang = sourceLang.toLowerCase();
  const tLang = targetLang.toLowerCase();

  // ─── GOOGLE CLOUD TRANSLATION SERVICE ─────────────────────────────────────
  if (engineType === "google") {
    const gKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (gKey) {
      try {
        console.log(`[Translation Engine] Routing translation through Google Cloud Translation API`);
        const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${gKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: [text],
            target: tLang,
            source: sLang === "auto" ? undefined : sLang,
            format: "text"
          }),
        });

        if (!response.ok) {
          throw new Error(`Google Translate API returned status: ${response.status}`);
        }

        const data: any = await response.json();
        const translated = data?.data?.translations?.[0]?.translatedText;
        if (translated) {
          return { text: translated, confidence: 0.98 };
        }
      } catch (err) {
        console.error("Google Translation API failed, falling back to Gemini:", err);
      }
    } else {
      console.warn("Google Translation API Key not configured, falling back to Gemini.");
    }
  }

  // ─── DEEPL SERVICE ───────────────────────────────────────────────────────
  if (engineType === "deepl") {
    const dKey = process.env.DEEPL_API_KEY;
    if (dKey) {
      try {
        console.log(`[Translation Engine] Routing translation through DeepL API`);
        const endpoint = dKey.endsWith(":fx") 
          ? "https://api-free.deepl.com/v2/translate" 
          : "https://api.deepl.com/v2/translate";

        let mappedTarget = tLang.toUpperCase();
        if (mappedTarget === "EN") mappedTarget = "EN-US";
        if (mappedTarget === "PT") mappedTarget = "PT-PT";

        const mappedSource = sLang === "auto" ? undefined : sLang.toUpperCase();

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `DeepL-Auth-Key ${dKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: [text],
            source_lang: mappedSource,
            target_lang: mappedTarget,
          }),
        });

        if (!response.ok) {
          throw new Error(`DeepL API returned status: ${response.status}`);
        }

        const data: any = await response.json();
        const translated = data?.translations?.[0]?.text;
        if (translated) {
          return { text: translated, confidence: 0.98 };
        }
      } catch (err) {
        console.error("DeepL Translation API failed, falling back to Gemini:", err);
      }
    } else {
      console.warn("DeepL API Key not configured, falling back to Gemini.");
    }
  }

  // ─── LIBRETRANSLATE SERVICE ──────────────────────────────────────────────
  if (engineType === "libretranslate") {
    const ltUrl = process.env.LIBRETRANSLATE_API_URL || "https://libretranslate.com";
    const ltKey = process.env.LIBRETRANSLATE_API_KEY;
    try {
      console.log(`[Translation Engine] Routing translation through LibreTranslate API: ${ltUrl}`);
      const response = await fetch(`${ltUrl}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          source: sLang === "auto" ? "auto" : sLang,
          target: tLang,
          format: "text",
          api_key: ltKey || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`LibreTranslate returned status: ${response.status}`);
      }

      const data: any = await response.json();
      const translated = data?.translatedText;
      if (translated) {
        return { text: translated, confidence: 0.92 };
      }
    } catch (err) {
      console.error("LibreTranslate failed, falling back to Gemini:", err);
    }
  }

  // ─── GEMINI SERVICE (DEFAULT PRODUCTION-GRADE OPTION) ────────────────────
  if (aiClient) {
    const sourceLangName = LANG_MAP[sLang]?.name || sLang.toUpperCase();
    const targetLangName = LANG_MAP[tLang]?.name || tLang.toUpperCase();
    const targetLangNative = LANG_MAP[tLang]?.native || "";

    try {
      console.log(`[Translation Engine] Routing translation through Gemini AI Client`);
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are AfriTranslate, a professional real-time translator specializing in African languages.
Translate the following text from ${sourceLangName} (${sLang}) into ${targetLangName} (${targetLangNative ? targetLangNative + ', ' : ''}${tLang}).

CRITICAL TRANSLATION CONSTRAINTS:
1. Provide ONLY the translated text in the output. Do not add any conversational remarks, translations labels, markdown quotes, formatting tags, explanations, or system prefix.
2. Maintain the formatting, exclamation marks, line breaks, emojis, and styling of the input exactly.
3. If the input contains slang or specialized messaging terms, translate them into the most natural equivalents in the target language.

Input Text to Translate:
"${text}"`,
        config: {
          temperature: 0.1,
          systemInstruction: "You are an accurate translator. You output only the translation and nothing else."
        }
      });

      const translated = response.text?.trim() || "";
      if (translated) {
        return { text: translated, confidence: 0.96 };
      }
    } catch (err) {
      console.error("Gemini Translation failed, falling back to demo engine:", err);
    }
  }

  // ─── DEMO FALLBACK ──────────────────────────────────────────────────────────
  console.log(`[Translation Engine] Falling back to offline dictionary matching`);
  const pairKey = `${sLang}_${tLang}`;
  if (DEMO_TRANSLATIONS[pairKey]) {
    for (const [keyword, translation] of Object.entries(DEMO_TRANSLATIONS[pairKey])) {
      if (text.toLowerCase().includes(keyword)) {
        return {
          text: translation,
          confidence: 0.95
        };
      }
    }
  }

  const srcName = LANG_MAP[sLang]?.name || sLang.toUpperCase();
  const tgtName = LANG_MAP[tLang]?.name || tLang.toUpperCase();
  const isDemo = aiClient ? "[Offline/Fallback] " : "[Demo Mode] ";

  const demoText = `${isDemo}[Translated from ${srcName} → ${tgtName}]: ${text}`;
  return {
    text: demoText,
    confidence: 0.85
  };
}

// ─── Express App Setup ──────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  app.use(express.json());

  // CORS Headers
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // ─── API Routes (v1) ────────────────────────────────────────────────────────

  // Root / Health Endpoints
  app.get("/health", (req, res) => {
    res.json({ status: "healthy" });
  });

  app.get("/api/v1/health", (req, res) => {
    res.json({ status: "healthy" });
  });

  app.get("/api/v1/root", (req, res) => {
    res.json({
      service: "AfriTranslate API",
      version: "1.0.0",
      status: "running",
      docs: "/docs",
      redoc: "/redoc",
    });
  });

  // ─── Authentication Endpoints ───

  app.post("/api/v1/auth/register", (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ detail: "Username, email, and password are required" });
    }
    if (username.length < 3 || password.length < 8) {
      return res.status(400).json({ detail: "Username must be at least 3 chars and password at least 8 chars" });
    }

    const db = readDb();
    const existingUser = db.users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ detail: "Username or Email already registered" });
    }

    const newUser = {
      id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
      username,
      email,
      hashed_password: hashPassword(password),
      is_active: true,
      api_calls: 0,
      created_at: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);

    const token = generateToken({ sub: newUser.id, username: newUser.username });

    res.status(201).json({
      access_token: token,
      token_type: "bearer",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        api_calls: newUser.api_calls,
        created_at: newUser.created_at
      }
    });
  });

  app.post("/api/v1/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ detail: "Username and password are required" });
    }

    const db = readDb();
    const user = db.users.find(u => u.username === username);
    if (!user || !verifyPassword(password, user.hashed_password)) {
      return res.status(401).json({ detail: "Incorrect username or password" });
    }

    const token = generateToken({ sub: user.id, username: user.username });

    res.json({
      access_token: token,
      token_type: "bearer",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        api_calls: user.api_calls,
        created_at: user.created_at
      }
    });
  });

  app.get("/api/v1/auth/me", getRequiredUser, (req: any, res) => {
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      api_calls: req.user.api_calls,
      created_at: req.user.created_at
    });
  });

  app.get("/api/v1/auth/stats", getRequiredUser, (req: any, res) => {
    const db = readDb();
    const userHistory = db.history.filter(h => h.user_id === req.user.id);
    const totalChars = userHistory.reduce((sum, h) => sum + (h.character_count || 0), 0);

    // Language breakdown
    const languagesBreakdown: Record<string, number> = {};
    const sourcesBreakdown: Record<string, number> = {};

    userHistory.forEach(h => {
      languagesBreakdown[h.target_lang_code] = (languagesBreakdown[h.target_lang_code] || 0) + 1;
      sourcesBreakdown[h.source] = (sourcesBreakdown[h.source] || 0) + 1;
    });

    res.json({
      api_calls: req.user.api_calls,
      total_characters: totalChars,
      total_history_records: userHistory.length,
      languages: languagesBreakdown,
      sources: sourcesBreakdown,
    });
  });

  // ─── Languages Endpoints ───

  app.get("/api/v1/languages", (req, res) => {
    const { region, active_only } = req.query;
    let result = AFRICAN_LANGUAGES;

    if (active_only !== "false") {
      result = result.filter(l => l.is_active !== false);
    }

    if (region) {
      result = result.filter(l => l.region.toLowerCase() === (region as string).toLowerCase());
    }

    res.json(result);
  });

  app.get("/api/v1/languages/:code", (req, res) => {
    const code = req.params.code.toLowerCase();
    const lang = LANG_MAP[code];
    if (!lang) {
      return res.status(404).json({ detail: `Language code '${code}' not found` });
    }
    res.json(lang);
  });

  // ─── Translation Endpoints ───

  app.post("/api/v1/translate", getOptionalUser, async (req: any, res) => {
    const { text, source_lang, target_lang, engine = "gemini" } = req.body;

    if (!text || text.length === 0) {
      return res.status(422).json({ detail: "Text to translate is required" });
    }
    if (!target_lang || !LANG_MAP[target_lang.toLowerCase()]) {
      return res.status(422).json({ detail: `Unknown target language: '${target_lang}'` });
    }

    let resolvedSource = source_lang ? source_lang.toLowerCase() : "auto";
    let detectedLang: string | null = null;
    let confidence = 0.9;

    if (resolvedSource === "auto") {
      const detectResult = detectLanguageOffline(text);
      detectedLang = detectResult.langCode;
      resolvedSource = detectedLang;
      confidence = detectResult.confidence;
    } else {
      if (!LANG_MAP[resolvedSource]) {
        return res.status(422).json({ detail: `Unknown source language: '${source_lang}'` });
      }
    }

    try {
      const translationResult = await translateText(text, resolvedSource, target_lang.toLowerCase(), engine);

      // Record History
      const db = readDb();
      const newHistoryRecord = {
        id: db.history.length > 0 ? Math.max(...db.history.map(h => h.id)) + 1 : 1,
        user_id: req.user ? req.user.id : null,
        source_text: text,
        translated_text: translationResult.text,
        source_lang_code: resolvedSource,
        target_lang_code: target_lang.toLowerCase(),
        detected_lang: detectedLang,
        confidence: translationResult.confidence,
        character_count: text.length,
        source: "api",
        message_id: null,
        created_at: new Date().toISOString()
      };

      db.history.push(newHistoryRecord);

      if (req.user) {
        const uIdx = db.users.findIndex(u => u.id === req.user.id);
        if (uIdx !== -1) {
          db.users[uIdx].api_calls += 1;
        }
      }

      writeDb(db);

      res.json({
        original_text: text,
        translated_text: translationResult.text,
        source_lang: resolvedSource,
        target_lang: target_lang.toLowerCase(),
        detected_lang: detectedLang,
        confidence: translationResult.confidence,
        character_count: text.length,
        engine
      });
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Internal server error during translation" });
    }
  });

  app.post("/api/v1/translate/batch", getOptionalUser, async (req: any, res) => {
    const { texts, source_lang, target_lang, engine = "gemini" } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return res.status(422).json({ detail: "Field 'texts' must be an array" });
    }
    if (texts.length > 20) {
      return res.status(422).json({ detail: "Maximum 20 texts per batch request" });
    }
    if (!target_lang || !LANG_MAP[target_lang.toLowerCase()]) {
      return res.status(422).json({ detail: `Unknown target language: '${target_lang}'` });
    }

    try {
      const results = [];
      let totalChars = 0;
      const db = readDb();

      for (const text of texts) {
        let resolvedSource = source_lang ? source_lang.toLowerCase() : "auto";
        let detectedLang: string | null = null;
        let confidence = 0.9;

        if (resolvedSource === "auto") {
          const detectResult = detectLanguageOffline(text);
          detectedLang = detectResult.langCode;
          resolvedSource = detectedLang;
          confidence = detectResult.confidence;
        }

        const translationResult = await translateText(text, resolvedSource, target_lang.toLowerCase(), engine);
        totalChars += text.length;

        const record = {
          id: db.history.length > 0 ? Math.max(...db.history.map(h => h.id)) + 1 : 1,
          user_id: req.user ? req.user.id : null,
          source_text: text,
          translated_text: translationResult.text,
          source_lang_code: resolvedSource,
          target_lang_code: target_lang.toLowerCase(),
          detected_lang: detectedLang,
          confidence: translationResult.confidence,
          character_count: text.length,
          source: "api",
          message_id: null,
          created_at: new Date().toISOString()
        };

        db.history.push(record);
        results.push({
          original_text: text,
          translated_text: translationResult.text,
          source_lang: resolvedSource,
          target_lang: target_lang.toLowerCase(),
          detected_lang: detectedLang,
          confidence: translationResult.confidence,
          character_count: text.length,
          engine
        });
      }

      if (req.user && texts.length > 0) {
        const uIdx = db.users.findIndex(u => u.id === req.user.id);
        if (uIdx !== -1) {
          db.users[uIdx].api_calls += texts.length;
        }
      }

      writeDb(db);

      res.json({
        results,
        total_characters: totalChars
      });
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Internal server error during batch translation" });
    }
  });

  app.post("/api/v1/translate/detect", (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(422).json({ detail: "Field 'text' is required" });
    }

    const { langCode, confidence, alternatives } = detectLanguageOffline(text);
    const lang = LANG_MAP[langCode];
    const langName = lang ? lang.name : langCode.toUpperCase();

    res.json({
      detected_lang: langCode,
      language_name: langName,
      confidence,
      alternatives
    });
  });

  // ─── History Endpoints ───

  app.get("/api/v1/history", getRequiredUser, (req: any, res) => {
    const db = readDb();
    let userHistory = db.history.filter(h => h.user_id === req.user.id);

    const { source_lang, target_lang, source, page = 1, page_size = 20 } = req.query;

    if (source_lang) {
      userHistory = userHistory.filter(h => h.source_lang_code === (source_lang as string).toLowerCase());
    }
    if (target_lang) {
      userHistory = userHistory.filter(h => h.target_lang_code === (target_lang as string).toLowerCase());
    }
    if (source) {
      userHistory = userHistory.filter(h => h.source === (source as string).toLowerCase());
    }

    // Sort by created_at desc
    userHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = userHistory.length;
    const p = parseInt(page as string, 10);
    const ps = parseInt(page_size as string, 10);
    const startIdx = (p - 1) * ps;
    const paginatedItems = userHistory.slice(startIdx, startIdx + ps);

    res.json({
      items: paginatedItems,
      total,
      page: p,
      page_size: ps
    });
  });

  app.delete("/api/v1/history/:id", getRequiredUser, (req: any, res) => {
    const recordId = parseInt(req.params.id, 10);
    const db = readDb();
    const hIdx = db.history.findIndex(h => h.id === recordId && h.user_id === req.user.id);

    if (hIdx === -1) {
      return res.status(404).json({ detail: "Record not found or unauthorized" });
    }

    db.history.splice(hIdx, 1);
    writeDb(db);
    res.sendStatus(204);
  });

  // ─── Webhook Endpoints ───

  // WhatsApp GET webhook verification
  app.get("/api/v1/webhook/whatsapp", (req, res) => {
    const hubMode = req.query["hub.mode"] || req.query["hub_mode"];
    const hubVerifyToken = req.query["hub.verify_token"] || req.query["hub_verify_token"];
    const hubChallenge = req.query["hub.challenge"] || req.query["hub_challenge"];

    const VERIFY_TOKEN = "afritranslate_whatsapp_verify";

    if (hubMode === "subscribe" && hubVerifyToken === VERIFY_TOKEN) {
      return res.send(hubChallenge);
    }
    return res.status(403).json({ detail: "Verification failed" });
  });

  // WhatsApp POST webhook handler
  app.post("/api/v1/webhook/whatsapp", async (req, res) => {
    const payload = req.body;
    const targetLang = (req.query.target_lang as string) || "en";

    const translations: any[] = [];
    const db = readDb();

    try {
      if (payload && Array.isArray(payload.entry)) {
        for (const entry of payload.entry) {
          if (Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              const value = change.value || {};
              if (Array.isArray(value.messages)) {
                for (const msg of value.messages) {
                  if (msg.type !== "text" || !msg.text?.body) continue;

                  const text = msg.text.body;
                  const msgId = msg.id || `wa_${crypto.randomBytes(6).toString("hex")}`;

                  const { langCode, confidence } = detectLanguageOffline(text);
                  const translationResult = await translateText(text, langCode, targetLang.toLowerCase(), "gemini");

                  const record = {
                    id: db.history.length > 0 ? Math.max(...db.history.map(h => h.id)) + 1 : 1,
                    user_id: null, // Public webhook
                    source_text: text,
                    translated_text: translationResult.text,
                    source_lang_code: langCode,
                    target_lang_code: targetLang.toLowerCase(),
                    detected_lang: langCode,
                    confidence: translationResult.confidence,
                    character_count: text.length,
                    source: "whatsapp",
                    message_id: msgId,
                    created_at: new Date().toISOString()
                  };

                  db.history.push(record);
                  translations.push({
                    message_id: msgId,
                    original: text,
                    translated: translationResult.text,
                    detected_lang: langCode,
                    target_lang: targetLang.toLowerCase(),
                    confidence: translationResult.confidence
                  });
                }
              }
            }
          }
        }
      }

      writeDb(db);
      res.json({
        status: "ok",
        translated_count: translations.length,
        translations
      });
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to process WhatsApp webhook" });
    }
  });

  // Telegram POST webhook handler
  app.post("/api/v1/webhook/telegram", async (req, res) => {
    const payload = req.body;
    const targetLang = (req.query.target_lang as string) || "en";

    const message = payload?.message;
    if (!message || !message.text) {
      return res.json({ status: "ignored", reason: "No text content" });
    }

    const text = message.text;
    const updateId = payload.update_id ? String(payload.update_id) : `tg_${crypto.randomBytes(6).toString("hex")}`;

    try {
      const { langCode, confidence } = detectLanguageOffline(text);
      const translationResult = await translateText(text, langCode, targetLang.toLowerCase(), "gemini");

      const db = readDb();
      const record = {
        id: db.history.length > 0 ? Math.max(...db.history.map(h => h.id)) + 1 : 1,
        user_id: null,
        source_text: text,
        translated_text: translationResult.text,
        source_lang_code: langCode,
        target_lang_code: targetLang.toLowerCase(),
        detected_lang: langCode,
        confidence: translationResult.confidence,
        character_count: text.length,
        source: "telegram",
        message_id: updateId,
        created_at: new Date().toISOString()
      };

      db.history.push(record);
      writeDb(db);

      res.json({
        status: "ok",
        update_id: payload.update_id || 0,
        original: text,
        translated: translationResult.text,
        detected_lang: langCode,
        target_lang: targetLang.toLowerCase(),
        confidence: translationResult.confidence
      });
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to process Telegram webhook" });
    }
  });

  // Generic messaging webhook
  app.post("/api/v1/webhook/generic", async (req, res) => {
    const { message_id, platform, text, source_lang = "auto", target_lang = "en", metadata } = req.body;

    if (!text || !message_id || !platform) {
      return res.status(400).json({ detail: "Fields 'text', 'message_id', and 'platform' are required" });
    }

    if (!LANG_MAP[target_lang.toLowerCase()]) {
      return res.status(422).json({ detail: `Unknown target language: '${target_lang}'` });
    }

    let resolvedSource = source_lang ? source_lang.toLowerCase() : "auto";
    let detectedLang: string | null = null;
    let confidence = 0.9;

    if (resolvedSource === "auto") {
      const detectResult = detectLanguageOffline(text);
      detectedLang = detectResult.langCode;
      resolvedSource = detectedLang;
      confidence = detectResult.confidence;
    } else {
      if (!LANG_MAP[resolvedSource]) {
        return res.status(422).json({ detail: `Unknown source language: '${source_lang}'` });
      }
    }

    try {
      const translationResult = await translateText(text, resolvedSource, target_lang.toLowerCase(), "gemini");

      const db = readDb();
      const record = {
        id: db.history.length > 0 ? Math.max(...db.history.map(h => h.id)) + 1 : 1,
        user_id: null,
        source_text: text,
        translated_text: translationResult.text,
        source_lang_code: resolvedSource,
        target_lang_code: target_lang.toLowerCase(),
        detected_lang: detectedLang,
        confidence: translationResult.confidence,
        character_count: text.length,
        source: platform,
        message_id: message_id,
        metadata: metadata || null,
        created_at: new Date().toISOString()
      };

      db.history.push(record);
      writeDb(db);

      res.json({
        status: "ok",
        message_id,
        platform,
        original: text,
        translated: translationResult.text,
        source_lang: resolvedSource,
        target_lang: target_lang.toLowerCase(),
        detected_lang: detectedLang,
        confidence: translationResult.confidence
      });
    } catch (err: any) {
      res.status(500).json({ detail: err.message || "Failed to process generic webhook" });
    }
  });

  // Create Webhook Config
  app.post("/api/v1/webhook/config", getRequiredUser, (req: any, res) => {
    const { platform, endpoint_url, secret_token, default_target_lang = "en" } = req.body;

    if (!platform || !endpoint_url) {
      return res.status(400).json({ detail: "Fields 'platform' and 'endpoint_url' are required" });
    }

    const db = readDb();
    const newConfig = {
      id: db.webhookConfigs.length > 0 ? Math.max(...db.webhookConfigs.map(c => c.id)) + 1 : 1,
      user_id: req.user.id,
      platform,
      endpoint_url,
      secret_token: secret_token || `wh_sec_${crypto.randomBytes(8).toString("hex")}`,
      default_target_lang,
      is_active: true,
      created_at: new Date().toISOString()
    };

    db.webhookConfigs.push(newConfig);
    writeDb(db);

    res.status(201).json(newConfig);
  });

  // Get Webhook Configs
  app.get("/api/v1/webhook/config", getRequiredUser, (req: any, res) => {
    const db = readDb();
    const configs = db.webhookConfigs.filter(c => c.user_id === req.user.id);
    res.json(configs);
  });

  // Delete Webhook Config
  app.delete("/api/v1/webhook/config/:id", getRequiredUser, (req: any, res) => {
    const configId = parseInt(req.params.id, 10);
    const db = readDb();
    const cIdx = db.webhookConfigs.findIndex(c => c.id === configId && c.user_id === req.user.id);

    if (cIdx === -1) {
      return res.status(404).json({ detail: "Config not found or unauthorized" });
    }

    db.webhookConfigs.splice(cIdx, 1);
    writeDb(db);
    res.sendStatus(204);
  });

  // ─── Vite Middleware & SPA serving ──────────────────────────────────────────

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AfriTranslate Backend running on http://localhost:${PORT}`);
  });
}

startServer();
