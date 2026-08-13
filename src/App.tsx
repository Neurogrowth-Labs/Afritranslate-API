import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Command,
  Copy,
  CreditCard,
  Database,
  FileCode2,
  Gauge,
  HelpCircle,
  Key,
  Languages,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Network,
  Play,
  Plus,
  Route,
  Search,
  Shield,
  Sparkles,
  Terminal,
  User as UserIcon,
  Webhook,
  X
} from "lucide-react";
import AuthModal from "./components/AuthModal";
import { AFRICAN_LANGUAGES } from "./data/languages";
import { AuthResponse } from "./types";

type Theme = "dark" | "light" | "system";
type View = "dashboard" | "playground" | "keys" | "models" | "languages" | "logs" | "usage" | "docs" | "routing" | "billing" | "webhooks" | "security";

type RequestLog = {
  id: string;
  time: string;
  method: string;
  endpoint: string;
  pair: string;
  status: number;
  latency: number;
  chars: number;
  key: string;
  region: string;
  cost: string;
};

const navGroups = [
  { label: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "docs", label: "Getting Started", icon: BookOpen }] },
  { label: "APIs", items: [{ id: "playground", label: "API Playground", icon: Terminal }, { id: "keys", label: "API Keys", icon: Key }, { id: "models", label: "Models", icon: Database }, { id: "routing", label: "Routing", icon: Route }, { id: "webhooks", label: "Webhooks", icon: Webhook }] },
  { label: "Languages", items: [{ id: "languages", label: "Languages", icon: Languages }] },
  { label: "Observability", items: [{ id: "usage", label: "Usage", icon: BarChart3 }, { id: "logs", label: "Logs", icon: Activity }] },
  { label: "Account", items: [{ id: "billing", label: "Billing", icon: CreditCard }, { id: "security", label: "Security", icon: Shield }] }
] as const;

const initialLogs: RequestLog[] = [
  { id: "req_01K2AFR7Z3", time: "12:48:31", method: "POST", endpoint: "/v1/translate", pair: "en → zu", status: 200, latency: 143, chars: 2481, key: "prod_web", region: "jnb1", cost: "$0.024" },
  { id: "req_01K2AFR6MJ", time: "12:47:58", method: "POST", endpoint: "/v1/detect", pair: "auto", status: 200, latency: 81, chars: 612, key: "support_bot", region: "lag1", cost: "$0.004" },
  { id: "req_01K2AFR4QP", time: "12:47:12", method: "POST", endpoint: "/v1/speech/translate", pair: "sw → en", status: 202, latency: 231, chars: 3912, key: "mobile_live", region: "nbo1", cost: "$0.041" },
  { id: "req_01K2AFR2TY", time: "12:46:44", method: "POST", endpoint: "/v1/translate", pair: "en → yo", status: 200, latency: 176, chars: 1204, key: "prod_web", region: "iad1", cost: "$0.012" }
];

const models = [
  { name: "AfriTranslate Core", provider: "AfriTranslate", score: "98", speed: "126ms", cost: "$0.45 / 1M chars", tags: ["Recommended", "Production", "Fast"], pairs: "24 languages · 182 pairs" },
  { name: "AfriTranslate Advanced", provider: "AfriTranslate", score: "99", speed: "214ms", cost: "$0.78 / 1M chars", tags: ["High Quality", "Fallback"], pairs: "Low-resource optimized" },
  { name: "Speech Bridge", provider: "AfriTranslate", score: "94", speed: "streaming", cost: "$0.006 / min", tags: ["Speech", "Beta"], pairs: "STT → MT → TTS" }
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function LogoMark() {
  return <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-400 to-orange-600 text-slate-950 shadow-[0_0_40px_rgba(245,158,11,0.18)]"><Network className="h-5 w-5" aria-hidden="true" /></div>;
}

function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return <button {...props} className={cx("inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-50", variant === "primary" && "bg-amber-500 text-slate-950 hover:bg-amber-400", variant === "secondary" && "border border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-600 hover:bg-slate-800", variant === "ghost" && "text-slate-400 hover:bg-slate-900 hover:text-slate-100", className)}>{children}</button>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string; key?: React.Key }) {
  return <section className={cx("rounded-2xl border border-slate-800/80 bg-slate-950/55 p-5 shadow-sm", className)}>{children}</section>;
}

function StatusPill({ status = "Operational" }: { status?: string }) {
  return <button className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300" aria-label={`API status: ${status}`}><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />{status}</button>;
}

function MetricCard({ label, value, delta, hint }: { label: string; value: string; delta: string; hint: string }) {
  return <Card className="group cursor-pointer hover:border-amber-500/30"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p></div><div title={hint} className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-500"><Gauge className="h-4 w-4" /></div></div><div className="mt-4 flex items-center justify-between"><span className="text-xs font-semibold text-emerald-300">{delta}</span><div className="flex h-8 items-end gap-1" aria-hidden="true">{[30, 44, 28, 54, 42, 64, 74].map((h, i) => <span key={i} className="w-1.5 rounded-full bg-amber-500/70" style={{ height: `${h}%` }} />)}</div></div></Card>;
}

function Sidebar({ activeView, setActiveView, collapsed, setCollapsed }: { activeView: View; setActiveView: (view: View) => void; collapsed: boolean; setCollapsed: (value: boolean) => void }) {
  return <aside className={cx("hidden border-r border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all duration-200 lg:flex lg:flex-col", collapsed ? "lg:w-20" : "lg:w-72")}>
    <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-4"><LogoMark />{!collapsed && <div><p className="font-black text-white">AfriTranslate</p><p className="text-[11px] text-slate-500">African language infrastructure</p></div>}<Button variant="ghost" aria-label="Collapse sidebar" onClick={() => setCollapsed(!collapsed)} className="ml-auto p-2">{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</Button></div>
    <div className="p-3"><label className="sr-only" htmlFor="sidebar-search">Search navigation</label><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input id="sidebar-search" placeholder={collapsed ? "" : "Search"} className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-amber-500" /></div></div>
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Primary navigation">{navGroups.map((group) => <div key={group.label}>{!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">{group.label}</p>}<div className="space-y-1">{group.items.map((item) => { const Icon = item.icon; const selected = activeView === item.id; return <button key={item.id} title={collapsed ? item.label : undefined} onClick={() => setActiveView(item.id as View)} className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400", selected ? "bg-amber-500/12 text-amber-300 ring-1 ring-amber-500/20" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100", collapsed && "justify-center")}><Icon className="h-4 w-4 shrink-0" />{!collapsed && item.label}</button>; })}</div></div>)}</nav>
  </aside>;
}

function Topbar({ user, theme, setTheme, onOpenAuth, onLogout, onCommand, setActiveView }: { user: AuthResponse["user"] | null; theme: Theme; setTheme: (theme: Theme) => void; onOpenAuth: () => void; onLogout: () => void; onCommand: () => void; setActiveView: (view: View) => void }) {
  return <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl"><div className="flex h-16 items-center gap-3 px-4 lg:px-6"><div className="flex items-center gap-3 lg:hidden"><LogoMark /><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-900" aria-label="Open mobile menu"><Menu className="h-5 w-5" /></button></div><button className="hidden min-w-48 items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 lg:flex"><span>Personal / Production</span><ChevronDown className="h-4 w-4 text-slate-500" /></button><button onClick={onCommand} className="flex max-w-2xl flex-1 items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-left text-sm text-slate-500 hover:border-slate-700"><Search className="h-4 w-4" /><span>Search docs, logs, models, languages...</span><span className="ml-auto hidden items-center gap-1 rounded-md border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:flex"><Command className="h-3 w-3" />K</span></button><StatusPill /><Button variant="ghost" onClick={() => setActiveView("docs")}><BookOpen className="h-4 w-4" /><span className="hidden xl:inline">Docs</span></Button><Button variant="ghost" aria-label="Notifications"><Bell className="h-4 w-4" /></Button><Button variant="ghost" aria-label="Help"><HelpCircle className="h-4 w-4" /></Button><select value={theme} onChange={(e) => setTheme(e.target.value as Theme)} className="rounded-xl border border-slate-800 bg-slate-900 px-2 py-2 text-xs text-slate-300 outline-none focus:border-amber-500" aria-label="Theme"><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select>{user ? <div className="flex items-center gap-2"><div className="hidden text-right md:block"><p className="text-xs font-bold text-white">{user.username}</p><p className="text-[10px] text-slate-500">{user.api_calls} calls</p></div><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-sm font-black uppercase text-amber-300">{user.username.slice(0, 2)}</div><Button variant="ghost" onClick={onLogout} aria-label="Log out"><LogOut className="h-4 w-4" /></Button></div> : <Button onClick={onOpenAuth}><UserIcon className="h-4 w-4" />Sign in</Button>}</div></header>;
}

function CommandPalette({ open, onClose, setActiveView }: { open: boolean; onClose: () => void; setActiveView: (view: View) => void }) {
  const commands = [
    ["Create API Key", "keys", Key], ["Open Playground", "playground", Terminal], ["Search Documentation", "docs", BookOpen], ["View API Logs", "logs", Activity], ["View Usage", "usage", BarChart3], ["Create Webhook", "webhooks", Webhook], ["View Language Matrix", "languages", Languages], ["Open Billing", "billing", CreditCard]
  ] as const;
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 p-4 pt-24 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"><div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3"><Search className="h-5 w-5 text-slate-500" /><input autoFocus placeholder="Type a command or search..." className="flex-1 bg-transparent text-sm text-slate-100 outline-none" /><button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-900"><X className="h-4 w-4" /></button></div><div className="p-2">{commands.map(([label, view, Icon]) => <button key={label} onClick={() => { setActiveView(view as View); onClose(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 hover:bg-slate-900"><Icon className="h-4 w-4 text-amber-400" /><span>{label}</span><span className="ml-auto text-xs text-slate-600">Enter</span></button>)}</div></div></div>;
}

function SignedOutExperience({ onOpenAuth }: { onOpenAuth: () => void }) {
  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_28%),#020617] text-slate-200"><div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6"><nav className="flex items-center justify-between"><div className="flex items-center gap-3"><LogoMark /><div><p className="font-black text-white">AfriTranslate</p><p className="text-xs text-slate-500">Developer API Dashboard</p></div></div><Button onClick={onOpenAuth}>Login / Sign up</Button></nav><section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]"><div><StatusPill /><h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-white md:text-7xl">Build with African languages.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">One powerful API dashboard for translation, detection, localization, speech, NLP, routing, billing, and real-time observability across Africa.</p><div className="mt-8 flex flex-wrap gap-3"><Button onClick={onOpenAuth} className="px-5 py-3"><Sparkles className="h-4 w-4" />Create your account</Button><Button variant="secondary" onClick={onOpenAuth} className="px-5 py-3"><Play className="h-4 w-4" />Open demo console</Button></div><div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm"><div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"><p className="text-2xl font-black text-white">24</p><p className="text-slate-500">Languages</p></div><div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"><p className="text-2xl font-black text-white">99.94%</p><p className="text-slate-500">Success</p></div><div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"><p className="text-2xl font-black text-white">182ms</p><p className="text-slate-500">Latency</p></div></div></div><Card className="relative overflow-hidden p-0"><div className="border-b border-slate-800 p-4"><div className="flex items-center gap-2 text-sm font-bold text-white"><Terminal className="h-4 w-4 text-amber-400" />Five-minute quickstart</div></div><div className="space-y-4 p-5">{["Create your project", "Generate API key", "Make your first request", "Explore supported languages", "Go to production"].map((step, index) => <div key={step} className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-slate-950">{index + 1}</span><span className="text-sm text-slate-300">{step}</span>{index < 2 && <Check className="ml-auto h-4 w-4 text-emerald-400" />}</div>)}<pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300"><code>{`curl https://api.afritranslate.com/v1/translate \\\n  -H "Authorization: Bearer $AFRITRANSLATE_API_KEY" \\\n  -d '{"source":"en","target":"zu","text":"Hello, Africa!"}'`}</code></pre></div></Card></section></div></main>;
}

function DashboardView({ user, setActiveView, logs, onCreateKey }: { user: AuthResponse["user"]; setActiveView: (view: View) => void; logs: RequestLog[]; onCreateKey: () => void }) {
  return <div className="space-y-6"><section className="overflow-hidden rounded-3xl border border-slate-800 bg-[linear-gradient(135deg,rgba(245,158,11,0.13),rgba(15,23,42,0.55)_35%,rgba(2,6,23,0.85))] p-6"><div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div><StatusPill status="All systems operational" /><h1 className="mt-4 text-3xl font-black text-white md:text-4xl">Good morning, {user.username}</h1><p className="mt-2 text-slate-400">Your African language APIs are operational. Latency, usage, cost, logs, and models are live.</p></div><div className="flex flex-wrap gap-3"><Button onClick={onCreateKey}><Plus className="h-4 w-4" />Create API Key</Button><Button variant="secondary" onClick={() => setActiveView("playground")}><Terminal className="h-4 w-4" />Open Playground</Button></div></div></section><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6"><MetricCard label="API Requests" value="1.28M" delta="+18.4%" hint="Requests vs previous period" /><MetricCard label="Translation Characters" value="42.8M" delta="+12.1%" hint="Billable characters" /><MetricCard label="Success Rate" value="99.94%" delta="+0.08%" hint="2xx responses" /><MetricCard label="Average Latency" value="182 ms" delta="-21 ms" hint="P95 326 ms" /><MetricCard label="Estimated Cost" value="$428.72" delta="+9.2%" hint="Month-to-date" /><MetricCard label="Active API Keys" value="8" delta="+2" hint="Production and test keys" /></div><div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><LiveActivity logs={logs} /><Card><h2 className="font-bold text-white">Onboarding progress</h2><p className="mt-1 text-sm text-slate-500">Make your first production request in under five minutes.</p><div className="mt-5 space-y-3">{["Project created", "API key generated", "Playground request sent", "Request inspected", "Billing limits configured"].map((step, index) => <div key={step} className="flex items-center gap-3"><span className={cx("h-2.5 w-2.5 rounded-full", index < 3 ? "bg-emerald-400" : "bg-slate-700")} /><span className="text-sm text-slate-300">{step}</span></div>)}</div><Button variant="secondary" className="mt-6 w-full" onClick={() => setActiveView("docs")}>View quickstart</Button></Card></div></div>;
}

function LiveActivity({ logs }: { logs: RequestLog[] }) {
  const [paused, setPaused] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = logs.filter((log) => `${log.endpoint} ${log.pair} ${log.id}`.toLowerCase().includes(query.toLowerCase()));
  return <Card><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h2 className="font-bold text-white">Live API Activity</h2><span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">LIVE</span></div><p className="text-sm text-slate-500">Streaming request activity across projects and regions.</p></div><div className="flex gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter requests" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-amber-500" /><Button variant="secondary" onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"}</Button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="text-xs uppercase text-slate-600"><tr><th className="p-3">Time</th><th className="p-3">Method</th><th className="p-3">Endpoint</th><th className="p-3">Pair</th><th className="p-3">Status</th><th className="p-3">Latency</th><th className="p-3">Chars</th><th className="p-3">Request ID</th></tr></thead><tbody className="divide-y divide-slate-800">{filtered.map((log) => <tr key={log.id} className="hover:bg-slate-900/60"><td className="p-3 font-mono text-xs text-slate-400">{log.time}</td><td className="p-3"><span className="rounded-md bg-sky-500/10 px-2 py-1 font-mono text-xs text-sky-300">{log.method}</span></td><td className="p-3 font-mono text-xs text-slate-200">{log.endpoint}</td><td className="p-3 text-slate-300">{log.pair}</td><td className="p-3"><span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-300">{log.status}</span></td><td className="p-3 text-slate-300">{log.latency}ms</td><td className="p-3 text-slate-300">{log.chars.toLocaleString()}</td><td className="p-3"><button className="inline-flex items-center gap-1 font-mono text-xs text-amber-300"><Copy className="h-3 w-3" />{log.id}</button></td></tr>)}</tbody></table></div></Card>;
}

function PlaygroundView({ token, onRequest }: { token: string | null; onRequest: (log: RequestLog) => void }) {
  const [source, setSource] = useState("en");
  const [target, setTarget] = useState("zu");
  const [text, setText] = useState("Welcome to AfriTranslate.");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const payload = useMemo(() => JSON.stringify({ source_lang: source, target_lang: target, text }, null, 2), [source, target, text]);
  const curl = `curl -X POST http://localhost:3000/api/v1/translate \\\n  -H "Authorization: Bearer ${token ?? "$AFRITRANSLATE_API_KEY"}" \\\n  -H "Content-Type: application/json" \\\n  -d '${payload.replace(/'/g, "'\\''")}'`;
  async function sendRequest() {
    const start = performance.now();
    setLoading(true);
    try {
      const res = await fetch("/api/v1/translate", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ text, source_lang: source, target_lang: target }) });
      const data = await res.json();
      const latency = Math.round(performance.now() - start);
      const requestId = `req_${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
      setResponse({ status: res.status, latency, requestId, ...data });
      onRequest({ id: requestId, time: new Date().toLocaleTimeString("en-GB"), method: "POST", endpoint: "/v1/translate", pair: `${source} → ${target}`, status: res.status, latency, chars: text.length, key: "playground", region: "local", cost: "$0.001" });
    } catch (error) {
      setResponse({ status: 400, error: error instanceof Error ? error.message : "Request failed", requestId: `req_${Date.now()}` });
    } finally { setLoading(false); }
  }
  return <div className="space-y-6"><div><h1 className="text-2xl font-black text-white">API Playground</h1><p className="text-slate-500">Configure, send, inspect, and copy production-ready examples from the current request.</p></div><div className="grid gap-6 xl:grid-cols-[0.8fr_1.1fr_1fr]"><Card><h2 className="font-bold text-white">Request configuration</h2><div className="mt-4 space-y-4"><label className="block text-xs font-bold uppercase text-slate-500">Endpoint<select className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200"><option>POST /v1/translate</option><option>POST /v1/detect</option><option>POST /v1/speech/translate</option></select></label><label className="block text-xs font-bold uppercase text-slate-500">Source language<select value={source} onChange={(e) => setSource(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200">{AFRICAN_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name} ({l.code})</option>)}</select></label><label className="block text-xs font-bold uppercase text-slate-500">Target language<select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200">{AFRICAN_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name} ({l.code})</option>)}</select></label><label className="block text-xs font-bold uppercase text-slate-500">Model<select className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200"><option>AfriTranslate Core</option><option>AfriTranslate Advanced</option></select></label></div></Card><Card><div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-white">Request editor</h2><div className="flex gap-2"><Button variant="ghost" onClick={() => navigator.clipboard.writeText(payload)}><Copy className="h-4 w-4" />Copy</Button><Button variant="ghost" onClick={() => setText("Welcome to AfriTranslate.")}>Reset</Button></div></div><textarea value={text} onChange={(e) => setText(e.target.value)} className="mb-3 min-h-28 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-100 outline-none focus:border-amber-500" /><pre className="min-h-64 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300"><code>{payload}</code></pre><Button onClick={sendRequest} disabled={loading} className="mt-4 w-full"><Play className="h-4 w-4" />{loading ? "Sending..." : "Send Request"}</Button></Card><Card><h2 className="font-bold text-white">Live response</h2>{response ? <div className="mt-4 space-y-4"><div className="grid grid-cols-3 gap-2 text-xs"><div className="rounded-xl bg-slate-900 p-3"><p className="text-slate-500">Status</p><p className="font-bold text-emerald-300">{response.status}</p></div><div className="rounded-xl bg-slate-900 p-3"><p className="text-slate-500">Latency</p><p className="font-bold text-white">{response.latency}ms</p></div><div className="rounded-xl bg-slate-900 p-3"><p className="text-slate-500">Request ID</p><p className="truncate font-mono text-amber-300">{response.requestId}</p></div></div><div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs uppercase text-slate-500">Translation</p><p className="mt-2 text-slate-100">{response.translated_text || response.text || response.error}</p></div><pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300"><code>{JSON.stringify(response, null, 2)}</code></pre></div> : <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">Send a request to inspect status, usage, confidence, metadata, and response body.</div>}<div className="mt-4"><h3 className="mb-2 text-sm font-bold text-white">Generated cURL</h3><pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300"><code>{curl}</code></pre><Button variant="secondary" className="mt-3 w-full" onClick={() => navigator.clipboard.writeText(curl)}><Copy className="h-4 w-4" />Copy Code</Button></div></Card></div></div>;
}

function KeysView() {
  const [keys, setKeys] = useState([{ name: "Production Web", prefix: "afri_live_7KQ", created: "Aug 13, 2026", last: "2 min ago", requests: "842k", status: "Active", env: "Production", permissions: "Translation, Detection" }, { name: "Mobile Dev", prefix: "afri_test_P9M", created: "Aug 9, 2026", last: "1 hour ago", requests: "12k", status: "Active", env: "Development", permissions: "Translation, Speech" }]);
  const [revealed, setRevealed] = useState<string | null>(null);
  function createKey() { const secret = `afri_live_${Math.random().toString(36).slice(2, 18)}`; setRevealed(secret); setKeys([{ name: "New Production Key", prefix: secret.slice(0, 13), created: "Just now", last: "Never", requests: "0", status: "Active", env: "Production", permissions: "Translation" }, ...keys]); }
  return <div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black text-white">API Keys</h1><p className="text-slate-500">Create and manage credentials used to access AfriTranslate APIs.</p></div><Button onClick={createKey}><Plus className="h-4 w-4" />Create API Key</Button></div>{revealed && <Card className="border-amber-500/30 bg-amber-500/5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-amber-200">Copy your secret now. It will not be shown again.</p><p className="font-mono text-sm text-amber-100">{revealed}</p></div><Button variant="secondary" onClick={() => navigator.clipboard.writeText(revealed)}><Copy className="h-4 w-4" />Copy secret</Button></div></Card>}<Card><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-xs uppercase text-slate-600"><tr><th className="p-3">Name</th><th className="p-3">Prefix</th><th className="p-3">Created</th><th className="p-3">Last used</th><th className="p-3">Requests</th><th className="p-3">Status</th><th className="p-3">Permissions</th><th className="p-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-800">{keys.map((key) => <tr key={key.prefix}><td className="p-3 font-semibold text-white">{key.name}<p className="text-xs text-slate-500">{key.env}</p></td><td className="p-3 font-mono text-amber-300">{key.prefix}••••</td><td className="p-3 text-slate-400">{key.created}</td><td className="p-3 text-slate-400">{key.last}</td><td className="p-3 text-slate-300">{key.requests}</td><td className="p-3"><span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">{key.status}</span></td><td className="p-3 text-slate-400">{key.permissions}</td><td className="p-3"><div className="flex gap-2"><Button variant="ghost">Rotate</Button><Button variant="ghost">Restrict</Button><Button variant="ghost">Revoke</Button></div></td></tr>)}</tbody></table></div></Card></div>;
}

function ModelsView() { return <div className="space-y-6"><div><h1 className="text-2xl font-black text-white">Language Models</h1><p className="text-slate-500">Discover translation, detection, speech, and routing models for African-language applications.</p></div><div className="grid gap-4 lg:grid-cols-3">{models.map((model) => <Card key={model.name} className="hover:border-amber-500/30"><div className="flex items-start justify-between"><div><h2 className="font-bold text-white">{model.name}</h2><p className="text-sm text-slate-500">{model.provider}</p></div><span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-300">{model.score}</span></div><p className="mt-4 text-sm text-slate-300">{model.pairs}</p><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-900 p-3"><p className="text-slate-500">Speed</p><p className="font-bold text-white">{model.speed}</p></div><div className="rounded-xl bg-slate-900 p-3"><p className="text-slate-500">Cost</p><p className="font-bold text-white">{model.cost}</p></div></div><div className="mt-4 flex flex-wrap gap-2">{model.tags.map((tag) => <span key={tag} className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">{tag}</span>)}</div></Card>)}</div></div>; }

function LanguagesView({ setActiveView }: { setActiveView: (view: View) => void }) { const [query, setQuery] = useState(""); const languages = AFRICAN_LANGUAGES.filter((l) => `${l.name} ${l.nativeName} ${l.region}`.toLowerCase().includes(query.toLowerCase())); return <div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-black text-white">Language Explorer</h1><p className="text-slate-500">Search capabilities, quality, availability, usage volume, and translation-pair readiness.</p></div><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search languages or regions" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-amber-500" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{languages.map((language, index) => <Card key={language.code}><div className="flex items-start justify-between"><div><h2 className="font-bold text-white">{language.name}</h2><p className="text-sm text-amber-300">{language.nativeName} · {language.code}</p></div><span className="rounded-lg bg-slate-900 px-2 py-1 text-xs text-slate-400">{language.region}</span></div><div className="mt-4 flex gap-2 text-xs"><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">Translation</span><span className="rounded-full bg-sky-500/10 px-2 py-1 text-sky-300">Detection</span>{language.tts && <span className="rounded-full bg-purple-500/10 px-2 py-1 text-purple-300">Speech</span>}</div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-900 p-3"><p className="text-slate-500">Quality</p><p className="font-bold text-white">{92 + (index % 7)}%</p></div><div className="rounded-xl bg-slate-900 p-3"><p className="text-slate-500">Usage</p><p className="font-bold text-white">{(index + 2) * 1.8}M</p></div></div><Button variant="secondary" className="mt-4 w-full" onClick={() => setActiveView("playground")}>Open in playground</Button></Card>)}</div><Card><h2 className="font-bold text-white">Language Pair Matrix</h2><div className="mt-4 overflow-x-auto"><table className="text-center text-xs"><thead><tr><th className="p-2 text-left text-slate-500">Source</th>{AFRICAN_LANGUAGES.slice(0, 8).map((l) => <th key={l.code} className="p-2 font-mono text-slate-500">{l.code}</th>)}</tr></thead><tbody>{AFRICAN_LANGUAGES.slice(0, 8).map((row, r) => <tr key={row.code}><td className="p-2 text-left font-mono text-slate-400">{row.code}</td>{AFRICAN_LANGUAGES.slice(0, 8).map((col, c) => <td key={col.code} title={`${row.code} → ${col.code}: ${r === c ? "same language" : "AfriTranslate Core · 180ms · $0.45/M"}`} className="p-2"><button onClick={() => setActiveView("playground")} className={cx("h-6 w-6 rounded-md", r === c ? "bg-slate-800" : (r + c) % 4 === 0 ? "bg-amber-500/50" : "bg-emerald-500/60")} aria-label={`${row.code} to ${col.code}`} /></td>)}</tr>)}</tbody></table></div></Card></div>; }

function LogsView({ logs }: { logs: RequestLog[] }) { return <div className="space-y-6"><div><h1 className="text-2xl font-black text-white">Logs</h1><p className="text-slate-500">Production-grade API log explorer with real-time streaming, filters, export, and request inspection.</p></div><LiveActivity logs={logs} /><Card><h2 className="font-bold text-white">Request Inspector</h2><div className="mt-4 grid gap-4 lg:grid-cols-3"><div className="rounded-xl bg-slate-900 p-4"><p className="text-xs text-slate-500">Overview</p><p className="mt-2 font-mono text-sm text-amber-300">{logs[0]?.id}</p><p className="text-sm text-slate-300">Status {logs[0]?.status} · {logs[0]?.latency}ms · {logs[0]?.region}</p></div><div className="rounded-xl bg-slate-900 p-4"><p className="text-xs text-slate-500">Usage</p><p className="mt-2 text-sm text-slate-300">{logs[0]?.chars.toLocaleString()} chars · {logs[0]?.cost}</p></div><div className="rounded-xl bg-slate-900 p-4"><p className="text-xs text-slate-500">Actions</p><div className="mt-2 flex flex-wrap gap-2"><Button variant="secondary"><Copy className="h-4 w-4" />Copy as cURL</Button><Button variant="secondary"><Play className="h-4 w-4" />Replay</Button></div></div></div></Card></div>; }

function UsageView() { return <div className="space-y-6"><div><h1 className="text-2xl font-black text-white">Usage & Analytics</h1><p className="text-slate-500">Requests, characters, cost, latency, endpoint usage, and language distribution.</p></div><div className="grid gap-4 md:grid-cols-4"><MetricCard label="Requests / day" value="84.2k" delta="+14%" hint="Daily volume" /><MetricCard label="Characters / day" value="2.9M" delta="+8%" hint="Daily billable chars" /><MetricCard label="Error Rate" value="0.06%" delta="-0.02%" hint="4xx and 5xx" /><MetricCard label="Credits" value="71%" delta="healthy" hint="Plan credits" /></div><Card><h2 className="font-bold text-white">Requests over time</h2><div className="mt-6 flex h-56 items-end gap-2 border-b border-slate-800 px-2" aria-label="Bar chart of requests over time">{Array.from({ length: 36 }).map((_, i) => <div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-300" style={{ height: `${24 + ((i * 17) % 70)}%` }} />)}</div></Card></div>; }

function DocsView({ setActiveView }: { setActiveView: (view: View) => void }) { return <div className="grid gap-6 lg:grid-cols-[260px_1fr]"><Card className="h-max"><nav className="space-y-1 text-sm" aria-label="Documentation"><p className="mb-3 text-xs font-bold uppercase text-slate-600">Documentation</p>{["Introduction", "Quickstart", "Authentication", "Translation API", "Language Detection", "Speech", "Errors", "Rate Limits", "Webhooks", "SDKs", "API Reference"].map((item) => <button key={item} className="block w-full rounded-lg px-3 py-2 text-left text-slate-400 hover:bg-slate-900 hover:text-white">{item}</button>)}</nav></Card><Card><h1 className="text-3xl font-black text-white">Quickstart</h1><p className="mt-3 text-slate-400">Make your first AfriTranslate API request with secure bearer authentication, production-friendly defaults, and copyable code examples.</p><div className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs uppercase text-slate-500">API endpoint</p><p className="mt-2 font-mono text-sm text-amber-300">https://api.afritranslate.com/v1</p></div><div className="rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs uppercase text-slate-500">Current version</p><p className="mt-2 text-sm text-white">v1 Stable · v2 Preview</p></div></div><pre className="mt-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300"><code>{`curl https://api.afritranslate.com/v1/translate \\\n  -H "Authorization: Bearer $AFRITRANSLATE_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"source":"en","target":"zu","text":"Hello, Africa!"}'`}</code></pre><div className="mt-4 flex gap-3"><Button onClick={() => setActiveView("playground")}>Try it</Button><Button variant="secondary"><Copy className="h-4 w-4" />Copy code</Button></div></Card></div>; }

function RoutingView() { return <div className="space-y-6"><div><h1 className="text-2xl font-black text-white">Routing</h1><p className="text-slate-500">Control how requests route between translation models, regions, fallbacks, and cost policies.</p></div><Card><div className="grid gap-4 lg:grid-cols-5">{["Lowest Cost", "Lowest Latency", "Highest Quality", "Balanced", "Automatic"].map((strategy, index) => <button key={strategy} className={cx("rounded-2xl border p-4 text-left", index === 4 ? "border-amber-500/40 bg-amber-500/10" : "border-slate-800 bg-slate-900")}><p className="font-bold text-white">{strategy}</p><p className="mt-1 text-xs text-slate-500">Production-safe strategy</p></button>)}</div></Card><Card><h2 className="font-bold text-white">Rule builder</h2><div className="mt-4 grid gap-4 lg:grid-cols-4"><div className="rounded-xl bg-slate-900 p-4"><p className="text-xs text-slate-500">IF</p><p className="mt-2 font-mono text-sm text-white">language_pair = en → zu</p></div><div className="rounded-xl bg-slate-900 p-4"><p className="text-xs text-slate-500">THEN</p><p className="mt-2 font-mono text-sm text-white">primary = AfriTranslate Core</p></div><div className="rounded-xl bg-slate-900 p-4"><p className="text-xs text-slate-500">FALLBACK</p><p className="mt-2 font-mono text-sm text-white">AfriTranslate Advanced</p></div><div className="rounded-xl bg-slate-900 p-4"><p className="text-xs text-slate-500">POLICY</p><p className="mt-2 font-mono text-sm text-white">timeout 2s · retry 2</p></div></div></Card></div>; }

function SimpleManagementView({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) { return <div className="space-y-6"><div><h1 className="text-2xl font-black text-white">{title}</h1><p className="text-slate-500">{description}</p></div><div className="grid gap-4 md:grid-cols-3"><Card><Icon className="h-5 w-5 text-amber-400" /><h2 className="mt-4 font-bold text-white">Configuration</h2><p className="mt-2 text-sm text-slate-500">Production-ready controls with granular permissions, usage limits, and audit trails.</p></Card><Card><Activity className="h-5 w-5 text-emerald-400" /><h2 className="mt-4 font-bold text-white">Real-time status</h2><p className="mt-2 text-sm text-slate-500">Operational telemetry, delivery success, alerts, and incident history.</p></Card><Card><FileCode2 className="h-5 w-5 text-sky-400" /><h2 className="mt-4 font-bold text-white">Developer actions</h2><p className="mt-2 text-sm text-slate-500">Copy, inspect, export, test, replay, rotate, and manage without support tickets.</p></Card></div></div>; }

export default function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [logs, setLogs] = useState<RequestLog[]>(initialLogs);

  useEffect(() => {
    const storedToken = localStorage.getItem("afritranslate_token");
    const storedUser = localStorage.getItem("afritranslate_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      fetch("/api/v1/auth/me", { headers: { Authorization: `Bearer ${storedToken}` } }).then((res) => {
        if (res.ok) return res.json();
        throw new Error("Session expired");
      }).then((data) => { setUser(data); localStorage.setItem("afritranslate_user", JSON.stringify(data)); }).catch(() => handleLogout());
    }
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => {
      const pairs = ["en → zu", "sw → en", "en → yo", "ha → en", "en → xh"];
      const endpoints = ["/v1/translate", "/v1/detect", "/v1/speech/translate"];
      setLogs((current) => [{ id: `req_${Math.random().toString(36).slice(2, 12).toUpperCase()}`, time: new Date().toLocaleTimeString("en-GB"), method: "POST", endpoint: endpoints[Math.floor(Math.random() * endpoints.length)], pair: pairs[Math.floor(Math.random() * pairs.length)], status: Math.random() > 0.04 ? 200 : 429, latency: 90 + Math.floor(Math.random() * 190), chars: 400 + Math.floor(Math.random() * 4200), key: "prod_web", region: ["lag1", "jnb1", "nbo1", "iad1"][Math.floor(Math.random() * 4)], cost: "$0.01" }, ...current].slice(0, 12));
    }, 5000);
    return () => window.clearInterval(interval);
  }, [user]);

  const handleAuthSuccess = (authData: AuthResponse) => {
    setToken(authData.access_token);
    setUser(authData.user);
    localStorage.setItem("afritranslate_token", authData.access_token);
    localStorage.setItem("afritranslate_user", JSON.stringify(authData.user));
    setActiveView("dashboard");
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("afritranslate_token");
    localStorage.removeItem("afritranslate_user");
  };

  if (!user) {
    return <><SignedOutExperience onOpenAuth={() => setAuthModalOpen(true)} /><AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onSuccess={handleAuthSuccess} /></>;
  }

  return <div className={cx("min-h-screen bg-slate-950 text-slate-300 antialiased", theme === "light" && "bg-slate-100 text-slate-800")}><div className="flex min-h-screen"><Sidebar activeView={activeView} setActiveView={setActiveView} collapsed={collapsed} setCollapsed={setCollapsed} /><div className="flex min-w-0 flex-1 flex-col"><Topbar user={user} theme={theme} setTheme={setTheme} onOpenAuth={() => setAuthModalOpen(true)} onLogout={handleLogout} onCommand={() => setCommandOpen(true)} setActiveView={setActiveView} /><main className="flex-1 p-4 lg:p-6">{activeView === "dashboard" && <DashboardView user={user} setActiveView={setActiveView} logs={logs} onCreateKey={() => setActiveView("keys")} />}{activeView === "playground" && <PlaygroundView token={token} onRequest={(log) => setLogs((current) => [log, ...current].slice(0, 12))} />}{activeView === "keys" && <KeysView />}{activeView === "models" && <ModelsView />}{activeView === "languages" && <LanguagesView setActiveView={setActiveView} />}{activeView === "logs" && <LogsView logs={logs} />}{activeView === "usage" && <UsageView />}{activeView === "docs" && <DocsView setActiveView={setActiveView} />}{activeView === "routing" && <RoutingView />}{activeView === "billing" && <SimpleManagementView title="Billing" description="Transparent pricing, invoices, payment methods, spending limits, and usage alerts." icon={CreditCard} />}{activeView === "webhooks" && <SimpleManagementView title="Webhooks" description="Configure delivery events, inspect retries, and monitor success rates." icon={Webhook} />}{activeView === "security" && <SimpleManagementView title="Security" description="MFA, session management, IP restrictions, request signing, SSO, and audit logs." icon={Lock} />}</main></div></div><CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} setActiveView={setActiveView} /><AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onSuccess={handleAuthSuccess} /></div>;
}
