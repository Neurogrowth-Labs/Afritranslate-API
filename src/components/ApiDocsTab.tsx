import React from "react";
import { BookOpen, MessageCircle, Radio, Shield, Server, Workflow } from "lucide-react";

const platformRows = [
  ["WhatsApp", "Cloud API", "Text + downloadable voice notes", "Live voice/video calls are not exposed by public APIs"],
  ["Messenger", "Messenger Platform", "Text + downloadable audio attachments", "PSID-based users and Page access tokens"],
  ["TikTok", "Business/partner APIs", "Limited, approval-gated messaging", "Treat as Phase 3 until access is confirmed in writing"]
];

const stackRows = [
  ["Client / SDK", "TypeScript, Swift, Kotlin, REST clients", "Capture text/audio, cache language preferences, use short-lived tokens"],
  ["Edge & Gateway", "Cloudflare, Kong, AWS API Gateway", "TLS, routing, WAF, auth, rate limits"],
  ["Application Services", "Node.js/Fastify/NestJS or Go", "Translation orchestration, sessions, billing, platform adapters"],
  ["AI / ML Inference", "Whisper-class STT, NLLB/M2M MT, Coqui/VITS TTS", "Model routing, autoscaling GPU pools, response cache"],
  ["Streaming", "LiveKit/mediasoup, WebSockets, coturn", "WebRTC media, captions, synthesized audio chunks"],
  ["Data", "PostgreSQL, Redis, S3/R2, Kafka/NATS, ClickHouse", "Users, sessions, artifacts, queues, analytics"],
  ["DevOps", "Docker, Kubernetes, Terraform, GitHub Actions", "CI/CD, staged deployments, model release gates"],
  ["Security & Observability", "Secrets Manager/Vault, Prometheus, OpenTelemetry", "RBAC, signatures, traces, alerts, audits"]
];

function CodeBlock({ children }: { children: React.ReactNode }) {
  return <pre className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-300"><code>{children}</code></pre>;
}

export default function ApiDocsTab({ token }: { token: string | null }) {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400"><BookOpen className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Integration Guide v2.0</p>
            <h1 className="mt-2 text-3xl font-black text-white">AfriTranslate third-party platform integrations</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Use WhatsApp and Messenger as buildable Phase 1 webhook surfaces. TikTok remains partnership-gated because the public developer surface does not provide general direct-message automation or live media interception.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {platformRows.map(([name, api, supported, limits]) => (
          <div key={name} className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
            <h2 className="text-lg font-bold text-white">{name}</h2>
            <p className="mt-1 text-xs font-mono text-amber-400">{api}</p>
            <p className="mt-4 text-sm text-slate-300">{supported}</p>
            <p className="mt-3 text-xs leading-5 text-slate-500">{limits}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <div className="mb-4 flex items-center gap-2 text-white"><MessageCircle className="h-5 w-5 text-amber-500" /><h2 className="font-bold">WhatsApp / Messenger flow</h2></div>
          <CodeBlock>{`Platform webhook -> /webhooks/{platform}\nAdapter normalizes payload\nPOST /api/v1/translate\nAdapter formats reply\nPlatform Send API delivers translation`}</CodeBlock>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-400">
            <li>Verify Meta webhook challenges and X-Hub-Signature-256 on inbound events.</li>
            <li>Download voice notes or audio attachments before STT → MT → TTS processing.</li>
            <li>Store WhatsApp phone-number IDs and Messenger PSIDs separately.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
          <div className="mb-4 flex items-center gap-2 text-white"><Radio className="h-5 w-5 text-amber-500" /><h2 className="font-bold">Live calls</h2></div>
          <p className="text-sm leading-6 text-slate-400">WhatsApp, Messenger, and TikTok do not expose public APIs that let third parties intercept or inject audio into active voice/video calls. AfriTranslate can support live translation in owned apps through WebRTC/WebSocket streaming, but platform-native call translation requires a formal platform partnership.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5">
        <div className="mb-4 flex items-center gap-2 text-white"><Server className="h-5 w-5 text-amber-500" /><h2 className="font-bold">Full-stack infrastructure reference</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr><th className="p-3">Layer</th><th className="p-3">Technology choices</th><th className="p-3">Responsibility</th></tr></thead>
            <tbody className="divide-y divide-slate-800">
              {stackRows.map(([layer, tech, responsibility]) => <tr key={layer}><td className="p-3 font-semibold text-white">{layer}</td><td className="p-3 text-amber-100/80">{tech}</td><td className="p-3 text-slate-400">{responsibility}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5"><div className="mb-3 flex items-center gap-2 font-bold text-white"><Shield className="h-5 w-5 text-amber-500" />Security checklist</div><ul className="list-disc space-y-2 pl-5 text-sm text-slate-400"><li>Keep platform tokens in a secrets manager, never source control.</li><li>Use HTTPS, RBAC, dependency scans, rate limits, and circuit breakers.</li><li>Correlate platform message IDs with AfriTranslate request IDs.</li></ul></div>
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5"><div className="mb-3 flex items-center gap-2 font-bold text-white"><Workflow className="h-5 w-5 text-amber-500" />Try the API</div><CodeBlock>{`curl -X POST http://localhost:3000/api/v1/translate \\\n  -H "Authorization: Bearer ${token ?? "<token>"}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text":"Habari","source_lang":"sw","target_lang":"en"}'`}</CodeBlock></div>
      </section>
    </div>
  );
}
