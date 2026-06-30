import React, { useState, useEffect } from "react";
import { History, BarChart3, Trash2, Calendar, Database, ShieldAlert, ArrowLeft, ArrowRight, Layers, MessageSquare, Code, RefreshCw } from "lucide-react";
import { TranslationHistory } from "../types";
import { LANG_MAP } from "../data/languages";

interface HistoryAnalyticsTabProps {
  token: string | null;
  onLoginPrompt: () => void;
}

export default function HistoryAnalyticsTab({ token, onLoginPrompt }: HistoryAnalyticsTabProps) {
  const [historyItems, setHistoryItems] = useState<TranslationHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sourceFilter, setSourceFilter] = useState("");
  const [targetLangFilter, setTargetLangFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Stats state
  const [stats, setStats] = useState<{
    api_calls: number;
    total_characters: number;
    total_history_records: number;
    languages: Record<string, number>;
    sources: Record<string, number>;
  } | null>(null);

  const fetchHistoryAndStats = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch paginated logs
      const queryParams = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (sourceFilter) queryParams.set("source", sourceFilter);
      if (targetLangFilter) queryParams.set("target_lang", targetLangFilter);

      const historyRes = await fetch(`/api/v1/history?${queryParams.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      if (historyRes.ok) {
        setHistoryItems(historyData.items);
        setTotal(historyData.total);
      }

      // 2. Fetch stats
      const statsRes = await fetch("/api/v1/auth/stats", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok) {
        setStats(statsData);
      }
    } catch (err) {
      console.error("Failed to fetch history or stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndStats();
  }, [token, page, sourceFilter, targetLangFilter]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/history/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        // Refresh
        fetchHistoryAndStats();
      }
    } catch (err) {
      console.error("Failed to delete record:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!token) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-[#1E293B] p-12 text-center flex flex-col items-center justify-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-sans font-bold text-white text-base">Authentication Required</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-normal">
            Translation history logs, usage metrics, and webhook audit trails are restricted to authenticated developer credentials.
          </p>
        </div>
        <button
          type="button"
          onClick={onLoginPrompt}
          className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
        >
          Sign In to Developer Console
        </button>
      </div>
    );
  }

  // Pre-calculate language graph data
  const languageStatsList = stats && stats.languages 
    ? (Object.entries(stats.languages) as [string, number][]).sort((a, b) => b[1] - a[1])
    : [];

  const sourceStatsList = stats && stats.sources
    ? (Object.entries(stats.sources) as [string, number][]).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="space-y-8">
      {/* Analytics Dashboard Grid */}
      {stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Stat Cards */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            <div className="col-span-2 rounded-2xl border border-slate-800 bg-[#1E293B] p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">API Usage (Total Calls)</span>
                <span className="font-sans font-extrabold text-2xl text-white leading-none">
                  {stats.api_calls}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">Quota count since setup</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Database className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Volume Trans</span>
              <span className="font-sans font-extrabold text-xl text-white mt-2 block">
                {stats.total_characters >= 1000 ? `${(stats.total_characters / 1000).toFixed(1)}k` : stats.total_characters}
              </span>
              <span className="text-[9px] text-slate-400 font-mono mt-1">Characters</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Webhook Logs</span>
              <span className="font-sans font-extrabold text-xl text-white mt-2 block">
                {sourceStatsList.filter(s => s[0] !== "api").reduce((sum, s) => sum + (s[1] as number), 0)}
              </span>
              <span className="text-[9px] text-slate-400 font-mono mt-1">Simulated delivery</span>
            </div>
          </div>

          {/* Languages Breakdown Visualizer */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#1E293B] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-slate-300">
                <BarChart3 className="h-4 w-4 text-amber-500" />
                <span className="font-sans font-semibold text-xs uppercase tracking-wider">Language Distribution</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Target codes</span>
            </div>

            <div className="space-y-3">
              {languageStatsList.length > 0 ? (
                languageStatsList.slice(0, 4).map(([langCode, count]) => {
                  const percentage = Math.round(((count as number) / stats.total_history_records) * 100) || 0;
                  const langName = LANG_MAP[langCode]?.name || langCode.toUpperCase();
                  return (
                    <div key={langCode} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-slate-300">{langName} ({langCode.toUpperCase()})</span>
                        <span className="text-slate-500">{count} calls ({percentage}%)</span>
                      </div>
                      <div className="h-2 w-full bg-[#0F172A] rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-center text-slate-500 py-6">
                  <span className="text-xs">No analytics logs recorded.</span>
                </div>
              )}
            </div>
          </div>

          {/* Source Breakdown Visualizer */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-[#1E293B] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Layers className="h-4 w-4 text-amber-500" />
                <span className="font-sans font-semibold text-xs uppercase tracking-wider">Inbound Channels</span>
              </div>
            </div>

            <div className="space-y-3">
              {sourceStatsList.length > 0 ? (
                sourceStatsList.map(([source, count]) => {
                  const percentage = Math.round(((count as number) / stats.total_history_records) * 100) || 0;
                  return (
                    <div key={source} className="flex items-center justify-between gap-4 text-xs font-mono">
                      <div className="flex items-center gap-1.5 capitalize text-slate-400">
                        {source === "api" ? (
                          <Code className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
                        )}
                        <span>{source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[#0F172A] h-1.5 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="h-full bg-amber-500 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="font-semibold text-slate-300">{count}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-center text-slate-500 py-6">
                  <span className="text-xs">No channel logs.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Audit Logs Table Panel */}
      <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-6 shadow-sm space-y-4">
        {/* Header and filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <History className="h-4 w-4" />
            </span>
            <span className="font-sans font-semibold text-white">API Transaction Audit Log</span>
            <button
              onClick={fetchHistoryAndStats}
              className="p-1 text-slate-500 hover:text-slate-300 hover:bg-[#0F172A] rounded-lg transition-all"
              title="Refresh logs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Log Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <label className="font-bold font-mono text-[10px] uppercase">Channel:</label>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-700 bg-[#0F172A] px-2 py-1 outline-none focus:border-amber-500 transition-all text-xs text-slate-200 cursor-pointer"
              >
                <option value="">All Channels</option>
                <option value="api">Sandbox (API)</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="signal">Signal / Custom</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <label className="font-bold font-mono text-[10px] uppercase">Target Language:</label>
              <select
                value={targetLangFilter}
                onChange={(e) => {
                  setTargetLangFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-700 bg-[#0F172A] px-2 py-1 outline-none focus:border-amber-500 transition-all text-xs text-slate-200 cursor-pointer"
              >
                <option value="">All Languages</option>
                <option value="en">English (en)</option>
                <option value="sw">Swahili (sw)</option>
                <option value="zu">Zulu (zu)</option>
                <option value="yo">Yoruba (yo)</option>
                <option value="ha">Hausa (ha)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit list */}
        <div className="space-y-4">
          {historyItems.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {historyItems.map((item) => {
                const srcName = LANG_MAP[item.source_lang_code]?.name || item.source_lang_code.toUpperCase();
                const tgtName = LANG_MAP[item.target_lang_code]?.name || item.target_lang_code.toUpperCase();

                return (
                  <div key={item.id} className="py-4 flex flex-col md:flex-row items-start justify-between gap-4 group">
                    <div className="space-y-2 flex-1">
                      {/* Meta stats bar */}
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-500">
                        <span className={`font-semibold px-2 py-0.5 rounded-full border ${
                          item.source === "api"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : item.source === "whatsapp"
                            ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        }`}>
                          {item.source.toUpperCase()}
                        </span>
                        <span className="font-semibold text-slate-300">
                          {srcName} ({item.source_lang_code.toUpperCase()}) → {tgtName} ({item.target_lang_code.toUpperCase()})
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-600" />
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                        <span>{item.character_count} chars</span>
                        {item.confidence && (
                          <span>{(item.confidence * 100).toFixed(0)}% confidence</span>
                        )}
                        {item.message_id && (
                          <span className="bg-[#0F172A] border border-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold">MSG_ID: {item.message_id}</span>
                        )}
                      </div>

                      {/* Content panel */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-[#0F172A] p-3">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Original Text</span>
                          <p className="text-xs text-slate-300 font-sans leading-relaxed">{item.source_text}</p>
                        </div>
                        <div className="space-y-0.5 md:border-l md:border-slate-800 md:pl-4">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Translated Text</span>
                          <p className="text-xs text-white font-sans leading-relaxed font-semibold">{item.translated_text}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions panel */}
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100 md:opacity-100"
                      title="Delete record from server database"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <History className="h-8 w-8 mx-auto text-slate-600" />
              <p className="text-xs font-sans">No audit transaction history items match the filters.</p>
            </div>
          )}

          {/* Pagination controls */}
          {total > pageSize && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs font-mono">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-1.5 text-slate-300 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Previous Page
              </button>
              <span className="text-slate-400">
                Page <strong>{page}</strong> of <strong>{Math.ceil(total / pageSize)}</strong> (Total {total} logs)
              </span>
              <button
                type="button"
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage(p => p + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-1.5 text-slate-300 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40"
              >
                Next Page <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
