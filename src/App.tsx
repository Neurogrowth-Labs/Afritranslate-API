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

const navGroups = [
  { label: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "docs", label: "Getting Started", icon: BookOpen }] },
  { label: "APIs", items: [{ id: "playground", label: "API Playground", icon: Terminal }, { id: "keys", label: "API Keys", icon: Key }, { id: "models", label: "Models", icon: Database }, { id: "routing", label: "Routing", icon: Route }, { id: "webhooks", label: "Webhooks", icon: Webhook }] },
  { label: "Languages", items: [{ id: "languages", label: "Languages", icon: Languages }] },
  { label: "Observability", items: [{ id: "usage", label: "Usage", icon: BarChart3 }, { id: "logs", label: "Logs", icon: Activity }] },
  { label: "Account", items: [{ id: "billing", label: "Billing", icon: CreditCard }, { id: "security", label: "Security", icon: Shield }] }
] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string; key?: React.Key }) {
  return <section className={cx("rounded-2xl border border-slate-800/80 bg-slate-950/55 p-5 shadow-sm", className)}>{children}</section>;
}

export default function App()
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthResponse["user"] | null>(null);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const storedToken = localStorage.getItem("afritranslate_token");
    const storedUser = localStorage.getItem("afritranslate_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
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


  if (!user) {
    return <><SignedOutExperience onOpenAuth={() => setAuthModalOpen(true)} /><AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onSuccess={handleAuthSuccess} /></>;
  }
