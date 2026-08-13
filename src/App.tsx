import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Command,
  Copy,
  CreditCard,
  Database,
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

type View = "dashboard" | "playground" | "keys" | "models" | "languages" | "logs" | "usage" | "docs" | "routing" | "billing" | "webhooks" | "security";
type Theme = "dark" | "light" | "system";

type HistoryRecord = {
  id: number;
  source_text: string;
  translated_text: string;
  source_lang_code: string;
  target_lang_code: string;
  confidence: number;
  character_count: number;
  source: string;
  message_id: string | null;
  created_at: string;
};

type Stats = {
  api_calls: number;
  total_characters: number;
  total_history_records: number;
  languages: Record<string, number>;
  sources: Record<string, number>;
  success_rate: number;
  average_latency_ms: number;
  estimated_cost_usd: number;
  active_api_keys: number;
};

type ApiKeyRecord = {
  id: number;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  requests: number;
  status: "active" | "revoked";
  permissions: string[];
  environment: "production" | "development" | "test";
};

const emptyStats: Stats = {
  api_calls: 0,
  total_characters: 0,
  total_history_records: 0,
  languages: {},
  sources: {},
  success_rate: 100,
  average_latency_ms: 0,
  estimated_cost_usd: 0,
  active_api_keys: 0
};

const navGroups = [
  { label: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "docs", label: "Getting Started", icon: BookOpen }] },
  { label: "APIs", items: [{ id: "playground", label: "API Playground", icon: Terminal }, { id: "keys", label: "API Keys", icon: Key }, { id: "models", label: "Models", icon: Database }, { id: "routing", label: "Routing", icon: Route }, { id: "webhooks", label: "Webhooks", icon: Webhook }] },
  { label: "Languages", items: [{ id: "languages", label: "Languages", icon: Languages }] },
  { label: "Observability", items: [{ id: "usage", label: "Usage", icon: BarChart3 }, { id: "logs", label: "Logs", icon: Activity }] },
  { label: "Account", items: [{ id: "billing", label: "Billing", icon: CreditCard }, { id: "security", label: "Security", icon: Shield }] }
] as const;

const modelCatalog = [
  { name: "AfriTranslate Core", provider: "AfriTranslate", availability: "Production", speed: "Low latency", cost: "Standard", pairs: "Core translation pairs", tags: ["Recommended", "Production"] },
  { name: "AfriTranslate Advanced", provider: "AfriTranslate", availability: "Preview", speed: "Quality optimized", cost: "Premium", pairs: "Low-resource language optimization", tags: ["High Quality", "Preview"] },
  { name: "Speech Bridge", provider: "AfriTranslate", availability: "Preview", speed: "Streaming", cost: "Usage based", pairs: "STT → MT → TTS", tags: ["Speech", "Preview"] }
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function apiFetch<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.detail || `${response.status} ${response.statusText}`);
  }
  return data as T;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function LogoMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-400 to-orange-600 text-slate-950">
      <Network className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}

function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button {...props} className={cx("inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-50", variant === "primary" && "bg-amber-500 text-slate-950 hover:bg-amber-400", variant === "secondary" && "border border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-600 hover:bg-slate-800", variant === "ghost" && "text-slate-400 hover:bg-slate-900 hover:text-slate-100", className)}>
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string; key?: React.Key }) {
  return <section className={cx("rounded-2xl border border-slate-800/80 bg-slate-950/55 p-5 shadow-sm", className)}>{children}</section>;
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-amber-400" />
      <h3 className="mt-3 font-bold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function StatusPill() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      All systems operational
    </span>
  );
}

function Sidebar({ activeView, setActiveView, collapsed, setCollapsed }: { activeView: View; setActiveView: (view: View) => void; collapsed: boolean; setCollapsed: (value: boolean) => void }) {
  return (
    <aside className={cx("hidden border-r border-slate-800/80 bg-slate-950/90 transition-all duration-200 lg:flex lg:flex-col", collapsed ? "lg:w-20" : "lg:w-72")}>
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-4">
        <LogoMark />
        {!collapsed && <div><p className="font-black text-white">AfriTranslate</p><p className="text-[11px] text-slate-500">African language infrastructure</p></div>}
        <Button variant="ghost" aria-label="Collapse sidebar" onClick={() => setCollapsed(!collapsed)} className="ml-auto p-2">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <div className="p-3">
        <label className="sr-only" htmlFor="sidebar-search">Search navigation</label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input id="sidebar-search" placeholder={collapsed ? "" : "Search"} className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-amber-500" />
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4" aria-label="Primary navigation">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">{group.label}</p>}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const selected = activeView === item.id;
                return (
                  <button key={item.id} title={collapsed ? item.label : undefined} onClick={() => setActiveView(item.id as View)} className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400", selected ? "bg-amber-500/12 text-amber-300 ring-1 ring-amber-500/20" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100", collapsed && "justify-center")}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function Topbar({ user, theme, setTheme, onLogout, onCommand, setActiveView }: { user: AuthResponse["user"]; theme: Theme; setTheme: (theme: Theme) => void; onLogout: () => void; onCommand: () => void; setActiveView: (view: View) => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-3 lg:hidden"><LogoMark /><Menu className="h-5 w-5 text-slate-400" /></div>
        <button className="hidden min-w-48 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-left text-sm text-slate-200 lg:block">Personal / Production</button>
        <button onClick={onCommand} className="flex max-w-2xl flex-1 items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-left text-sm text-slate-500 hover:border-slate-700">
          <Search className="h-4 w-4" /><span>Search docs, logs, models, languages...</span><span className="ml-auto hidden rounded-md border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] sm:inline">⌘K</span>
        </button>
        <StatusPill />
        <Button variant="ghost" onClick={() => setActiveView("docs")}><BookOpen className="h-4 w-4" /><span className="hidden xl:inline">Docs</span></Button>
        <Button variant="ghost" aria-label="Notifications"><Bell className="h-4 w-4" /></Button>
        <Button variant="ghost" aria-label="Help"><HelpCircle className="h-4 w-4" /></Button>
        <select value={theme} onChange={(event) => setTheme(event.target.value as Theme)} className="rounded-xl border border-slate-800 bg-slate-900 px-2 py-2 text-xs text-slate-300 outline-none focus:border-amber-500" aria-label="Theme">
          <option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option>
        </select>
        <div className="flex items-center gap-2">
          <div className="hidden text-right md:block"><p className="text-xs font-bold text-white">{user.username}</p><p className="text-[10px] text-slate-500">{user.api_calls} calls</p></div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-sm font-black uppercase text-amber-300">{user.username.slice(0, 2)}</div>
          <Button variant="ghost" onClick={onLogout} aria-label="Log out"><LogOut className="h-4 w-4" /></Button>
        </div>
      </div>
    </header>
  );
}

function CommandPalette({ open, onClose, setActiveView }: { open: boolean; onClose: () => void; setActiveView: (view: View) => void }) {
  const commands = [["Create API Key", "keys", Key], ["Open Playground", "playground", Terminal], ["Search Documentation", "docs", BookOpen], ["View API Logs", "logs", Activity], ["View Usage", "usage", BarChart3], ["Create Webhook", "webhooks", Webhook], ["View Language Matrix", "languages", Languages], ["Open Billing", "billing", CreditCard]] as const;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 p-4 pt-24 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3"><Search className="h-5 w-5 text-slate-500" /><input autoFocus placeholder="Type a command or search..." className="flex-1 bg-transparent text-sm text-slate-100 outline-none" /><button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-900"><X className="h-4 w-4" /></button></div>
        <div className="p-2">{commands.map(([label, view, Icon]) => <button key={label} onClick={() => { setActiveView(view as View); onClose(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 hover:bg-slate-900"><Icon className="h-4 w-4 text-amber-400" /><span>{label}</span><span className="ml-auto text-xs text-slate-600">Enter</span></button>)}</div>
      </div>
    </div>
  );
}

function SignedOutExperience({ onOpenAuth }: { onOpenAuth: () => void }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_28%),#020617] text-slate-200">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6">
        <nav className="flex items-center justify-between"><div className="flex items-center gap-3"><LogoMark /><div><p className="font-black text-white">AfriTranslate</p><p className="text-xs text-slate-500">Developer API Dashboard</p></div></div><Button onClick={onOpenAuth}>Login / Sign up</Button></nav>
        <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <StatusPill />
            <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-white md:text-7xl">Build with African languages.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">One powerful API for translation, language detection, localization, speech, NLP, and multilingual AI across Africa.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button onClick={onOpenAuth} className="px-5 py-3"><Sparkles className="h-4 w-4" />Create your account</Button><Button variant="secondary" onClick={onOpenAuth} className="px-5 py-3"><Play className="h-4 w-4" />Sign in to console</Button></div>
          </div>
          <Card className="p-0">
            <div className="border-b border-slate-800 p-4"><div className="flex items-center gap-2 text-sm font-bold text-white"><Terminal className="h-4 w-4 text-amber-400" />Five-minute quickstart</div></div>
            <div className="space-y-4 p-5">{["Create an account", "Generate an API key", "Open the playground", "Send your first request", "Inspect usage and logs"].map((step, index) => <div key={step} className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-slate-950">{index + 1}</span><span className="text-sm text-slate-300">{step}</span></div>)}<pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300"><code>{`curl /api/v1/translate \\\n  -H "Authorization: Bearer $AFRITRANSLATE_API_KEY" \\\n  -d '{"source_lang":"en","target_lang":"zu","text":"Welcome to AfriTranslate."}'`}</code></pre></div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return <Card><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p></div><Gauge className="h-4 w-4 text-slate-500" /></div><p className="mt-4 text-xs text-slate-500">{subtext}</p></Card>;
}

function DashboardView({ user, stats, history, setActiveView }: { user: AuthResponse["user"]; stats: Stats; history: HistoryRecord[]; setActiveView: (view: View) => void }) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-[linear-gradient(135deg,rgba(245,158,11,0.13),rgba(15,23,42,0.55)_35%,rgba(2,6,23,0.85))] p-6">
        <StatusPill />
        <h1 className="mt-4 text-3xl font-black text-white md:text-4xl">Good morning, {user.username}</h1>
        <p className="mt-2 text-slate-400">Your African language API workspace is ready.</p>
        <div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => setActiveView("keys")}><Plus className="h-4 w-4" />Create API Key</Button><Button variant="secondary" onClick={() => setActiveView("playground")}><Terminal className="h-4 w-4" />Open Playground</Button></div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="API Requests" value={formatNumber(stats.api_calls)} subtext="Authenticated requests" />
        <MetricCard label="Characters" value={formatNumber(stats.total_characters)} subtext="Translated characters" />
        <MetricCard label="Success Rate" value={`${stats.success_rate.toFixed(2)}%`} subtext="Recorded API outcomes" />
        <MetricCard label="Avg Latency" value={`${stats.average_latency_ms} ms`} subtext="Measured request time" />
        <MetricCard label="Estimated Cost" value={`$${stats.estimated_cost_usd.toFixed(2)}`} subtext="Based on character usage" />
        <MetricCard label="API Keys" value={String(stats.active_api_keys)} subtext="Active credentials" />
      </div>
      <LiveActivity history={history} setActiveView={setActiveView} />
    </div>
  );
}

function LiveActivity({ history, setActiveView }: { history: HistoryRecord[]; setActiveView: (view: View) => void }) {
  const [query, setQuery] = useState("");
  const filtered = history.filter((item) => `${item.source_text} ${item.translated_text} ${item.source_lang_code} ${item.target_lang_code}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h2 className="font-bold text-white">API Activity</h2><span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">DATA-BACKED</span></div><p className="text-sm text-slate-500">Recent requests recorded by the AfriTranslate backend.</p></div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter requests" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
      {filtered.length === 0 ? <EmptyState title="No requests yet" description="Send a playground request to populate logs, metrics, and usage." action={<Button onClick={() => setActiveView("playground")}>Open Playground</Button>} /> : <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="text-xs uppercase text-slate-600"><tr><th className="p-3">Time</th><th className="p-3">Endpoint</th><th className="p-3">Pair</th><th className="p-3">Status</th><th className="p-3">Chars</th><th className="p-3">Source</th><th className="p-3">Request</th></tr></thead><tbody className="divide-y divide-slate-800">{filtered.map((item) => <tr key={item.id} className="hover:bg-slate-900/60"><td className="p-3 font-mono text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</td><td className="p-3 font-mono text-xs text-slate-200">/v1/translate</td><td className="p-3 text-slate-300">{item.source_lang_code} → {item.target_lang_code}</td><td className="p-3"><span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-300">200</span></td><td className="p-3 text-slate-300">{item.character_count.toLocaleString()}</td><td className="p-3 text-slate-300">{item.source}</td><td className="p-3"><button className="inline-flex items-center gap-1 font-mono text-xs text-amber-300"><Copy className="h-3 w-3" />req_{item.id}</button></td></tr>)}</tbody></table></div>}
    </Card>
  );
}

function PlaygroundView({ token, onRefresh }: { token: string | null; onRefresh: () => void }) {
  const [source, setSource] = useState("en");
  const [target, setTarget] = useState("zu");
  const [text, setText] = useState("Welcome to AfriTranslate.");
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const payload = useMemo(() => JSON.stringify({ source_lang: source, target_lang: target, text }, null, 2), [source, target, text]);
  const curl = `curl -X POST /api/v1/translate \\\n  -H "Authorization: Bearer ${token ?? "$AFRITRANSLATE_API_KEY"}" \\\n  -H "Content-Type: application/json" \\\n  -d '${payload.replace(/'/g, "'\\''")}'`;
  async function sendRequest() {
    setLoading(true); setError(""); setResponse(null);
    const started = performance.now();
    try {
      const data = await apiFetch<Record<string, unknown>>("/api/v1/translate", token, { method: "POST", body: JSON.stringify({ text, source_lang: source, target_lang: target }) });
      setResponse({ ...data, response_time_ms: Math.round(performance.now() - started) });
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed. Check the endpoint and payload, then try again.");
    } finally { setLoading(false); }
  }
  return (
    <div className="space-y-6"><div><h1 className="text-2xl font-black text-white">API Playground</h1><p className="text-slate-500">Configure, send, inspect, and copy production-ready requests.</p></div><div className="grid gap-6 xl:grid-cols-[0.8fr_1.1fr_1fr]"><Card><h2 className="font-bold text-white">Request configuration</h2><div className="mt-4 space-y-4"><label className="block text-xs font-bold uppercase text-slate-500">Source language<select value={source} onChange={(event) => setSource(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200">{AFRICAN_LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.name} ({language.code})</option>)}</select></label><label className="block text-xs font-bold uppercase text-slate-500">Target language<select value={target} onChange={(event) => setTarget(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200">{AFRICAN_LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.name} ({language.code})</option>)}</select></label></div></Card><Card><div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-white">Request editor</h2><Button variant="ghost" onClick={() => navigator.clipboard.writeText(payload)}><Copy className="h-4 w-4" />Copy</Button></div><textarea value={text} onChange={(event) => setText(event.target.value)} className="mb-3 min-h-28 w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-100 outline-none focus:border-amber-500" /><pre className="min-h-56 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300"><code>{payload}</code></pre><Button onClick={sendRequest} disabled={loading} className="mt-4 w-full"><Play className="h-4 w-4" />{loading ? "Sending..." : "Send Request"}</Button></Card><Card><h2 className="font-bold text-white">Response</h2>{error && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><p className="font-bold">Request failed</p><p className="mt-1">{error}</p></div>}{response ? <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300"><code>{JSON.stringify(response, null, 2)}</code></pre> : !error && <EmptyState title="No response yet" description="Send a request to inspect status, translation, confidence, and usage." />}<h3 className="mt-4 text-sm font-bold text-white">Generated cURL</h3><pre className="mt-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300"><code>{curl}</code></pre><Button variant="secondary" className="mt-3 w-full" onClick={() => navigator.clipboard.writeText(curl)}><Copy className="h-4 w-4" />Copy Code</Button></Card></div></div>
  );
}

function KeysView({ token, onRefreshStats }: { token: string | null; onRefreshStats: () => void }) {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const loadKeys = () => apiFetch<ApiKeyRecord[]>("/api/v1/api-keys", token).then(setKeys).catch((err) => setError(err.message));
  useEffect(loadKeys, [token]);
  async function createKey() { setError(""); const data = await apiFetch<{ key: ApiKeyRecord; secret: string }>("/api/v1/api-keys", token, { method: "POST", body: JSON.stringify({ name: "Production API Key", environment: "production", permissions: ["translation", "detection"] }) }); setSecret(data.secret); setKeys([data.key, ...keys]); onRefreshStats(); }
  return <div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black text-white">API Keys</h1><p className="text-slate-500">Create and manage credentials used to access AfriTranslate APIs.</p></div><Button onClick={createKey}><Plus className="h-4 w-4" />Create API Key</Button></div>{secret && <Card className="border-amber-500/30 bg-amber-500/5"><p className="font-bold text-amber-200">Copy your secret now. It will not be shown again.</p><div className="mt-2 flex gap-3"><code className="flex-1 truncate rounded-lg bg-slate-950 p-3 text-sm text-amber-100">{secret}</code><Button variant="secondary" onClick={() => navigator.clipboard.writeText(secret)}><Copy className="h-4 w-4" />Copy</Button></div></Card>}{error && <p className="text-sm text-rose-300">{error}</p>}{keys.length === 0 ? <EmptyState title="You don't have any API keys yet" description="Create your first key to start making authenticated requests." action={<Button onClick={createKey}>Create API Key</Button>} /> : <Card><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="text-xs uppercase text-slate-600"><tr><th className="p-3">Name</th><th className="p-3">Prefix</th><th className="p-3">Created</th><th className="p-3">Last used</th><th className="p-3">Requests</th><th className="p-3">Status</th><th className="p-3">Permissions</th></tr></thead><tbody className="divide-y divide-slate-800">{keys.map((key) => <tr key={key.id}><td className="p-3 font-semibold text-white">{key.name}<p className="text-xs text-slate-500">{key.environment}</p></td><td className="p-3 font-mono text-amber-300">{key.prefix}••••</td><td className="p-3 text-slate-400">{new Date(key.created_at).toLocaleDateString()}</td><td className="p-3 text-slate-400">{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "Never"}</td><td className="p-3 text-slate-300">{key.requests}</td><td className="p-3"><span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">{key.status}</span></td><td className="p-3 text-slate-400">{key.permissions.join(", ")}</td></tr>)}</tbody></table></div></Card>}</div>;
}

function ModelsView() { return <div className="space-y-6"><div><h1 className="text-2xl font-black text-white">Language Models</h1><p className="text-slate-500">Model catalog and routing targets configured for AfriTranslate APIs.</p></div><div className="grid gap-4 lg:grid-cols-3">{modelCatalog.map((model) => <Card key={model.name}><h2 className="font-bold text-white">{model.name}</h2><p className="text-sm text-slate-500">{model.provider} · {model.availability}</p><p className="mt-4 text-sm text-slate-300">{model.pairs}</p><div className="mt-4 flex flex-wrap gap-2">{model.tags.map((tag) => <span key={tag} className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">{tag}</span>)}</div></Card>)}</div></div>; }

function LanguagesView({ setActiveView }: { setActiveView: (view: View) => void }) { const [query, setQuery] = useState(""); const languages = AFRICAN_LANGUAGES.filter((language) => `${language.name} ${language.nativeName} ${language.region}`.toLowerCase().includes(query.toLowerCase())); return <div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-black text-white">Language Explorer</h1><p className="text-slate-500">Search supported languages and open any pair in the playground.</p></div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search languages or regions" className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-amber-500" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{languages.map((language) => <Card key={language.code}><h2 className="font-bold text-white">{language.name}</h2><p className="text-sm text-amber-300">{language.nativeName} · {language.code}</p><p className="mt-1 text-xs text-slate-500">{language.region}</p><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">Translation</span>{language.stt && <span className="rounded-full bg-sky-500/10 px-2 py-1 text-sky-300">Speech-to-text</span>}{language.tts && <span className="rounded-full bg-purple-500/10 px-2 py-1 text-purple-300">Text-to-speech</span>}</div><Button variant="secondary" className="mt-4 w-full" onClick={() => setActiveView("playground")}>Open in playground</Button></Card>)}</div></div>; }

function UsageView({ stats }: { stats: Stats }) { return <div className="space-y-6"><div><h1 className="text-2xl font-black text-white">Usage & Analytics</h1><p className="text-slate-500">Usage based on backend request history.</p></div><div className="grid gap-4 md:grid-cols-4"><MetricCard label="Requests" value={formatNumber(stats.api_calls)} subtext="Total authenticated calls" /><MetricCard label="Characters" value={formatNumber(stats.total_characters)} subtext="Billable translation units" /><MetricCard label="Error Rate" value={`${(100 - stats.success_rate).toFixed(2)}%`} subtext="Recorded failures" /><MetricCard label="Cost" value={`$${stats.estimated_cost_usd.toFixed(2)}`} subtext="Estimated from usage" /></div><Card><h2 className="font-bold text-white">Language distribution</h2>{Object.keys(stats.languages).length === 0 ? <EmptyState title="No language usage yet" description="Send requests to see language distribution charts." /> : <div className="mt-5 space-y-3">{Object.entries(stats.languages).map(([language, count]) => <div key={language}><div className="mb-1 flex justify-between text-sm"><span className="font-mono text-amber-300">{language}</span><span className="text-slate-400">{count}</span></div><div className="h-2 rounded-full bg-slate-900"><div className="h-2 rounded-full bg-amber-500" style={{ width: `${Math.max(8, (count / Math.max(...Object.values(stats.languages))) * 100)}%` }} /></div></div>)}</div>}</Card></div>; }

function DocsView({ setActiveView }: { setActiveView: (view: View) => void }) { return <div className="grid gap-6 lg:grid-cols-[260px_1fr]"><Card className="h-max"><nav className="space-y-1 text-sm" aria-label="Documentation">{["Introduction", "Quickstart", "Authentication", "Translation API", "Language Detection", "Speech", "Errors", "Rate Limits", "Webhooks", "SDKs", "API Reference"].map((item) => <button key={item} className="block w-full rounded-lg px-3 py-2 text-left text-slate-400 hover:bg-slate-900 hover:text-white">{item}</button>)}</nav></Card><Card><h1 className="text-3xl font-black text-white">Quickstart</h1><p className="mt-3 text-slate-400">Make your first AfriTranslate API request with secure bearer authentication and copyable examples.</p><pre className="mt-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300"><code>{`curl /api/v1/translate \\\n  -H "Authorization: Bearer $AFRITRANSLATE_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"source_lang":"en","target_lang":"zu","text":"Welcome to AfriTranslate."}'`}</code></pre><div className="mt-4 flex gap-3"><Button onClick={() => setActiveView("playground")}>Try it</Button><Button variant="secondary"><Copy className="h-4 w-4" />Copy code</Button></div></Card></div>; }

function RoutingView() { return <div className="space-y-6"><div><h1 className="text-2xl font-black text-white">Routing</h1><p className="text-slate-500">Production routing policy builder.</p></div><Card><div className="grid gap-4 lg:grid-cols-4">{["Lowest Cost", "Lowest Latency", "Highest Quality", "Balanced"].map((strategy) => <button key={strategy} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left"><p className="font-bold text-white">{strategy}</p><p className="mt-1 text-xs text-slate-500">Ready for backend policy integration</p></button>)}</div></Card></div>; }

function LogsView({ history, setActiveView }: { history: HistoryRecord[]; setActiveView: (view: View) => void }) { return <div className="space-y-6"><div><h1 className="text-2xl font-black text-white">Logs</h1><p className="text-slate-500">API request logs recorded by the backend.</p></div><LiveActivity history={history} setActiveView={setActiveView} />{history[0] && <Card><h2 className="font-bold text-white">Request Inspector</h2><pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300"><code>{JSON.stringify(history[0], null, 2)}</code></pre></Card>}</div>; }

function SimpleManagementView({ title, description, icon: Icon }: { title: string; description: string; icon: React.ElementType }) { return <div className="space-y-6"><div><h1 className="text-2xl font-black text-white">{title}</h1><p className="text-slate-500">{description}</p></div><Card><Icon className="h-5 w-5 text-amber-400" /><h2 className="mt-4 font-bold text-white">Ready for configuration</h2><p className="mt-2 text-sm text-slate-500">This section uses production-ready empty states instead of placeholder records. Connect the corresponding backend resource to populate it.</p></Card></div>; }

export default function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  const refreshDashboard = () => {
    if (!token) return;
    apiFetch<Stats>("/api/v1/auth/stats", token).then(setStats).catch(() => setStats(emptyStats));
    apiFetch<{ items: HistoryRecord[] }>("/api/v1/history?page_size=25", token).then((data) => setHistory(data.items)).catch(() => setHistory([]));
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("afritranslate_token");
    const storedUser = localStorage.getItem("afritranslate_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      apiFetch<AuthResponse["user"]>("/api/v1/auth/me", storedToken).then((data) => { setUser(data); localStorage.setItem("afritranslate_user", JSON.stringify(data)); }).catch(handleLogout);
    }
  }, []);

  useEffect(refreshDashboard, [token]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleAuthSuccess = (authData: AuthResponse) => {
    setToken(authData.access_token);
    setUser(authData.user);
    localStorage.setItem("afritranslate_token", authData.access_token);
    localStorage.setItem("afritranslate_user", JSON.stringify(authData.user));
    setActiveView("dashboard");
  };

  function handleLogout() {
    setToken(null); setUser(null); setStats(emptyStats); setHistory([]);
    localStorage.removeItem("afritranslate_token"); localStorage.removeItem("afritranslate_user");
  }

  if (!user) {
    return <><SignedOutExperience onOpenAuth={() => setAuthModalOpen(true)} /><AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onSuccess={handleAuthSuccess} /></>;
  }

  return (
    <div className={cx("min-h-screen bg-slate-950 text-slate-300 antialiased", theme === "light" && "bg-slate-100 text-slate-800")}>
      <div className="flex min-h-screen"><Sidebar activeView={activeView} setActiveView={setActiveView} collapsed={collapsed} setCollapsed={setCollapsed} /><div className="flex min-w-0 flex-1 flex-col"><Topbar user={user} theme={theme} setTheme={setTheme} onLogout={handleLogout} onCommand={() => setCommandOpen(true)} setActiveView={setActiveView} /><main className="flex-1 p-4 lg:p-6">{activeView === "dashboard" && <DashboardView user={user} stats={stats} history={history} setActiveView={setActiveView} />}{activeView === "playground" && <PlaygroundView token={token} onRefresh={refreshDashboard} />}{activeView === "keys" && <KeysView token={token} onRefreshStats={refreshDashboard} />}{activeView === "models" && <ModelsView />}{activeView === "languages" && <LanguagesView setActiveView={setActiveView} />}{activeView === "logs" && <LogsView history={history} setActiveView={setActiveView} />}{activeView === "usage" && <UsageView stats={stats} />}{activeView === "docs" && <DocsView setActiveView={setActiveView} />}{activeView === "routing" && <RoutingView />}{activeView === "billing" && <SimpleManagementView title="Billing" description="Transparent pricing, invoices, payment methods, spending limits, and usage alerts." icon={CreditCard} />}{activeView === "webhooks" && <SimpleManagementView title="Webhooks" description="Configure delivery events, inspect retries, and monitor success rates." icon={Webhook} />}{activeView === "security" && <SimpleManagementView title="Security" description="MFA, session management, IP restrictions, request signing, SSO, and audit logs." icon={Lock} />}</main></div></div>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} setActiveView={setActiveView} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onSuccess={handleAuthSuccess} />
    </div>
  );
}
