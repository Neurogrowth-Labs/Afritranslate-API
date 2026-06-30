import React, { useState, useEffect } from "react";
import { BookOpen, Code, Terminal, Play, Clipboard, Check, ChevronRight, Lock, Key, Info } from "lucide-react";

interface ApiDocsTabProps {
  token: string | null;
}

interface Endpoint {
  method: "GET" | "POST" | "DELETE";
  path: string;
  tag: string;
  description: string;
  secured: boolean;
  defaultParams?: Record<string, any>;
  defaultQuery?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "POST",
    path: "/api/v1/auth/register",
    tag: "Authentication",
    description: "Create a new developer account and generate an API access token.",
    secured: false,
    defaultParams: {
      username: "new_developer",
      email: "new_dev@company.com",
      password: "secure_password_123"
    }
  },
  {
    method: "POST",
    path: "/api/v1/auth/login",
    tag: "Authentication",
    description: "Authenticate with username/password and retrieve your JWT Token.",
    secured: false,
    defaultParams: {
      username: "demo",
      password: "password"
    }
  },
  {
    method: "GET",
    path: "/api/v1/auth/me",
    tag: "Authentication",
    description: "Fetch your active developer credentials, details, and API quota statistics.",
    secured: true
  },
  {
    method: "GET",
    path: "/api/v1/auth/stats",
    tag: "Authentication",
    description: "Fetch visual translation character logs, breakdown by language, and usage sources.",
    secured: true
  },
  {
    method: "GET",
    path: "/api/v1/languages",
    tag: "Languages",
    description: "Retrieve a catalogue of all 20+ supported African languages, native details, and script codes.",
    secured: false,
    defaultQuery: "?region=East%20Africa"
  },
  {
    method: "GET",
    path: "/api/v1/languages/sw",
    tag: "Languages",
    description: "Retrieve native scripts, speaker counts, and details for a specific language code.",
    secured: false
  },
  {
    method: "POST",
    path: "/api/v1/translate",
    tag: "Translation",
    description: "Translate single texts across 20+ African languages. Use auto source to auto-detect language.",
    secured: false,
    defaultParams: {
      text: "Asante sana ndugu yangu.",
      source_lang: "auto",
      target_lang: "en",
      engine: "gemini"
    }
  },
  {
    method: "POST",
    path: "/api/v1/translate/batch",
    tag: "Translation",
    description: "Batch translate multiple texts in parallel (max 20 texts per request) to optimize throughput.",
    secured: false,
    defaultParams: {
      texts: [
        "Sawubona",
        "Sawubona unjani",
        "Siyabonga kakhulu"
      ],
      source_lang: "auto",
      target_lang: "en",
      engine: "gemini"
    }
  },
  {
    method: "POST",
    path: "/api/v1/translate/detect",
    tag: "Translation",
    description: "Execute offline statistical heuristic keyword mapping to identify the written language code.",
    secured: false,
    defaultParams: {
      text: "Mhoro shamwari, ndatenda zvikuru."
    }
  },
  {
    method: "GET",
    path: "/api/v1/history",
    tag: "History",
    description: "Retrieve paginated translation records logged under your developer credentials.",
    secured: true,
    defaultQuery: "?page=1&page_size=10"
  },
  {
    method: "POST",
    path: "/api/v1/webhook/config",
    tag: "Messaging Webhooks",
    description: "Register a messaging app callback webhook (WhatsApp/Telegram/Custom) to trigger real-time events.",
    secured: true,
    defaultParams: {
      platform: "whatsapp",
      endpoint_url: "https://your-server.com/callback",
      secret_token: "wa_secret_token_signature_xyz",
      default_target_lang: "en"
    }
  },
  {
    method: "GET",
    path: "/api/v1/webhook/config",
    tag: "Messaging Webhooks",
    description: "List webhook triggers registered under your active developer namespace.",
    secured: true
  }
];

export default function ApiDocsTab({ token }: ApiDocsTabProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [bodyInput, setBodyInput] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [responseCode, setResponseCode] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const endpoint = ENDPOINTS[selectedIdx];

  // Sync endpoint selection with editor panels
  useEffect(() => {
    setBodyInput(endpoint.defaultParams ? JSON.stringify(endpoint.defaultParams, null, 2) : "");
    setQueryInput(endpoint.defaultQuery || "");
    setResponseCode(null);
    setResponseBody(null);
  }, [selectedIdx]);

  const getCurlString = () => {
    const origin = window.location.origin;
    let authHeader = token ? ` -H "Authorization: Bearer ${token}"` : endpoint.secured ? ` -H "Authorization: Bearer <JWT_TOKEN>"` : "";
    let bodyPart = endpoint.method === "POST" ? ` -H "Content-Type: application/json" -d '${bodyInput.replace(/\n\s*/g, "").replace(/'/g, "\\'")}'` : "";
    return `curl -X ${endpoint.method} "${origin}${endpoint.path}${queryInput}"${authHeader}${bodyPart}`;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(getCurlString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = async () => {
    setExecuting(true);
    setResponseCode(null);
    setResponseBody(null);

    const headers: Record<string, string> = {};
    if (endpoint.method === "POST") {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method: endpoint.method,
      headers
    };

    if (endpoint.method === "POST" && bodyInput) {
      try {
        options.body = JSON.stringify(JSON.parse(bodyInput));
      } catch (e: any) {
        setResponseBody(JSON.stringify({ detail: `Invalid JSON request body: ${e.message}` }, null, 2));
        setExecuting(false);
        return;
      }
    }

    try {
      const res = await fetch(`${endpoint.path}${queryInput}`, options);
      setResponseCode(res.status);
      if (res.status === 204) {
        setResponseBody("No Content (204 OK)");
      } else {
        const data = await res.json();
        setResponseBody(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setResponseBody(JSON.stringify({ detail: err.message || "Failed to execute request" }, null, 2));
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Endpoints List Panel */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
            <BookOpen className="h-4 w-4 text-amber-500" />
            <span className="font-sans font-semibold text-white text-sm">Endpoints Catalogue</span>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[500px] pr-1">
            {ENDPOINTS.map((ep, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`w-full flex items-start gap-2.5 rounded-xl p-2.5 text-left transition-all border group ${
                  selectedIdx === idx
                    ? "bg-[#0F172A] border-amber-500/30 text-white"
                    : "border-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {/* Method pill badge */}
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md tracking-wider shrink-0 w-12 text-center mt-0.5 ${
                  ep.method === "GET"
                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                    : ep.method === "POST"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {ep.method}
                </span>

                <div className="space-y-0.5 overflow-hidden">
                  <p className="font-mono text-xs font-semibold truncate group-hover:translate-x-0.5 transition-transform">
                    {ep.path}
                  </p>
                  <p className="text-[10px] leading-normal text-slate-500">
                    {ep.tag}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Security / Token Notice */}
        <div className="rounded-2xl border border-slate-800 bg-amber-500/5 p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-500" />
            <span className="font-sans font-semibold text-slate-200 text-xs">Sandbox Token Security</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Secure routes marked with a <Lock className="inline h-3 w-3 text-slate-500" /> lock require a JWT Token in the <span className="font-mono text-amber-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">Authorization: Bearer ...</span> header.
          </p>
          {token ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-[10px] font-mono text-emerald-400 flex items-center justify-between gap-2 overflow-hidden">
              <span className="truncate">Active Token: {token.slice(0, 15)}...{token.slice(-10)}</span>
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-[10px] font-mono text-amber-400 leading-normal">
              Sign In in the console header to inject your real developer credentials token automatically.
            </div>
          )}
        </div>
      </div>

      {/* Endpoint Details & Interactive Workspace */}
      <div className="lg:col-span-8 space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-6 shadow-sm space-y-5">
          {/* Endpoint title block */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                  endpoint.method === "GET"
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                    : endpoint.method === "POST"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}>
                  {endpoint.method}
                </span>
                <h3 className="font-mono text-sm font-bold text-white">{endpoint.path}</h3>
                {endpoint.secured && (
                  <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-bold font-mono">
                    <Lock className="h-2.5 w-2.5" /> SECURED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl mt-1">
                {endpoint.description}
              </p>
            </div>
          </div>

          {/* curl command display */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              <span>cURL Command Command Template</span>
              <button
                type="button"
                onClick={handleCopyCurl}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Clipboard className="h-3 w-3 text-amber-500" /> Copy curl
                  </>
                )}
              </button>
            </div>
            <div className="rounded-xl bg-[#0F172A] p-3.5 border border-slate-800 overflow-x-auto text-xs font-mono text-slate-300 leading-normal select-all">
              <pre className="whitespace-pre-wrap">{getCurlString()}</pre>
            </div>
          </div>

          {/* Query Params or Body input */}
          {endpoint.method === "POST" && bodyInput && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Request JSON Body
              </label>
              <div className="rounded-xl border border-slate-750 bg-[#0F172A] overflow-hidden font-mono text-xs focus-within:border-amber-500 transition-all">
                <textarea
                  rows={4}
                  value={bodyInput}
                  onChange={(e) => setBodyInput(e.target.value)}
                  className="w-full p-3 bg-transparent text-slate-100 outline-none resize-none font-mono"
                />
              </div>
            </div>
          )}

          {endpoint.defaultQuery !== undefined && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                Query String parameters
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-750 bg-[#0F172A] py-2.5 px-3 text-xs text-slate-100 font-mono outline-none focus:border-amber-500 transition-all"
                  placeholder="?page=1&page_size=20"
                />
              </div>
            </div>
          )}

          {/* Trigger Request button */}
          <button
            type="button"
            onClick={handleExecute}
            disabled={executing}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-400 active:bg-amber-600 transition-all shadow-lg disabled:opacity-50"
          >
            {executing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                Executing live query on server...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-slate-950 text-slate-950" />
                Execute Sandbox Query
              </>
            )}
          </button>
        </div>

        {/* Live response block */}
        {responseBody && (
          <div className="rounded-2xl border border-slate-800 bg-[#1E293B] shadow-sm overflow-hidden space-y-0">
            {/* Header */}
            <div className="bg-[#151C2C] px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-amber-500" />
                <span className="font-mono text-xs font-semibold text-slate-300">HTTP REST Response</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                responseCode && responseCode < 400 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {responseCode} {responseCode && responseCode < 400 ? "OK" : "ERROR"}
              </span>
            </div>

            {/* Code */}
            <div className="p-4 font-mono text-xs text-emerald-400 overflow-auto bg-[#0F172A] max-h-[350px] leading-normal select-text">
              <pre className="whitespace-pre-wrap">{responseBody}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
