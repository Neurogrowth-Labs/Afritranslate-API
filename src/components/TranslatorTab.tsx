import React, { useState, useEffect } from "react";
import { Languages, ArrowRightLeft, Sparkles, AlertTriangle, Code, Copy, Check, CornerDownRight, Zap } from "lucide-react";
import { AFRICAN_LANGUAGES } from "../data/languages";
import { TranslateResponse } from "../types";

interface TranslatorTabProps {
  token: string | null;
}

export default function TranslatorTab({ token }: TranslatorTabProps) {
  const [text, setText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("sw");
  const [engine, setEngine] = useState<"demo" | "gemini" | "google" | "deepl" | "libretranslate">("gemini");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TranslateResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [apiResponseJson, setApiResponseJson] = useState<string | null>(null);

  // Auto-translate if text is long enough or on button click
  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/v1/translate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          text,
          source_lang: sourceLang,
          target_lang: targetLang,
          engine
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Translation request failed");
      }

      setResponse(data as TranslateResponse);
      setApiResponseJson(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message || "Failed to complete translation.");
      setResponse(null);
      setApiResponseJson(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === "auto") return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response.translated_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sandbox Controller Card */}
      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-6 shadow-sm">
          {/* Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <Languages className="h-4 w-4" />
              </span>
              <h3 className="font-sans font-semibold text-white">Live API Translator Sandbox</h3>
            </div>

            {/* Engine Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Engine:</span>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value as any)}
                className="rounded-lg bg-[#0F172A] px-2.5 py-1.5 text-xs font-semibold text-amber-500 border border-slate-800 outline-none focus:border-amber-500 cursor-pointer transition-all"
              >
                <option value="gemini">✨ Gemini AI</option>
                <option value="google">🌍 Google Translate API</option>
                <option value="deepl">🔹 DeepL API</option>
                <option value="libretranslate">🟢 LibreTranslate</option>
                <option value="demo">⚡ Offline/Demo</option>
              </select>
            </div>
          </div>

          {/* Warning for unconfigured Gemini API */}
          {engine === "gemini" && (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
              <div className="h-5 w-5 shrink-0 text-amber-500 mt-0.5">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">Real-time Translation Mode</p>
                <p className="mt-0.5 text-slate-400 leading-normal">
                  Our Express backend queries <span className="font-mono text-amber-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">gemini-3.5-flash</span> using the secure server-side API key injected at runtime. Fully robust, precise, and completely hidden from the browser.
                </p>
              </div>
            </div>
          )}

          {engine === "google" && (
            <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
              <div className="h-5 w-5 shrink-0 text-blue-400 mt-0.5">
                <Languages className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">Google Cloud Translation API</p>
                <p className="mt-0.5 text-slate-400 leading-normal">
                  Uses the production-grade <span className="font-mono text-blue-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">Google Translate v2</span> API. Requires the secure <span className="font-mono text-blue-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">GOOGLE_TRANSLATE_API_KEY</span>. If unconfigured, falls back to Gemini.
                </p>
              </div>
            </div>
          )}

          {engine === "deepl" && (
            <div className="mb-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
              <div className="h-5 w-5 shrink-0 text-indigo-400 mt-0.5">
                <Zap className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">DeepL Translation API</p>
                <p className="mt-0.5 text-slate-400 leading-normal">
                  Uses the world-class <span className="font-mono text-indigo-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">DeepL Translation v2</span> API. Requires <span className="font-mono text-indigo-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">DEEPL_API_KEY</span>. Supports both free (:fx) and pro plans with dynamic routing.
                </p>
              </div>
            </div>
          )}

          {engine === "libretranslate" && (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
              <div className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5">
                <Code className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">Self-Hosted LibreTranslate</p>
                <p className="mt-0.5 text-slate-400 leading-normal">
                  Routes translations to an independent, self-hosted or public <span className="font-mono text-emerald-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">LibreTranslate</span> instance configured via <span className="font-mono text-emerald-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">LIBRETRANSLATE_API_URL</span>.
                </p>
              </div>
            </div>
          )}

          {engine === "demo" && (
            <div className="mb-4 rounded-xl border border-slate-500/20 bg-slate-500/5 p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
              <div className="h-5 w-5 shrink-0 text-slate-400 mt-0.5">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">Offline/Demo Matching Mode</p>
                <p className="mt-0.5 text-slate-400 leading-normal">
                  Runs local, instantaneous keyword matching of standard terms. Fully client-side fallback when no external API credentials are set or internet is unavailable.
                </p>
              </div>
            </div>
          )}

          {/* Lang select dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-9 gap-3 items-center mb-4">
            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Language</label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="auto">🌍 Auto Detect</option>
                {AFRICAN_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.native})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1 flex justify-center pt-4 md:pt-0">
              <button
                type="button"
                disabled={sourceLang === "auto"}
                onClick={handleSwapLanguages}
                className="rounded-full border border-slate-700 bg-[#0F172A] p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 rotate-90 md:rotate-0" />
              </button>
            </div>

            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Language</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-[#0F172A] px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                {AFRICAN_LANGUAGES.filter(l => l.code !== "auto").map((lang) => (
                   <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.native})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text Input Block */}
          <div className="relative border border-slate-750 rounded-xl overflow-hidden bg-[#0F172A] focus-within:border-amber-500 transition-all">
            <textarea
              rows={5}
              maxLength={5000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message to translate here (e.g. 'Habari gani?')"
              className="w-full bg-transparent px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none resize-none"
            />
            <div className="bg-[#151C2C] border-t border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>{text.length} / 5000 characters</span>
              {text && (
                <button
                  type="button"
                  onClick={() => setText("")}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleTranslate}
            disabled={loading || !text.trim()}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-400 active:bg-amber-600 transition-all shadow-lg shadow-amber-500/5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                Translating via AfriTranslate API...
              </>
            ) : (
              <>
                Translate Text
              </>
            )}
          </button>
        </div>

        {/* Translation Results Card */}
        {response && (
          <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  SUCCESS (200 OK)
                </span>
                {response.detected_lang && (
                  <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                    <CornerDownRight className="h-3.5 w-3.5 text-slate-500" />
                    Auto-detected: <strong className="text-amber-500 uppercase">{response.detected_lang}</strong> ({(response.confidence * 100).toFixed(0)}% conf)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0F172A] px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    Copy Result
                  </>
                )}
              </button>
            </div>

            <div className="rounded-xl bg-[#0F172A] p-4 border border-slate-800">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Translated Output</p>
              <p className="text-sm text-slate-100 leading-relaxed font-sans font-medium">
                {response.translated_text}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs font-mono">
              <div className="rounded-lg bg-[#0F172A] p-2.5 border border-slate-800 text-center">
                <p className="text-[10px] text-slate-500">CHARACTERS</p>
                <p className="font-semibold text-slate-300 mt-0.5">{response.character_count}</p>
              </div>
              <div className="rounded-lg bg-[#0F172A] p-2.5 border border-slate-800 text-center">
                <p className="text-[10px] text-slate-500">ENGINE</p>
                <p className="font-semibold text-slate-300 mt-0.5 capitalize">{response.engine}</p>
              </div>
              <div className="rounded-lg bg-[#0F172A] p-2.5 border border-slate-800 text-center">
                <p className="text-[10px] text-slate-500">DIRECTION</p>
                <p className="font-semibold text-slate-300 mt-0.5 uppercase">{response.source_lang} → {response.target_lang}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300 flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold text-rose-200">Translation Error</p>
              <p className="mt-0.5 text-rose-300/90">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* JSON Output Column */}
      <div className="lg:col-span-5 flex flex-col h-full min-h-[400px]">
        <div className="rounded-2xl border border-slate-800 bg-[#1E293B] shadow-sm flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="bg-[#151C2C] px-4 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-amber-500" />
              <span className="font-mono text-xs font-semibold text-slate-300">HTTP Response payload (JSON)</span>
            </div>
            {apiResponseJson && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            )}
          </div>

          {/* Code panel */}
          <div className="p-4 flex-1 font-mono text-xs text-slate-300 overflow-auto bg-[#0F172A] leading-normal select-text">
            {apiResponseJson ? (
              <pre className="text-emerald-400 whitespace-pre-wrap word-break-all">{apiResponseJson}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-20 px-4 space-y-3">
                <Code className="h-8 w-8 text-slate-700" />
                <p className="max-w-[250px] leading-relaxed text-slate-400">
                  No request executed yet. Input text above and click translate to view the real-time REST API JSON output here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
