import React, { useState } from "react";
import { Languages } from "lucide-react";
import { AFRICAN_LANGUAGES } from "../data/languages";

export default function TranslatorTab({ token }: { token: string | null }) {
  const [text, setText] = useState("Habari, unaendeleaje?");
  const [sourceLang, setSourceLang] = useState("sw");
  const [targetLang, setTargetLang] = useState("en");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function translate() {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/v1/translate", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ text, source_lang: sourceLang, target_lang: targetLang }) });
      const data = await res.json();
      setResult(data.translated_text || data.text || JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Translation failed");
    } finally { setLoading(false); }
  }

  return <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6"><div className="mb-4 flex items-center gap-2 text-white"><Languages className="h-5 w-5 text-amber-500" /><h1 className="text-xl font-bold">Sandbox Translator</h1></div><textarea className="min-h-40 w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-100 outline-none focus:border-amber-500" value={text} onChange={(e) => setText(e.target.value)} /><div className="mt-4 grid gap-3 sm:grid-cols-2"><select className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm" value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>{AFRICAN_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select><select className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm" value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>{AFRICAN_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select></div><button onClick={translate} disabled={loading} className="mt-4 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-60">{loading ? "Translating..." : "Translate"}</button></section><section className="rounded-3xl border border-slate-800 bg-[#111827] p-6"><h2 className="mb-4 text-xl font-bold text-white">Result</h2><div className="min-h-40 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-200 whitespace-pre-wrap">{result || "Your translation will appear here."}</div></section></div>;
}
