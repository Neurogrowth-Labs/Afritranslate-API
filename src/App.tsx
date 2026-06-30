import React, { useState, useEffect } from "react";
import { 
  Globe, 
  Terminal, 
  BookOpen, 
  Languages, 
  Database, 
  History, 
  Key, 
  User as UserIcon, 
  LogOut, 
  ChevronRight, 
  Sparkles, 
  Copy, 
  Check,
  Shield,
  Layers
} from "lucide-react";
import TranslatorTab from "./components/TranslatorTab";
import WebhookPlaygroundTab from "./components/WebhookPlaygroundTab";
import ApiDocsTab from "./components/ApiDocsTab";
import LanguageExplorerTab from "./components/LanguageExplorerTab";
import HistoryAnalyticsTab from "./components/HistoryAnalyticsTab";
import AuthModal from "./components/AuthModal";
import { AuthResponse } from "./types";

type ActiveTab = "translator" | "webhooks" | "docs" | "languages" | "history";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("translator");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Load token on startup
  useEffect(() => {
    const storedToken = localStorage.getItem("afritranslate_token");
    const storedUser = localStorage.getItem("afritranslate_user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Optionally fetch updated credentials from server
      fetch("/api/v1/auth/me", {
        headers: { "Authorization": `Bearer ${storedToken}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Session expired");
      })
      .then(data => {
        setUser(data);
        localStorage.setItem("afritranslate_user", JSON.stringify(data));
      })
      .catch(() => {
        // Clear expired credentials
        handleLogout();
      });
    }
  }, []);

  const handleAuthSuccess = (authData: AuthResponse) => {
    setToken(authData.access_token);
    setUser(authData.user);
    localStorage.setItem("afritranslate_token", authData.access_token);
    localStorage.setItem("afritranslate_user", JSON.stringify(authData.user));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("afritranslate_token");
    localStorage.removeItem("afritranslate_user");
    setShowKeyPanel(false);
  };

  const handleCopyKey = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col text-slate-300 antialiased font-sans">
      {/* Decorative Top Accent Bar */}
      <div className="h-1 bg-amber-500 w-full" />

      {/* Console Header Nav */}
      <header className="border-b border-slate-800 bg-[#1E293B] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-900 border border-amber-400 shadow-md">
              <Globe className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans font-extrabold tracking-tight text-white text-lg">AfriTranslate <span className="text-amber-500">API</span></span>
                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold font-mono tracking-wider text-emerald-400">v1.0.0 Stable</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Real-time African languages translations console</p>
            </div>
          </div>

          {/* User Profile Info / Sign In Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Credentials retrieval button */}
                <button
                  type="button"
                  onClick={() => setShowKeyPanel(!showKeyPanel)}
                  className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-750 hover:text-white transition-colors"
                >
                  <Key className="h-3.5 w-3.5 text-amber-500" />
                  API JWT Token
                </button>

                {/* Profile panel info */}
                <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-sm uppercase">
                    {user.username.slice(0, 2)}
                  </div>
                  <div className="hidden md:block leading-tight text-left">
                    <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                      {user.username}
                    </p>
                    <p className="text-[9px] font-mono text-slate-400">
                      {user.api_calls} calls
                    </p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-slate-700 p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Log out session"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 active:bg-amber-600 shadow-lg transition-all"
              >
                <UserIcon className="h-3.5 w-3.5" />
                Developer Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Floating JWT Key Modal / panel */}
      {showKeyPanel && token && (
        <div className="bg-[#151C2C] border-b border-slate-800 text-slate-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold flex items-center gap-1.5 text-white">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                Your Developer API Bearer Token is Active
              </p>
              <p className="text-[10px] text-slate-400 max-w-2xl leading-normal">
                Include this JWT token as an <span className="font-mono bg-slate-900 px-1 py-0.5 rounded text-amber-500 border border-slate-800">Authorization: Bearer [TOKEN]</span> header to query the AfriTranslate REST API directly from your terminal or production servers!
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/80 rounded-xl p-1.5 border border-slate-800 max-w-md overflow-hidden">
              <span className="font-mono text-xs text-slate-300 truncate pl-2 select-all max-w-[200px] md:max-w-[280px]">
                {token}
              </span>
              <button
                onClick={handleCopyKey}
                className="rounded-lg bg-amber-500 hover:bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-slate-950 shrink-0 flex items-center gap-1 transition-colors"
              >
                {copiedKey ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation tabs row */}
      <div className="border-b border-slate-800 bg-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 py-3 overflow-x-auto select-none no-scrollbar">
            {[
              { id: "translator", label: "Sandbox Translator", icon: Languages },
              { id: "webhooks", label: "Webhook Playground", icon: Terminal },
              { id: "docs", label: "Interactive API Docs", icon: BookOpen },
              { id: "languages", label: "Language Catalog", icon: Globe },
              { id: "history", label: "Audit Logs & Stats", icon: History },
            ].map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all border ${
                    isActive
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold shadow-xs"
                      : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <IconComponent className={`h-3.5 w-3.5 ${isActive ? "text-amber-500" : ""}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Container Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Render Active Tab */}
        <div className="transition-all duration-300">
          {activeTab === "translator" && (
            <TranslatorTab token={token} />
          )}

          {activeTab === "webhooks" && (
            <WebhookPlaygroundTab />
          )}

          {activeTab === "docs" && (
            <ApiDocsTab token={token} />
          )}

          {activeTab === "languages" && (
            <LanguageExplorerTab 
              onTryTranslate={(langCode) => {
                setActiveTab("translator");
                // Pre-populate translator
                setTimeout(() => {
                  const selectElement = document.querySelector('select') as HTMLSelectElement;
                  if (selectElement) {
                    selectElement.value = langCode;
                    selectElement.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                }, 100);
              }} 
            />
          )}

          {activeTab === "history" && (
            <HistoryAnalyticsTab 
              token={token} 
              onLoginPrompt={() => setAuthModalOpen(true)} 
            />
          )}
        </div>
      </main>

      {/* Footer System Status Bar */}
      <footer className="border-t border-slate-800 bg-[#1E293B] text-xs text-slate-500 font-mono py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span>AfriTranslate Server Active • running on port 3000</span>
          </div>
          <div>
            <span>Powered by AfriTranslate AI Studio.</span>
          </div>
        </div>
      </footer>

      {/* Authentication Register/Login Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
