import React, { useState, useEffect } from "react";
import { MessageSquare, Play, Send, Check, Code, ShieldAlert, CornerDownRight, Smartphone, RefreshCw } from "lucide-react";

const WHATSAPP_TEMPLATE = `{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "847293749",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": { "display_phone_number": "254712345678" },
            "messages": [
              {
                "from": "254712345678",
                "id": "ABGGFl9A439A",
                "timestamp": "1719736800",
                "text": { "body": "Mambo vipi mkuu! Tunahitaji msaada sasa hivi." },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}`;

const TELEGRAM_TEMPLATE = `{
  "update_id": 29384729,
  "message": {
    "message_id": 1823,
    "from": { "id": 9872342, "is_bot": false, "first_name": "Kofi" },
    "chat": { "id": 9872342, "type": "private" },
    "date": 1719736800,
    "text": "Sannu aboki! Ina kwana?"
  }
}`;

const GENERIC_TEMPLATE = `{
  "message_id": "cust_msg_84729",
  "platform": "signal",
  "text": "Sawubona! Ngiyakwamukela emtholampilo omusha.",
  "source_lang": "auto",
  "target_lang": "en",
  "metadata": {
    "sender_device": "Android-v14",
    "encrypted": true
  }
}`;

export default function WebhookPlaygroundTab() {
  const [platform, setPlatform] = useState<"whatsapp" | "telegram" | "generic">("whatsapp");
  const [targetLang, setTargetLang] = useState("en");
  const [jsonPayload, setJsonPayload] = useState(WHATSAPP_TEMPLATE);
  const [loading, setLoading] = useState(false);
  const [responseCode, setResponseCode] = useState<number | null>(null);
  const [responsePayload, setResponsePayload] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (platform === "whatsapp") {
      setJsonPayload(WHATSAPP_TEMPLATE);
    } else if (platform === "telegram") {
      setJsonPayload(TELEGRAM_TEMPLATE);
    } else {
      setJsonPayload(GENERIC_TEMPLATE);
    }
    setResponseCode(null);
    setResponsePayload(null);
    setError("");
  }, [platform]);

  const handleReset = () => {
    if (platform === "whatsapp") setJsonPayload(WHATSAPP_TEMPLATE);
    else if (platform === "telegram") setJsonPayload(TELEGRAM_TEMPLATE);
    else setJsonPayload(GENERIC_TEMPLATE);
    setResponseCode(null);
    setResponsePayload(null);
    setError("");
  };

  const handleDeliver = async () => {
    setLoading(true);
    setError("");
    setResponseCode(null);
    setResponsePayload(null);

    let parsedBody;
    try {
      parsedBody = JSON.parse(jsonPayload);
    } catch (e: any) {
      setError(`Invalid JSON payload syntax: ${e.message}`);
      setLoading(false);
      return;
    }

    const queryParam = platform !== "generic" ? `?target_lang=${targetLang}` : "";
    const endpoint = `/api/v1/webhook/${platform}${queryParam}`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedBody),
      });

      setResponseCode(res.status);
      
      const contentType = res.headers.get("content-type");
      const text = await res.text();

      if (contentType && contentType.includes("application/json")) {
        try {
          const data = JSON.parse(text);
          setResponsePayload(JSON.stringify(data, null, 2));
        } catch (jsonErr: any) {
          setError(`Invalid JSON response from server: ${jsonErr.message}`);
          setResponsePayload(text);
        }
      } else {
        // Response is HTML or plain text (e.g. 404, 502, 503, or 504 error page)
        if (text.includes("<!DOCTYPE html>") || text.includes("<html") || text.includes("<body")) {
          const match = text.match(/<title>(.*?)<\/title>/i);
          const pageTitle = match && match[1] ? match[1].trim() : "HTML Error Page";
          setError(`Server returned HTML: "${pageTitle}" (Status ${res.status}). The webhook endpoint might not be matching or the backend could be offline.`);
        } else {
          setError(`Server returned non-JSON response (Status ${res.status}): ${text.slice(0, 300)}`);
        }
        setResponsePayload(text);
      }
    } catch (err: any) {
      setError(err.message || "Failed to deliver webhook simulation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro info card */}
      <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <MessageSquare className="h-3.5 w-3.5" />
            </span>
            <span className="font-sans font-semibold text-white">Messaging Webhooks Playground</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Simulate incoming chats from active messaging bots. AfriTranslate parses raw JSON payloads from Meta, Telegram, or custom networks, performs real-time language detection, translates, and logs into your database.
          </p>
        </div>

        {/* Platform Picker */}
        <div className="flex gap-2 w-full md:w-auto">
          {(["whatsapp", "telegram", "generic"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`flex-1 md:flex-initial rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                platform === p
                  ? "bg-amber-500 border-amber-500 text-slate-950 shadow-sm"
                  : "bg-[#0F172A] border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor & Parameters */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-6 shadow-sm flex-1 flex flex-col space-y-4">
            {/* Options bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  HTTP Payload Editor ({platform})
                </span>
              </div>

              <div className="flex items-center gap-3">
                {platform !== "generic" && (
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Lang:</label>
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-[#0F172A] px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-amber-500 transition-all cursor-pointer"
                    >
                      <option value="en">English (EN)</option>
                      <option value="sw">Swahili (SW)</option>
                      <option value="zu">Zulu (ZU)</option>
                      <option value="yo">Yoruba (YO)</option>
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3 text-amber-500" />
                  Reset Template
                </button>
              </div>
            </div>

            {/* JSON Code Area */}
            <div className="flex-1 min-h-[300px] rounded-xl border border-slate-750 overflow-hidden bg-[#0F172A] focus-within:border-amber-500 transition-all">
              <textarea
                value={jsonPayload}
                onChange={(e) => setJsonPayload(e.target.value)}
                className="w-full h-full min-h-[300px] p-4 bg-transparent text-slate-200 outline-none resize-none leading-normal font-mono select-text"
                spellCheck={false}
              />
            </div>

            {/* Action Bar */}
            <button
              type="button"
              onClick={handleDeliver}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-400 active:bg-amber-600 transition-all shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  Dispatching Webhook Delivery...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Deliver Webhook Payload
                </>
              )}
            </button>
          </div>
        </div>

        {/* Webhook Response Log Column */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[400px]">
          <div className="rounded-2xl border border-slate-800 bg-[#1E293B] shadow-sm flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="bg-[#151C2C] px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-amber-500" />
                <span className="font-mono text-xs font-semibold text-slate-300">Target Webhook Response Logs</span>
              </div>
              {responseCode !== null && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                  responseCode === 200 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {responseCode} {responseCode === 200 ? "OK" : "ERROR"}
                </span>
              )}
            </div>

            {/* Response Area */}
            <div className="p-4 flex-1 font-mono text-xs text-slate-300 overflow-auto bg-[#0F172A] leading-normal select-text">
              {responsePayload ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Body Content:</span>
                    <pre className="text-emerald-400 overflow-auto whitespace-pre-wrap word-break-all">{responsePayload}</pre>
                  </div>
                  <div className="rounded-xl bg-[#151C2C]/50 p-3 border border-slate-800 text-slate-400 text-xs">
                    <p className="font-sans font-medium text-slate-200 flex items-center gap-1">
                      <Play className="h-3 w-3 text-emerald-400 fill-emerald-400" />
                      Platform Simulation Result
                    </p>
                    <p className="mt-1 font-sans text-slate-400 leading-normal text-[11px]">
                      The translation history records have been committed to the server. Visit the **Audit Logs & Stats** tab to see this translated message tracked as a live webhook transaction!
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-300 flex gap-2.5">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                  <div>
                    <p className="font-semibold text-rose-200">Delivery Failure</p>
                    <p className="mt-0.5 leading-relaxed">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-20 px-4 space-y-3">
                  <Play className="h-8 w-8 text-slate-700" />
                  <p className="max-w-[250px] leading-relaxed text-slate-400">
                    Webhook payload response is empty. Click the deliver button to dispatch a mocked incoming request.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
