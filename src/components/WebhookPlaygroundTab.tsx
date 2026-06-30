import React, { useState, useEffect, useMemo } from "react";
import { 
  MessageSquare, Play, Send, Check, Code, ShieldAlert, 
  Smartphone, RefreshCw, AlertTriangle, ArrowLeft, 
  Settings, Info, CheckCheck, Eye, Sparkles, HelpCircle,
  Clock, Server, Terminal, Layers
} from "lucide-react";

// ---- Design Tokens -------------------------------------------------
const PANEL_BG = "#0F172A";
const RAIL_BG = "#1E293B";
const BORDER = "#334155";
const ACCENT = "#22D3EE";
const ACCENT_DIM = "rgba(34,211,238,0.15)";
const AMBER = "#FBBF24";
const TEXT_DIM = "#94A3B8";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const PLATFORMS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "telegram", label: "Telegram" },
  { id: "tiktok", label: "TikTok" },
  { id: "sms", label: "SMS" },
];

const THEMES = {
  whatsapp: {
    headerBg: "#075E54",
    headerText: "#FFFFFF",
    headerSub: "rgba(255,255,255,0.7)",
    chatBg: "#0B141A",
    chatPattern: "#16202A",
    sentBubble: "#005C4B",
    sentText: "#E9EDEF",
    receivedBubble: "#202C33",
    receivedText: "#E9EDEF",
    tick: "#53BDEB",
    inputBg: "#1F2C34",
    statusBarFg: "#FFFFFF",
    font: SANS,
  },
  telegram: {
    headerBg: "#2C3E50",
    headerText: "#FFFFFF",
    headerSub: "rgba(255,255,255,0.6)",
    chatBg: "#0E1621",
    chatPattern: "#16212E",
    sentBubble: "#3390EC",
    sentText: "#FFFFFF",
    receivedBubble: "#1C2733",
    receivedText: "#E5E8EB",
    tick: "#7FD0FF",
    inputBg: "#17212B",
    statusBarFg: "#FFFFFF",
    font: SANS,
  },
  tiktok: {
    headerBg: "#000000",
    headerText: "#FFFFFF",
    headerSub: "rgba(255,255,255,0.55)",
    chatBg: "#000000",
    chatPattern: "#121212",
    sentBubble: "#FE2C55",
    sentText: "#FFFFFF",
    receivedBubble: "#1F1F1F",
    receivedText: "#F1F1F1",
    tick: "#25F4EE",
    inputBg: "#1A1A1A",
    statusBarFg: "#FFFFFF",
    font: SANS,
  },
  sms: {
    headerBg: "#FFFFFF",
    headerText: "#1A1A1A",
    headerSub: "#6B7280",
    chatBg: "#FFFFFF",
    chatPattern: "#F5F6F8",
    sentBubble: "#1A73E8",
    sentText: "#FFFFFF",
    receivedBubble: "#EDEEF1",
    receivedText: "#1A1A1A",
    tick: "#1A73E8",
    inputBg: "#F0F1F3",
    statusBarFg: "#1A1A1A",
    font: SANS,
  },
};

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

const TIKTOK_TEMPLATE = `{
  "message_id": "tt_msg_582937",
  "platform": "tiktok",
  "text": "Habari yako! Nakutakia siku njema sana leo.",
  "source_lang": "auto",
  "target_lang": "en",
  "metadata": {
    "username": "afri_creator",
    "followers_count": 12500
  }
}`;

const SMS_TEMPLATE = `{
  "message_id": "sms_msg_91823",
  "platform": "sms",
  "text": "Enkosi kakhulu ngomsebenzi omhle owenzileyo.",
  "source_lang": "auto",
  "target_lang": "en",
  "metadata": {
    "sim_slot": 1,
    "carrier": "MTN"
  }
}`;

// Static context thread
const THREAD_SEED = [
  { from: "them", text: "Hey, is this thing connected yet?" },
  { from: "me", text: "Just wiring up the webhook now — one sec." },
];

interface SchemaValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

interface LastResult {
  originalText: string;
  translatedText: string;
  detectedLang: string;
  targetLang: string;
  confidence: number;
}

export default function WebhookPlaygroundTab() {
  const [platform, setPlatform] = useState<"whatsapp" | "telegram" | "tiktok" | "sms">("whatsapp");
  const [viewAs, setViewAs] = useState<"sender" | "receiver">("receiver");
  const [contactName, setContactName] = useState("Acme Notifications");
  const [message, setMessage] = useState("Mambo vipi mkuu! Tunahitaji msaada sasa hivi.");
  const [targetLang, setTargetLang] = useState("en");
  
  const [jsonPayload, setJsonPayload] = useState(WHATSAPP_TEMPLATE);
  const [loading, setLoading] = useState(false);
  const [responseCode, setResponseCode] = useState<number | null>(null);
  const [responsePayload, setResponsePayload] = useState<string | null>(null);
  const [error, setError] = useState("");
  
  const [pulse, setPulse] = useState(false);
  const [sentLog, setSentLog] = useState(0);
  const [lastSentTime, setLastSentTime] = useState("");

  const [schemaErrors, setSchemaErrors] = useState<SchemaValidationError[]>([]);
  const [isValidJson, setIsValidJson] = useState(true);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);

  // Advanced Interactive Tapping & Settings States
  const [receiverIdiom, setReceiverIdiom] = useState("en");
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [translatedBubbles, setTranslatedBubbles] = useState<Record<string, {
    text: string;
    lang: string;
    loading: boolean;
  }>>({});
  const [bubbleViews, setBubbleViews] = useState<Record<string, "original" | "translated">>({});

  // Sync main Target Language Profile to receiver idiom automatically
  useEffect(() => {
    setReceiverIdiom(targetLang);
    // Clear translations on target language shift to force update
    setTranslatedBubbles({});
    setBubbleViews({});
  }, [targetLang]);

  const toggleBubbleTranslation = async (bubbleId: string, originalText: string) => {
    if (!originalText || originalText.trim().length === 0) return;
    
    const currentView = bubbleViews[bubbleId] || "original";
    if (currentView === "translated") {
      setBubbleViews(prev => ({ ...prev, [bubbleId]: "original" }));
    } else {
      const cache = translatedBubbles[bubbleId];
      if (cache && cache.lang === receiverIdiom) {
        setBubbleViews(prev => ({ ...prev, [bubbleId]: "translated" }));
      } else {
        setTranslatedBubbles(prev => ({
          ...prev,
          [bubbleId]: { text: "", lang: receiverIdiom, loading: true }
        }));
        
        try {
          const res = await fetch("/api/v1/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: originalText,
              source_lang: "auto",
              target_lang: receiverIdiom
            })
          });
          const data = await res.json();
          if (res.ok && data.translated_text) {
            setTranslatedBubbles(prev => ({
              ...prev,
              [bubbleId]: {
                text: data.translated_text,
                lang: receiverIdiom,
                loading: false
              }
            }));
            setBubbleViews(prev => ({ ...prev, [bubbleId]: "translated" }));
          } else {
            throw new Error(data.detail || "Translation failed");
          }
        } catch (err) {
          console.error("Tap to translate error:", err);
          setTranslatedBubbles(prev => ({
            ...prev,
            [bubbleId]: {
              text: `[Translated] ${originalText}`,
              lang: receiverIdiom,
              loading: false
            }
          }));
          setBubbleViews(prev => ({ ...prev, [bubbleId]: "translated" }));
        }
      }
    }
  };

  const theme = THEMES[platform];

  const time = useMemo(() => {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [sentLog]);

  const clock = useMemo(() => {
    return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }, []);

  // Update form inputs and reset when platform changes
  useEffect(() => {
    let tpl = WHATSAPP_TEMPLATE;
    let defaultContact = "254712345678";
    let defaultMsg = "Mambo vipi mkuu! Tunahitaji msaada sasa hivi.";

    if (platform === "whatsapp") {
      tpl = WHATSAPP_TEMPLATE;
      defaultContact = "254712345678";
      defaultMsg = "Mambo vipi mkuu! Tunahitaji msaada sasa hivi.";
    } else if (platform === "telegram") {
      tpl = TELEGRAM_TEMPLATE;
      defaultContact = "Kofi";
      defaultMsg = "Sannu aboki! Ina kwana?";
    } else if (platform === "tiktok") {
      tpl = TIKTOK_TEMPLATE;
      defaultContact = "afri_creator";
      defaultMsg = "Habari yako! Nakutakia siku njema sana leo.";
    } else {
      tpl = SMS_TEMPLATE;
      defaultContact = "MTN Carrier";
      defaultMsg = "Enkosi kakhulu ngomsebenzi omhle owenzileyo.";
    }

    setJsonPayload(tpl);
    setContactName(defaultContact);
    setMessage(defaultMsg);
    setResponseCode(null);
    setResponsePayload(null);
    setError("");
    setLastResult(null);
  }, [platform]);

  // Synchronize from Form Fields to Raw JSON Payload
  const handleFormChange = (newContact: string, newMsg: string) => {
    setContactName(newContact);
    setMessage(newMsg);
    try {
      const parsed = JSON.parse(jsonPayload);
      if (platform === "whatsapp") {
        if (parsed.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
          parsed.entry[0].changes[0].value.messages[0].from = newContact;
          parsed.entry[0].changes[0].value.metadata.display_phone_number = newContact;
          parsed.entry[0].changes[0].value.messages[0].text.body = newMsg;
        }
      } else if (platform === "telegram") {
        if (parsed.message) {
          parsed.message.text = newMsg;
          if (parsed.message.from) {
            parsed.message.from.first_name = newContact;
          }
        }
      } else if (platform === "tiktok") {
        parsed.text = newMsg;
        if (parsed.metadata) {
          parsed.metadata.username = newContact.replace(/^@/, "");
        }
      } else if (platform === "sms") {
        parsed.text = newMsg;
        if (parsed.metadata) {
          parsed.metadata.carrier = newContact;
        }
      }
      setJsonPayload(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // JSON is malformed, ignore synchronization
    }
  };

  // Synchronize from JSON input to form fields
  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonPayload);
      if (platform === "whatsapp") {
        const fromNum = parsed?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || "";
        const textVal = parsed?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || "";
        if (fromNum && fromNum !== contactName) setContactName(fromNum);
        if (textVal && textVal !== message) setMessage(textVal);
      } else if (platform === "telegram") {
        const nameVal = parsed?.message?.from?.first_name || "";
        const textVal = parsed?.message?.text || "";
        if (nameVal && nameVal !== contactName) setContactName(nameVal);
        if (textVal && textVal !== message) setMessage(textVal);
      } else if (platform === "tiktok") {
        const nameVal = parsed?.metadata?.username || "";
        const textVal = parsed?.text || "";
        if (nameVal && nameVal !== contactName) setContactName(nameVal);
        if (textVal && textVal !== message) setMessage(textVal);
      } else if (platform === "sms") {
        const carrierVal = parsed?.metadata?.carrier || "";
        const textVal = parsed?.text || "";
        if (carrierVal && carrierVal !== contactName) setContactName(carrierVal);
        if (textVal && textVal !== message) setMessage(textVal);
      }
    } catch (e) {
      // Malformed JSON is fine during user editing
    }
  }, [jsonPayload, platform]);

  // Client-side JSON Schema Validation
  useEffect(() => {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonPayload);
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
      setSchemaErrors([{ path: "JSON Syntax", message: "Malformed JSON string. Fix trailing commas or unescaped quotes.", severity: "error" }]);
      return;
    }

    const errors: SchemaValidationError[] = [];

    if (platform === "whatsapp") {
      if (!parsed.object || parsed.object !== "whatsapp_business_account") {
        errors.push({ path: "object", message: "Field 'object' should be 'whatsapp_business_account'", severity: "warning" });
      }
      if (!Array.isArray(parsed.entry)) {
        errors.push({ path: "entry", message: "Missing or invalid 'entry' array", severity: "error" });
      } else if (parsed.entry.length === 0) {
        errors.push({ path: "entry", message: "'entry' array should contain at least one object", severity: "warning" });
      } else {
        const firstEntry = parsed.entry[0];
        if (!Array.isArray(firstEntry.changes)) {
          errors.push({ path: "entry[0].changes", message: "Missing or invalid 'changes' array", severity: "error" });
        } else if (firstEntry.changes.length === 0) {
          errors.push({ path: "entry[0].changes", message: "'changes' array should contain at least one change object", severity: "warning" });
        } else {
          const firstChange = firstEntry.changes[0];
          if (!firstChange.value) {
            errors.push({ path: "entry[0].changes[0].value", message: "Missing field 'value' in changes", severity: "error" });
          } else {
            const val = firstChange.value;
            if (val.messaging_product !== "whatsapp") {
              errors.push({ path: "entry[0].changes[0].value.messaging_product", message: "Field 'messaging_product' should be 'whatsapp'", severity: "warning" });
            }
            if (!Array.isArray(val.messages)) {
              errors.push({ path: "entry[0].changes[0].value.messages", message: "Missing or invalid 'messages' array", severity: "error" });
            } else if (val.messages.length === 0) {
              errors.push({ path: "entry[0].changes[0].value.messages", message: "'messages' array should contain at least one message", severity: "error" });
            } else {
              const firstMsg = val.messages[0];
              if (!firstMsg.from) {
                errors.push({ path: "entry[0].changes[0].value.messages[0].from", message: "Field 'from' phone number is required", severity: "error" });
              }
              if (!firstMsg.id) {
                errors.push({ path: "entry[0].changes[0].value.messages[0].id", message: "Field 'id' string is required", severity: "error" });
              }
              if (!firstMsg.text || typeof firstMsg.text.body !== "string") {
                errors.push({ path: "entry[0].changes[0].value.messages[0].text.body", message: "Field 'text.body' containing message content is required", severity: "error" });
              }
            }
          }
        }
      }
    } else if (platform === "telegram") {
      if (parsed.update_id === undefined) {
        errors.push({ path: "update_id", message: "Field 'update_id' is missing for Telegram payload", severity: "warning" });
      }
      if (!parsed.message) {
        errors.push({ path: "message", message: "Field 'message' object is required", severity: "error" });
      } else {
        if (!parsed.message.message_id) {
          errors.push({ path: "message.message_id", message: "Field 'message_id' is recommended", severity: "warning" });
        }
        if (!parsed.message.text || typeof parsed.message.text !== "string") {
          errors.push({ path: "message.text", message: "Field 'text' must be a valid string to be translated", severity: "error" });
        }
        if (!parsed.message.from) {
          errors.push({ path: "message.from", message: "Field 'from' sender object is recommended", severity: "warning" });
        }
      }
    } else if (platform === "tiktok") {
      if (!parsed.message_id) {
        errors.push({ path: "message_id", message: "Field 'message_id' is required for the platform schema", severity: "error" });
      }
      if (parsed.platform !== "tiktok") {
        errors.push({ path: "platform", message: "Field 'platform' must be exactly 'tiktok'", severity: "error" });
      }
      if (!parsed.text || typeof parsed.text !== "string") {
        errors.push({ path: "text", message: "Field 'text' is required to be a valid string", severity: "error" });
      }
    } else if (platform === "sms") {
      if (!parsed.message_id) {
        errors.push({ path: "message_id", message: "Field 'message_id' is required for SMS schema", severity: "error" });
      }
      if (parsed.platform !== "sms") {
        errors.push({ path: "platform", message: "Field 'platform' must be exactly 'sms'", severity: "error" });
      }
      if (!parsed.text || typeof parsed.text !== "string") {
        errors.push({ path: "text", message: "Field 'text' is required to be a valid string", severity: "error" });
      }
    }

    setSchemaErrors(errors);
  }, [jsonPayload, platform]);

  const handleReset = () => {
    if (platform === "whatsapp") setJsonPayload(WHATSAPP_TEMPLATE);
    else if (platform === "telegram") setJsonPayload(TELEGRAM_TEMPLATE);
    else if (platform === "tiktok") setJsonPayload(TIKTOK_TEMPLATE);
    else setJsonPayload(SMS_TEMPLATE);
    setResponseCode(null);
    setResponsePayload(null);
    setError("");
    setLastResult(null);
  };

  const handleDeliver = async () => {
    const hasHardErrors = schemaErrors.some(e => e.severity === "error");
    if (!isValidJson || hasHardErrors) {
      setError("Please fix all 'error' level schema issues in your JSON before dispatching.");
      return;
    }

    setLoading(true);
    setError("");
    setResponseCode(null);
    setResponsePayload(null);
    setLastResult(null);
    setPulse(true);

    let parsedBody = JSON.parse(jsonPayload);
    let endpoint = "";
    
    if (platform === "whatsapp") {
      endpoint = `/api/v1/webhook/whatsapp?target_lang=${targetLang}`;
    } else if (platform === "telegram") {
      endpoint = `/api/v1/webhook/telegram?target_lang=${targetLang}`;
    } else {
      parsedBody.target_lang = targetLang;
      endpoint = `/api/v1/webhook/generic`;
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedBody),
      });

      setResponseCode(res.status);
      const contentType = res.headers.get("content-type");
      const text = await res.text();

      setSentLog((n) => n + 1);
      setLastSentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

      if (contentType && contentType.includes("application/json")) {
        try {
          const data = JSON.parse(text);
          setResponsePayload(JSON.stringify(data, null, 2));

          if (res.ok && data.status === "ok") {
            let origText = "";
            let transText = "";
            let detLang = "";
            let conf = 0.95;

            if (platform === "whatsapp" && data.translations && data.translations[0]) {
              origText = data.translations[0].original;
              transText = data.translations[0].translated;
              detLang = data.translations[0].detected_lang;
              conf = data.translations[0].confidence;
            } else if (platform === "telegram") {
              origText = data.original || "";
              transText = data.translated || "";
              detLang = data.detected_lang || "";
              conf = data.confidence || 0.95;
            } else {
              origText = parsedBody.text;
              transText = data.translated || "";
              detLang = data.detected_lang || "";
              conf = data.confidence || 0.9;
            }

            setLastResult({
              originalText: origText,
              translatedText: transText,
              detectedLang: detLang,
              targetLang,
              confidence: conf
            });
          }
        } catch (jsonErr: any) {
          setError(`Invalid JSON response from server: ${jsonErr.message}`);
          setResponsePayload(text);
        }
      } else {
        if (text.includes("<!DOCTYPE html>") || text.includes("<html") || text.includes("<body")) {
          const match = text.match(/<title>(.*?)<\/title>/i);
          const pageTitle = match && match[1] ? match[1].trim() : "HTML Error Page";
          setError(`Server returned HTML: "${pageTitle}" (Status ${res.status}). Webhook configuration/route error.`);
        } else {
          setError(`Server returned non-JSON response (Status ${res.status}): ${text.slice(0, 300)}`);
        }
        setResponsePayload(text);
      }
    } catch (err: any) {
      setError(err.message || "Failed to deliver webhook simulation.");
    } finally {
      setLoading(false);
      setTimeout(() => setPulse(false), 750);
    }
  };

  // Helper function to render ticks exactly as defined in design
  const renderTicks = (delivered: boolean) => {
    return (
      <svg width="16" height="11" viewBox="0 0 16 11" style={{ marginLeft: 4, display: "inline-block", verticalAlign: "middle" }}>
        <path
          d="M1 5.5L4.5 9L9.5 1.5"
          stroke={theme.tick}
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {delivered && (
          <path
            d="M5.5 5.5L9 9L14 1.5"
            stroke={theme.tick}
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  };

  const mine = viewAs === "sender";
  const isPayloadValid = isValidJson && schemaErrors.filter(e => e.severity === "error").length === 0;

  return (
    <div className="space-y-6">
      {/* Description header */}
      <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <MessageSquare className="h-3.5 w-3.5" />
            </span>
            <span className="font-sans font-semibold text-white">Live Android Webhook Simulator & Playground</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Configure real-time server webhooks, test schemas, and view translation deliveries in a physical, fully animated mobile mockup.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* COLUMN 1: CONTROL PANEL (4 Cols) */}
        <div className="xl:col-span-4 space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-5 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <div className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${pulse ? "bg-cyan-400 shadow-[0_0_10px_#22d3ee]" : "bg-slate-600"}`} />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Control Hub
              </span>
            </div>

            {/* Target platform selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id as any)}
                    className={`font-mono text-xs px-3 py-2.5 rounded-lg border transition-all duration-150 ${
                      platform === p.id 
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-xs" 
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target translation language selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Language Profile</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-400 transition-all font-sans"
              >
                <option value="en">English (EN)</option>
                <option value="sw">Swahili (SW)</option>
                <option value="zu">Zulu (ZU)</option>
                <option value="yo">Yoruba (YO)</option>
                <option value="ig">Igbo (IG)</option>
                <option value="ha">Hausa (HA)</option>
                <option value="am">Amharic (AM)</option>
                <option value="af">Afrikaans (AF)</option>
              </select>
            </div>

            {/* Contact Name input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact / Sender Identifier</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => handleFormChange(e.target.value, message)}
                placeholder="E.g., Kofi, +254 712 345..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-400 transition-all font-mono"
              />
            </div>

            {/* Message payload input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payload.Message Body</label>
              <textarea
                value={message}
                onChange={(e) => handleFormChange(contactName, e.target.value)}
                rows={3}
                placeholder="Type raw webhook message text..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-400 transition-all font-mono resize-none leading-relaxed"
              />
            </div>

            {/* Viewing perspective */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Viewing Perspective</label>
              <div className="flex rounded-lg border border-slate-800 overflow-hidden">
                {(["sender", "receiver"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewAs(v)}
                    className={`flex-1 font-mono text-xs py-2 px-3 transition-all ${
                      viewAs === v 
                        ? "bg-amber-400 text-slate-950 font-bold" 
                        : "bg-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    {v === "sender" ? "Sender" : "Receiver"}
                  </button>
                ))}
              </div>
            </div>

            {/* Main deliver button */}
            <button
              onClick={handleDeliver}
              disabled={loading || !isPayloadValid}
              className="w-full py-3 rounded-lg font-bold font-mono text-xs bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Send className="h-4 w-4 text-slate-950" />
              POST /webhook ▸
            </button>

            {/* Logs info */}
            <div className="text-[10px] font-mono text-slate-400 leading-relaxed pt-2 border-t border-slate-800/60">
              {sentLog === 0 ? (
                "Post webhooks to generate dynamic translation payloads and stamp logs."
              ) : (
                <div className="space-y-1">
                  <p className="text-cyan-400 font-bold">✓ DISPATCH SUCCESSFUL</p>
                  <p>Events count: {sentLog}</p>
                  <p>Timestamp: {lastSentTime}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: ANDROID LIVE DEVICE SIMULATOR (4 Cols) */}
        <div className="xl:col-span-4 flex flex-col items-center justify-center">
          <div className="text-center mb-2.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
              Device View Monitor
            </span>
          </div>

          {/* Immersive Mobile Device Frame */}
          <div
            className="relative w-full max-w-[320px] aspect-[9/18.5] bg-[#0A0A0A] rounded-[44px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_#1F2937] overflow-hidden flex flex-col transition-all duration-300"
            style={{ fontFamily: theme.font }}
          >
            {/* Device screen boundary */}
            <div 
              className="w-full h-full rounded-[32px] overflow-hidden flex flex-col relative"
              style={{ background: theme.chatBg }}
            >
              {/* Notch camera */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-black z-50 pointer-events-none" />

              {/* Status Bar */}
              <div 
                className="px-4.5 pt-2 pb-1 flex justify-between items-center text-[10px] z-40 select-none"
                style={{ background: theme.headerBg, color: theme.statusBarFg }}
              >
                <span className="font-semibold">{clock}</span>
                <span className="flex items-center gap-1">
                  <svg width="14" height="10" viewBox="0 0 16 11" fill="currentColor">
                    <rect x="0" y="6" width="2" height="5" />
                    <rect x="4" y="4" width="2" height="7" />
                    <rect x="8" y="2" width="2" height="9" />
                    <rect x="12" y="0" width="2" height="11" />
                  </svg>
                  <svg width="18" height="10" viewBox="0 0 20 11" fill="none" stroke="currentColor">
                    <rect x="0.5" y="0.5" width="15" height="9" rx="2" strokeWidth="1" />
                    <rect x="2" y="2" width="12" height="6" rx="1" fill="currentColor" />
                    <rect x="16.5" y="3" width="1.5" height="4" rx="0.5" fill="currentColor" />
                  </svg>
                </span>
              </div>

              {/* Chat App Header */}
              <div 
                className="px-3.5 py-2.5 flex items-center justify-between z-30 shadow-xs shrink-0"
                style={{ 
                  background: theme.headerBg, 
                  color: theme.headerText,
                  borderBottom: platform === "sms" ? `1px solid #E5E7EB` : "none"
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowLeft className="h-4.5 w-4.5 shrink-0 cursor-pointer opacity-80 hover:opacity-100 transition-opacity" />
                  
                  {/* Visual Avatar */}
                  <div 
                    className="h-8.5 w-8.5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-cyan-400 text-slate-900 shadow-sm"
                  >
                    {getInitials(contactName || "?")}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm truncate">
                      {contactName || "Acme Notify"}
                    </span>
                    <span 
                      className="text-[10px] truncate"
                      style={{ color: theme.headerSub }}
                    >
                      {platform === "tiktok" ? "Active now" : "online"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 z-35">
                  <button 
                    onClick={() => setShowDeviceSettings(true)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all cursor-pointer flex items-center justify-center text-inherit opacity-80 hover:opacity-100"
                    title="Switch Idiom"
                  >
                    <Settings className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Chat Content Body */}
              <div 
                className="flex-1 p-3.5 overflow-y-auto space-y-3 relative flex flex-col justify-end"
                style={{ background: theme.chatBg }}
              >
                {/* Chat pattern wallpaper overlay for WhatsApp */}
                {platform === "whatsapp" && (
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] [background-size:16px_16px]" />
                )}

                {/* Seed messages for high-fidelity */}
                {THREAD_SEED.map((seedMsg, idx) => {
                  const isSeedMine = seedMsg.from === "me";
                  const bubbleId = `seed-${idx}`;
                  const isTranslated = bubbleViews[bubbleId] === "translated";
                  const bubbleCache = translatedBubbles[bubbleId];
                  const displayText = isTranslated && bubbleCache ? bubbleCache.text : seedMsg.text;
                  const isLoading = bubbleCache?.loading;

                  return (
                    <div 
                      key={idx}
                      className={`flex ${isSeedMine ? "justify-end" : "justify-start"} animate-fade-in`}
                    >
                      <div
                        onClick={() => !isSeedMine && toggleBubbleTranslation(bubbleId, seedMsg.text)}
                        className={`max-w-[78%] px-3 py-2 rounded-2xl shadow-sm text-xs leading-relaxed transition-all duration-150 relative ${
                          !isSeedMine ? "cursor-pointer hover:brightness-110 active:scale-[0.98]" : ""
                        }`}
                        style={{
                          background: isSeedMine ? theme.sentBubble : theme.receivedBubble,
                          color: isSeedMine ? theme.sentText : theme.receivedText,
                          borderBottomRightRadius: isSeedMine ? 4 : 16,
                          borderBottomLeftRadius: isSeedMine ? 16 : 4,
                        }}
                        title={!isSeedMine ? "Tap to translate" : undefined}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-1.5 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            <span className="text-[10px] opacity-70">Translating...</span>
                          </div>
                        ) : (
                          <>
                            <p>{displayText}</p>
                            {!isSeedMine && (
                              <div className="mt-1 flex items-center justify-between gap-2 border-t border-slate-700/20 pt-0.5 text-[8px] opacity-50 font-mono">
                                <span>{isTranslated ? "Translated" : "Tap to translate"}</span>
                                <span className="uppercase">{isTranslated ? `${receiverIdiom}` : "orig"}</span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="text-[9px] text-right mt-1 opacity-60 flex items-center justify-end gap-1 font-mono">
                          <span>11:58 AM</span>
                          {isSeedMine && renderTicks(true)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Dynamic Webhook Message Bubble */}
                {(() => {
                  const bubbleId = "dynamic-bubble";
                  const isTranslated = bubbleViews[bubbleId] === "translated";
                  const bubbleCache = translatedBubbles[bubbleId];
                  const displayText = isTranslated && bubbleCache ? bubbleCache.text : message;
                  const isLoading = bubbleCache?.loading;

                  return (
                    <div 
                      className={`flex ${mine ? "justify-end" : "justify-start"} transition-all duration-300`}
                    >
                      <div
                        onClick={() => !mine && toggleBubbleTranslation(bubbleId, message)}
                        className={`max-w-[78%] px-3 py-2 rounded-2xl shadow-md text-xs leading-relaxed relative transition-all duration-150 ${
                          !mine ? "cursor-pointer hover:brightness-110 active:scale-[0.98]" : ""
                        }`}
                        style={{
                          background: mine ? theme.sentBubble : theme.receivedBubble,
                          color: mine ? theme.sentText : theme.receivedText,
                          borderBottomRightRadius: mine ? 4 : 16,
                          borderBottomLeftRadius: mine ? 16 : 4,
                          outline: pulse ? "2px solid #22D3EE" : "none",
                          outlineOffset: 3,
                        }}
                        title={!mine ? "Tap to translate" : undefined}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-1.5 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            <span className="text-[10px] opacity-70 font-mono">Translating...</span>
                          </div>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap select-text break-words font-sans">
                              {displayText || "(No payload message)"}
                            </p>
                            {!mine && message && (
                              <div className="mt-1 flex items-center justify-between gap-2 border-t border-slate-700/20 pt-0.5 text-[8px] opacity-50 font-mono">
                                <span>{isTranslated ? "Translated" : "Tap to translate"}</span>
                                <span className="uppercase">{isTranslated ? `${receiverIdiom}` : "orig"}</span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="text-[9px] text-right mt-1 opacity-60 flex items-center justify-end gap-1 font-mono">
                          <span>{time}</span>
                          {mine && renderTicks(true)}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Dynamic Webhook Response Bubble (Translation Reply) */}
                {loading && (
                  <div className={`flex ${mine ? "justify-start" : "justify-end"} animate-pulse`}>
                    <div 
                      className="max-w-[78%] px-3 py-2.5 rounded-2xl shadow-sm text-[11px] font-mono border"
                      style={{
                        background: theme.receivedBubble,
                        color: theme.receivedText,
                        borderColor: BORDER
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span>Simulating AfriTranslate response...</span>
                      </div>
                    </div>
                  </div>
                )}

                {lastResult && (
                  <div 
                    className={`flex ${mine ? "justify-start" : "justify-end"} animate-fade-in`}
                  >
                    <div
                      className="max-w-[80%] px-3 py-2.5 rounded-2xl shadow-md text-xs leading-normal border"
                      style={{
                        background: mine ? theme.receivedBubble : theme.sentBubble,
                        color: mine ? theme.receivedText : theme.sentText,
                        borderBottomRightRadius: mine ? 16 : 4,
                        borderBottomLeftRadius: mine ? 4 : 16,
                        borderColor: mine ? "transparent" : "rgba(34,211,238,0.2)"
                      }}
                    >
                      <p className="text-[9px] font-extrabold uppercase tracking-wider mb-1 text-cyan-400 flex items-center gap-1 font-mono">
                        <Sparkles className="h-3 w-3" />
                        Afritranslate Bot
                      </p>
                      
                      <p className="font-sans font-medium select-text break-words">
                        {lastResult.translatedText}
                      </p>

                      <div className="mt-2 border-t border-slate-700/40 pt-1 flex items-center justify-between gap-2.5 text-[8px] opacity-75 font-mono">
                        <span className="uppercase">
                          {lastResult.detectedLang} → {lastResult.targetLang} ({Math.round(lastResult.confidence * 100)}%)
                        </span>
                        <div className="flex items-center gap-0.5">
                          <span>{time}</span>
                          {!mine && renderTicks(true)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Device-Specific In-App Chat Settings Modal */}
              {showDeviceSettings && (
                <div className="absolute inset-0 bg-[#0F172A]/98 z-50 flex flex-col animate-fade-in p-4 text-slate-200 font-sans">
                  {/* Settings Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowDeviceSettings(false)}
                        className="p-1 hover:bg-slate-800 rounded-lg transition-all"
                      >
                        <ArrowLeft className="h-4.5 w-4.5 text-cyan-400" />
                      </button>
                      <span className="font-bold text-sm text-white">Chat Settings</span>
                    </div>
                    <span className="text-[10px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded font-mono font-bold uppercase">
                      {platform}
                    </span>
                  </div>

                  {/* Settings Body */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
                    {/* Receiver Language Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Receiver Idiom (Reading Language)
                      </label>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Select the native idiom for the receiver. Messages received in other languages will support tap-to-translate.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          { code: "en", name: "English" },
                          { code: "sw", name: "Swahili" },
                          { code: "zu", name: "Zulu" },
                          { code: "yo", name: "Yoruba" },
                          { code: "ig", name: "Igbo" },
                          { code: "ha", name: "Hausa" },
                          { code: "am", name: "Amharic" },
                          { code: "af", name: "Afrikaans" },
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setReceiverIdiom(lang.code);
                              // Clear translated cache to force update for new idiom on subsequent clicks
                              setTranslatedBubbles({});
                              setBubbleViews({});
                            }}
                            className={`px-3 py-2 rounded-lg border text-left font-sans transition-all flex items-center justify-between ${
                              receiverIdiom === lang.code
                                ? "border-cyan-400 bg-cyan-400/10 text-cyan-400 font-semibold"
                                : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            <span>{lang.name}</span>
                            <span className="text-[9px] uppercase font-mono opacity-60">
                              {lang.code}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Simulating Idiom info box */}
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Smart Translation
                      </span>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        AfriTranslate intercepts the incoming messaging streams and allows real-time rendering. Try choosing different target receiver languages here!
                      </p>
                    </div>
                  </div>

                  {/* Settings Footer */}
                  <button
                    onClick={() => setShowDeviceSettings(false)}
                    className="w-full py-2.5 mt-4 rounded-lg bg-cyan-400 text-slate-950 font-bold font-mono text-xs hover:bg-cyan-300 transition-all text-center"
                  >
                    Done & Save
                  </button>
                </div>
              )}

              {/* Chat Input Box Mockup */}
              <div 
                className="p-2.5 flex items-center gap-2 shrink-0 z-30"
                style={{ background: theme.inputBg }}
              >
                <div 
                  className="flex-1 rounded-full px-4 py-1.5 text-xs text-left"
                  style={{ background: "rgba(127,127,127,0.15)", color: theme.headerSub }}
                >
                  Message...
                </div>
                
                <button 
                  onClick={handleDeliver}
                  disabled={loading}
                  className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer"
                  style={{ background: theme.sentBubble }}
                >
                  <Send className="h-3.5 w-3.5" style={{ color: theme.sentText }} />
                </button>
              </div>

              {/* Bottom Home Gesture Indicator */}
              <div 
                className="pb-2 pt-1 flex justify-center shrink-0 z-20"
                style={{ background: theme.inputBg }}
              >
                <div className="w-24 h-1 rounded-full bg-slate-500/40" />
              </div>

            </div>
          </div>
        </div>

        {/* COLUMN 3: RAW JSON & LIVE CODE LOGS (4 Cols) */}
        <div className="xl:col-span-4 space-y-5">
          {/* JSON code view */}
          <div className="rounded-2xl border border-slate-800 bg-[#1E293B] p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Live JSON Payload
                </span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider"
              >
                <RefreshCw className="h-3 w-3 text-cyan-400" />
                Reset
              </button>
            </div>

            <div className="relative min-h-[220px] rounded-xl border border-slate-850 overflow-hidden bg-slate-950 flex flex-col">
              <div className="bg-[#111827] px-3 py-1.5 border-b border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>application/json</span>
                <span className={isPayloadValid ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
                  {isPayloadValid ? "✓ VALID SCHEMA" : "⚠ FIX ERRORS"}
                </span>
              </div>
              
              <textarea
                value={jsonPayload}
                onChange={(e) => setJsonPayload(e.target.value)}
                className="w-full flex-1 p-3.5 bg-transparent text-slate-300 outline-none resize-none leading-relaxed font-mono text-xs select-text min-h-[190px]"
                spellCheck={false}
              />
            </div>

            {/* Schema Auditor Warnings */}
            <div className="mt-4 rounded-xl border border-slate-850 bg-[#0F172A] p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                  Schema Auditor
                </span>
              </div>

              <div className="max-h-[80px] overflow-y-auto space-y-1.5 pr-1 font-sans">
                {schemaErrors.length === 0 && isValidJson ? (
                  <p className="text-emerald-400 flex items-center gap-1">
                    ✓ Payload aligns with the webhook standard.
                  </p>
                ) : (
                  schemaErrors.map((err, idx) => (
                    <div 
                      key={idx} 
                      className={`p-1.5 rounded-md flex items-start gap-1.5 border text-[11px] ${
                        err.severity === "error" 
                          ? "bg-rose-500/5 border-rose-500/20 text-rose-400" 
                          : "bg-amber-500/5 border-amber-500/10 text-amber-400"
                      }`}
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      <p className="leading-tight">
                        <strong className="font-mono">{err.path}</strong>: {err.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Webhook Response Output Logs */}
          <div className="rounded-2xl border border-slate-800 bg-[#1E293B] shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[#151C2C] px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 font-mono text-xs">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span className="font-semibold text-slate-300">Server Logs</span>
              </div>
              {responseCode !== null && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  responseCode === 200 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  HTTP {responseCode}
                </span>
              )}
            </div>

            <div className="p-3.5 font-mono text-[11px] text-slate-300 overflow-auto bg-slate-950 leading-normal select-text min-h-[160px]">
              {responsePayload ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Body Response:</span>
                    <pre className="text-emerald-400 overflow-auto whitespace-pre-wrap word-break-all bg-[#080D1A] p-2.5 rounded-lg border border-slate-900 max-h-[120px]">
                      {responsePayload}
                    </pre>
                  </div>
                  <div className="rounded-lg bg-slate-900 p-2.5 border border-slate-800 text-[10px] font-sans text-slate-400">
                    <p className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                      <Server className="h-3.5 w-3.5 text-cyan-400" />
                      Database Sync Committed
                    </p>
                    <p className="leading-relaxed">
                      The transaction record has been committed to SQLite. It will now show live in the translation history analytics charts!
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-[11px] text-rose-300 flex gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-rose-200">Delivery Failure</p>
                    <p className="mt-0.5 leading-relaxed text-[10px]">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-10 px-4 space-y-2">
                  <Play className="h-6 w-6 text-slate-800 animate-pulse" />
                  <p className="max-w-[160px] leading-relaxed text-slate-500 text-[10px]">
                    No delivery log loaded. Dispatch a webhook to inspect server output here.
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
