"use client";

import { useEffect, useState } from "react";
import { fetchAPI, formatDate, formatTime } from "@/lib/api";
import { AlertTriangle, AlertCircle, Info, CheckCircle, Bell, Clock } from "lucide-react";

interface Alert {
  id: number; title: string; description: string;
  severity: string; category: string; is_read: number; created_at: string;
}

const severityConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  critical: { icon: <AlertTriangle size={18} />, color: "text-alert", bg: "bg-alert/10", border: "border-alert/20", label: "Critical" },
  warning: { icon: <AlertCircle size={18} />, color: "text-brass", bg: "bg-brass/10", border: "border-brass/20", label: "Warning" },
  info: { icon: <Info size={18} />, color: "text-signal", bg: "bg-signal/10", border: "border-signal/20", label: "Info" },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loadingText, setLoadingText] = useState("Scanning system alerts...");
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        setLoadingText("Fetching active alerts...");
        const data = await fetchAPI<{ alerts: Alert[] }>("/api/dashboard/alerts");
        
        setLoadingText("Processing severity levels...");
        await new Promise(r => setTimeout(r, 400));
        setAlerts(data.alerts);
        
        setLoadingText("Initializing alert center...");
        await new Promise(r => setTimeout(r, 400));
      } catch (e) {
        console.error("Failed to load alerts:", e);
      } finally {
        setIsFullyLoaded(true);
      }
    }
    loadAll();
  }, []);

  if (!isFullyLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-surface2 border border-line flex items-center justify-center mb-6 shadow-2xl relative">
          <div className="absolute inset-0 rounded-full border-2 border-brass border-t-transparent animate-spin"></div>
          <Bell size={24} className="text-brass animate-pulse" />
        </div>
        <h2 className="text-2xl font-display text-paper mb-2">Alert Center</h2>
        <div className="flex items-center gap-2 text-muted">
          <div className="w-1.5 h-1.5 bg-signal rounded-full pulse-dot"></div>
          <p className="font-mono text-sm tracking-wider uppercase">{loadingText}</p>
        </div>
      </div>
    );
  }

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);
  const counts = {
    all: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display text-paper mb-1">
            System <span className="text-brass">Alerts</span>
          </h1>
          <p className="text-muted text-sm font-mono uppercase tracking-wider">
            {alerts.length} active alerts requiring attention
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-surface2 border border-line hover:border-brass/50 text-paper px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            Mark All Read
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {(["all", "critical", "warning", "info"] as const).map((f) => {
          const isActive = filter === f;
          const config = f === "all" ? null : severityConfig[f];
          
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${
                isActive
                  ? f === "critical" ? "bg-alert/15 border-alert/30 text-alert" 
                  : f === "warning" ? "bg-brass/15 border-brass/30 text-brass" 
                  : f === "info" ? "bg-signal/15 border-signal/30 text-signal" 
                  : "bg-surface2 border-line text-paper shadow-lg"
                  : "bg-surface/50 border-transparent text-muted hover:bg-surface2"
              }`}
            >
              {config && <span className={isActive ? config.color : "text-muted"}>{config.icon}</span>}
              {!config && <Bell size={16} className={isActive ? "text-paper" : "text-muted"} />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`text-xs px-2 py-0.5 rounded-md ${
                isActive ? "bg-background/50" : "bg-surface2"
              }`}>
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Alert list */}
      <div className="space-y-4">
        {filtered.map((alert, i) => {
          const config = severityConfig[alert.severity] || severityConfig.info;
          const time = formatTime(alert.created_at, { hour: "2-digit", minute: "2-digit" });
          const date = formatDate(alert.created_at, { month: "short", day: "numeric" });
          
          return (
            <div
              key={alert.id}
              className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:border-brass/30 transition-colors animate-slide-up"
              style={{ animationDelay: `${(i * 100) + 200}ms` }}
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                alert.severity === "critical" ? "bg-alert" 
                : alert.severity === "warning" ? "bg-brass" 
                : "bg-signal"
              }`} />
              
              <div className="flex items-start gap-4 ml-2">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${config.bg} ${config.border} ${config.color}`}>
                  {config.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <h3 className="text-lg font-display text-paper truncate">{alert.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md border ${config.bg} ${config.border} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md bg-surface2 border border-line text-muted">
                        {alert.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted mb-3 leading-relaxed">
                    {alert.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-brass/70" />
                      <span>{date} • {time}</span>
                    </div>
                    <div className="flex gap-2 ml-auto">
                      <button className="px-3 py-1.5 rounded-lg bg-surface2 hover:bg-surface border border-transparent hover:border-line transition-all text-paper">
                        Resolve
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface2 border border-line transition-all text-paper">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {filtered.length === 0 && (
          <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-12 shadow-2xl flex flex-col items-center justify-center text-center animate-fade-in delay-200">
            <div className="w-20 h-20 rounded-full bg-signal/10 border border-signal/20 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 rounded-full border border-signal/40 animate-ping opacity-20"></div>
              <CheckCircle size={32} className="text-signal" />
            </div>
            <h3 className="text-2xl font-display text-paper mb-2">All Clear!</h3>
            <p className="text-muted">There are no {filter !== "all" ? filter : ""} alerts requiring your attention right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
