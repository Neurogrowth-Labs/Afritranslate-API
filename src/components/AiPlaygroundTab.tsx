import React, { useState, useEffect } from "react";
import { 
  Brain, 
  Zap, 
  Search, 
  MapPin, 
  Sparkles, 
  Cpu, 
  Copy, 
  Check, 
  Compass, 
  BookOpen, 
  ArrowRight, 
  CornerDownRight, 
  AlertTriangle,
  Send,
  Loader2,
  ExternalLink,
  Map,
  MapPinned
} from "lucide-react";

interface AiPlaygroundTabProps {
  token: string | null;
}

type ModeType = "thinking" | "low-latency" | "search-grounding" | "maps-grounding" | "intelligence";
type TaskType = "general" | "fast" | "complex";

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        text: string;
      }[];
    };
  };
}

interface AIResponse {
  text: string;
  modelUsed: string;
  groundingChunks: GroundingChunk[];
}

export default function AiPlaygroundTab({ token }: AiPlaygroundTabProps) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<ModeType>("thinking");
  const [taskType, setTaskType] = useState<TaskType>("general");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "getting" | "success" | "error">("idle");
  const [locName, setLocName] = useState("Lagos, Nigeria (Default)");
  
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Default coordinate presets (Africa focus)
  const PRESETS = [
    { name: "Lagos, Nigeria", lat: 6.5244, lng: 3.3792 },
    { name: "Nairobi, Kenya", lat: -1.2921, lng: 36.8219 },
    { name: "Cape Town, South Africa", lat: -33.9249, lng: 18.4241 },
    { name: "Cairo, Egypt", lat: 30.0444, lng: 31.2357 },
    { name: "Addis Ababa, Ethiopia", lat: 9.0300, lng: 38.7400 }
  ];

  useEffect(() => {
    // Set default coordinate values
    setLatitude(6.5244);
    setLongitude(3.3792);
  }, []);

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setLocName(preset.name);
    setLocStatus("success");
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus("error");
      return;
    }
    setLocStatus("getting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocName("Your Actual Geolocation");
        setLocStatus("success");
      },
      () => {
        setLocStatus("error");
        // Revert to Lagos default
        setLatitude(6.5244);
        setLongitude(3.3792);
        setLocName("Lagos, Nigeria (Default)");
      }
    );
  };

  const handleQuery = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/v1/ai-playground", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt,
          mode,
          taskType: mode === "intelligence" ? taskType : undefined,
          latitude: mode === "maps-grounding" ? (latitude ?? undefined) : undefined,
          longitude: mode === "maps-grounding" ? (longitude ?? undefined) : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Request failed");
      }

      setResponse(data as AIResponse);
    } catch (err: any) {
      setError(err.message || "Failed to complete query.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickPrompt = (pText: string, pMode: ModeType, pTaskType?: TaskType) => {
    setPrompt(pText);
    setMode(pMode);
    if (pTaskType) {
      setTaskType(pTaskType);
    }
  };

  // Extract grounding information
  const webGroundings = response?.groundingChunks?.filter(chunk => chunk.web) || [];
  const mapsGroundings = response?.groundingChunks?.filter(chunk => chunk.maps) || [];

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 border border-amber-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-sans font-extrabold text-xl text-white">Gemini Advanced AI Labs</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Explore real-time thinking, groundings, low-latency, and custom language intelligence operations</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Controls & Input */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-6 shadow-sm space-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">Select AI Core Modality</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Thinking Mode Button */}
                <button
                  onClick={() => setMode("thinking")}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                    mode === "thinking"
                      ? "bg-amber-500/10 border-amber-500 text-slate-200 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                      : "bg-[#0F172A]/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className={`h-4.5 w-4.5 ${mode === "thinking" ? "text-amber-500" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-white">🧠 High Thinking Mode</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Max reasoning for complex language queries and proverbs. Powered by <strong className="font-mono text-[9px] text-amber-500">gemini-3.1-pro-preview</strong>.
                  </p>
                </button>

                {/* Low-Latency Mode Button */}
                <button
                  onClick={() => setMode("low-latency")}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                    mode === "low-latency"
                      ? "bg-amber-500/10 border-amber-500 text-slate-200 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                      : "bg-[#0F172A]/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className={`h-4.5 w-4.5 ${mode === "low-latency" ? "text-amber-400 animate-pulse" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-white">⚡ Low-Latency Chat</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Blazing-fast sub-second response times. Powered by <strong className="font-mono text-[9px] text-amber-400">gemini-3.1-flash-lite</strong>.
                  </p>
                </button>

                {/* Search Grounding Mode */}
                <button
                  onClick={() => setMode("search-grounding")}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                    mode === "search-grounding"
                      ? "bg-amber-500/10 border-amber-500 text-slate-200 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                      : "bg-[#0F172A]/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Search className={`h-4.5 w-4.5 ${mode === "search-grounding" ? "text-sky-400" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-white">🔍 Google Search Data</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Queries web/news to inject live, up-to-date facts. Powered by <strong className="font-mono text-[9px] text-sky-400">gemini-3.5-flash</strong>.
                  </p>
                </button>

                {/* Maps Grounding Mode */}
                <button
                  onClick={() => setMode("maps-grounding")}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                    mode === "maps-grounding"
                      ? "bg-amber-500/10 border-amber-500 text-slate-200 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                      : "bg-[#0F172A]/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className={`h-4.5 w-4.5 ${mode === "maps-grounding" ? "text-emerald-400" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-white">🗺️ Google Maps Grounding</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Location-aware place sources and live maps. Powered by <strong className="font-mono text-[9px] text-emerald-400">gemini-3.5-flash</strong>.
                  </p>
                </button>

                {/* Intelligence Mode */}
                <button
                  onClick={() => setMode("intelligence")}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all relative overflow-hidden sm:col-span-2 ${
                    mode === "intelligence"
                      ? "bg-amber-500/10 border-amber-500 text-slate-200 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                      : "bg-[#0F172A]/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className={`h-4.5 w-4.5 ${mode === "intelligence" ? "text-violet-400" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-white">✨ AfriTranslate Dynamic Intelligence</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Analyze, proofread, and summarize translation content. Automatically switches models based on speed/complexity.
                  </p>
                </button>
              </div>
            </div>

            {/* Geolocation options (only for Maps grounding) */}
            {mode === "maps-grounding" && (
              <div className="p-4 rounded-xl border border-slate-750 bg-[#0F172A] space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Map className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">Maps Coordinates</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Active Preset: {locName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Latitude</span>
                    <input
                      type="number"
                      value={latitude ?? ""}
                      onChange={(e) => setLatitude(Number(e.target.value))}
                      className="w-full bg-[#1E293B] border border-slate-800 px-2.5 py-1.5 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Longitude</span>
                    <input
                      type="number"
                      value={longitude ?? ""}
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      className="w-full bg-[#1E293B] border border-slate-800 px-2.5 py-1.5 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleGetLocation}
                    disabled={locStatus === "getting"}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-slate-700 transition-all disabled:opacity-40"
                  >
                    {locStatus === "getting" ? "Fetching..." : "🎯 Use My Location"}
                  </button>
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => handlePresetSelect(p)}
                      className="bg-[#1E293B] hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] px-2.5 py-1 rounded-lg border border-slate-800 transition-all"
                    >
                      {p.name.split(",")[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Intelligence options */}
            {mode === "intelligence" && (
              <div className="p-4 rounded-xl border border-slate-750 bg-[#0F172A] space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Task Speed & Complexity Profile</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "fast", label: "Fast Task", desc: "gemini-3.1-flash-lite", color: "text-amber-400 border-amber-500/30 bg-amber-500/5" },
                    { id: "general", label: "General Task", desc: "gemini-3.5-flash", color: "text-sky-400 border-sky-500/30 bg-sky-500/5" },
                    { id: "complex", label: "Complex Task", desc: "gemini-3.1-pro-preview", color: "text-violet-400 border-violet-500/30 bg-violet-500/5" }
                  ].map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setTaskType(task.id as TaskType)}
                      className={`flex flex-col text-left p-2.5 rounded-lg border text-xs transition-all ${
                        taskType === task.id
                          ? "bg-slate-800 border-amber-500 text-white shadow-xs"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="font-bold">{task.label}</span>
                      <span className="text-[9px] font-mono mt-0.5 opacity-80 truncate">{task.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Input Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Query or Prompt</label>
              <div className="relative border border-slate-750 rounded-xl overflow-hidden bg-[#0F172A] focus-within:border-amber-500 transition-all">
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    mode === "thinking"
                      ? "Describe a complex query. E.g., 'Compare Yoruba and Swahili noun-class conjugation syntax rules with a breakdown of cultural differences.'"
                      : mode === "low-latency"
                      ? "Type anything for a fast reply... E.g., 'Translate \"Hello my friend, how was your day?\" in Amharic.'"
                      : mode === "search-grounding"
                      ? "Search recent information... E.g., 'What are the current latest news or events regarding tech startups in Kenya in 2026?'"
                      : mode === "maps-grounding"
                      ? "Search nearby places... E.g., 'Show me 3 popular historical landmarks in this region with description.'"
                      : "E.g., 'Explain the deep philosophical meaning and origin of the Zulu proverb \"Umuntu ngumuntu ngabantu\".'"
                  }
                  className="w-full bg-transparent px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleQuery}
              disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-400 active:bg-amber-600 transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  Executing AI Modality on AfriTranslate Server...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Execute AI Query
                </>
              )}
            </button>
          </div>

          {/* Quick Prompts Panel */}
          <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-amber-500" />
              Quick-Start AI Templates
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleQuickPrompt("Compare Swahili and Yoruba noun classes. Highlight deep grammatical structures.", "thinking")}
                className="flex items-start text-left gap-2 p-2 rounded-lg bg-[#0F172A]/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800 transition-all group"
              >
                <Brain className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-300 group-hover:text-amber-400">Yoruba vs Swahili Grammars</p>
                  <p className="text-[10px] text-slate-400">Deep Reasoning Thinking Mode</p>
                </div>
              </button>

              <button
                onClick={() => handleQuickPrompt("Translate 'Safe travels on your journey home!' into Swahili, Zulu, Xhosa, and Igbo.", "low-latency")}
                className="flex items-start text-left gap-2 p-2 rounded-lg bg-[#0F172A]/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800 transition-all group"
              >
                <Zap className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-300 group-hover:text-amber-400">Multi-Lang Greeting</p>
                  <p className="text-[10px] text-slate-400">Low-Latency Fast Responses</p>
                </div>
              </button>

              <button
                onClick={() => handleQuickPrompt("Tell me the most recent trends and news about mobile banking and M-Pesa in East Africa in 2026.", "search-grounding")}
                className="flex items-start text-left gap-2 p-2 rounded-lg bg-[#0F172A]/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800 transition-all group"
              >
                <Search className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-300 group-hover:text-amber-400">East African FinTech 2026</p>
                  <p className="text-[10px] text-slate-400">Google Search Grounding Mode</p>
                </div>
              </button>

              <button
                onClick={() => handleQuickPrompt("Find 3 top-rated cultural centers, markets, or art galleries in this local region.", "maps-grounding")}
                className="flex items-start text-left gap-2 p-2 rounded-lg bg-[#0F172A]/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800 transition-all group"
              >
                <MapPin className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-300 group-hover:text-amber-400">Explore Local Culture Markets</p>
                  <p className="text-[10px] text-slate-400">Google Maps Grounding Mode</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Output & Grounding References */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* AI Response Output Block */}
          <div className="rounded-2xl border border-slate-800 bg-[#1E293B] flex flex-col flex-1 overflow-hidden min-h-[350px]">
            {/* Header */}
            <div className="bg-[#151C2C] px-4 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                <span className="font-sans text-xs font-bold text-slate-300">Generated AI Response</span>
              </div>
              {response && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white transition-all bg-slate-800 border border-slate-700 px-2 py-1 rounded-md"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-5 flex-1 overflow-auto bg-[#0F172A]/80 font-sans text-sm leading-relaxed text-slate-200 select-text">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  <div className="space-y-1">
                    <p className="font-mono text-xs text-amber-500 font-semibold uppercase animate-pulse">Running {mode} engine...</p>
                    <p className="text-[11px] text-slate-500">Retrieving intelligence, applying system-level parameters...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-300 flex gap-2.5">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-rose-200">Execution Error</p>
                    <p className="mt-1 leading-normal">{error}</p>
                  </div>
                </div>
              ) : response ? (
                <div className="space-y-4">
                  {/* Text Output */}
                  <div className="whitespace-pre-wrap leading-relaxed">{response.text}</div>
                  
                  {/* Model tag */}
                  <div className="pt-4 border-t border-slate-800 flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                    <span>Engine signature:</span>
                    <span className="text-amber-500 font-bold bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded">{response.modelUsed}</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-16 px-4 space-y-3">
                  <Cpu className="h-8 w-8 text-slate-800" />
                  <div>
                    <p className="font-semibold text-slate-400 text-xs">No query executed yet</p>
                    <p className="max-w-[250px] leading-relaxed text-[11px] text-slate-500 mt-1">
                      Choose an AI core mode, write your query on the left pane, and click "Execute AI Query" to start!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grounding & Sourcing References panel */}
          {response && (webGroundings.length > 0 || mapsGroundings.length > 0) && (
            <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <Compass className="h-4.5 w-4.5 text-sky-400" />
                <h4 className="text-xs font-bold text-white">Active Grounding Sourcing References</h4>
              </div>

              {/* Web search sources */}
              {webGroundings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">Google Search Grounding Citations</p>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                    {webGroundings.map((chunk, idx) => (
                      <a
                        key={idx}
                        href={chunk.web?.uri}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition-all hover:bg-[#151C2C] group text-xs text-slate-300"
                      >
                        <div className="space-y-0.5 truncate flex-1">
                          <p className="font-bold text-slate-200 truncate group-hover:text-amber-400 transition-colors">
                            {chunk.web?.title || "Search Reference Source"}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 truncate">{chunk.web?.uri}</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 mt-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Maps groundings */}
              {mapsGroundings.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <MapPinned className="h-3.5 w-3.5" /> Google Maps Geolocation Citations
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                    {mapsGroundings.map((chunk, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-200">{chunk.maps?.title || "Location Source"}</p>
                          </div>
                          {chunk.maps?.uri && (
                            <a
                              href={chunk.maps.uri}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20"
                            >
                              Open in Maps <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>

                        {/* Review snippets */}
                        {chunk.maps?.placeAnswerSources?.reviewSnippets && chunk.maps.placeAnswerSources.reviewSnippets.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/60 space-y-1">
                            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">Review Highlights</p>
                            {chunk.maps.placeAnswerSources.reviewSnippets.map((snippet, sIdx) => (
                              <div key={sIdx} className="flex gap-1.5 text-[10px] text-slate-400 bg-slate-900/40 p-1.5 rounded border border-slate-850">
                                <CornerDownRight className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                                <p className="italic">"{snippet.text}"</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
