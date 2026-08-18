"use client";

import { useEffect, useState } from "react";
import { fetchAPI, postAPI } from "@/lib/api";
import { CheckCircle, Circle, ArrowUpRight, Clock, AlertTriangle, Tag, ListTodo } from "lucide-react";

interface Action {
  id: number; title: string; description: string;
  priority: string; category: string; is_completed: number; created_at: string;
}

const priorityConfig: Record<string, { color: string; bg: string; border: string }> = {
  high: { color: "text-alert", bg: "bg-alert/10", border: "border-alert/20" },
  medium: { color: "text-brass", bg: "bg-brass/10", border: "border-brass/20" },
  low: { color: "text-signal", bg: "bg-signal/10", border: "border-signal/20" },
};

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
  const [loadingText, setLoadingText] = useState("Retrieving suggested actions...");
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  useEffect(() => {
    loadActions();
  }, []);

  async function loadActions() {
    try {
      setLoadingText("Fetching AI recommendations...");
      const data = await fetchAPI<{ actions: Action[] }>("/api/actions");
      
      setLoadingText("Prioritizing tasks...");
      await new Promise(r => setTimeout(r, 400));
      setActions(data.actions);
      
      setLoadingText("Initializing action center...");
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.error(e);
    } finally {
      setIsFullyLoaded(true);
    }
  }

  async function toggleAction(id: number, completed: boolean) {
    try {
      const endpoint = completed ? `/api/actions/${id}/reopen` : `/api/actions/${id}/complete`;
      await postAPI(endpoint, {});
      setActions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_completed: completed ? 0 : 1 } : a))
      );
    } catch (e) { console.error(e); }
  }

  if (!isFullyLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-surface2 border border-line flex items-center justify-center mb-6 shadow-2xl relative">
          <div className="absolute inset-0 rounded-full border-2 border-brass border-t-transparent animate-spin"></div>
          <ListTodo size={24} className="text-brass animate-pulse" />
        </div>
        <h2 className="text-2xl font-display text-paper mb-2">Action Center</h2>
        <div className="flex items-center gap-2 text-muted">
          <div className="w-1.5 h-1.5 bg-signal rounded-full pulse-dot"></div>
          <p className="font-mono text-sm tracking-wider uppercase">{loadingText}</p>
        </div>
      </div>
    );
  }

  const filtered = filter === "all" ? actions
    : filter === "pending" ? actions.filter((a) => !a.is_completed)
    : actions.filter((a) => a.is_completed);

  const pendingCount = actions.filter((a) => !a.is_completed).length;
  const completedCount = actions.filter((a) => a.is_completed).length;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display text-paper mb-1">
            Action <span className="text-brass">Center</span>
          </h1>
          <p className="text-muted text-sm font-mono uppercase tracking-wider">
            AI-recommended operations and optimizations
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-brass/30 transition-colors animate-slide-up" style={{ animationDelay: "100ms" }}>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">Total Actions</p>
          <p className="text-3xl font-display text-paper">{actions.length}</p>
        </div>
        <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-brass/30 transition-colors animate-slide-up" style={{ animationDelay: "200ms" }}>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">Pending</p>
          <p className="text-3xl font-display text-brass">{pendingCount}</p>
        </div>
        <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-brass/30 transition-colors animate-slide-up" style={{ animationDelay: "300ms" }}>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">Completed</p>
          <p className="text-3xl font-display text-signal">{completedCount}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 animate-fade-in" style={{ animationDelay: "400ms" }}>
        {(["pending", "all", "completed"] as const).map((f) => {
          const isActive = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-brass/10 border border-brass/30 text-brass shadow-lg"
                  : "bg-surface/50 border border-transparent text-muted hover:bg-surface2 hover:text-paper"
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Action list */}
      <div className="space-y-4">
        {filtered.map((action, i) => {
          const config = priorityConfig[action.priority] || priorityConfig.medium;
          
          return (
            <div key={action.id}
              className={`bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-5 shadow-2xl relative overflow-hidden transition-all animate-slide-up ${
                action.is_completed ? "opacity-60 grayscale-[50%]" : "hover:border-brass/30"
              }`}
              style={{ animationDelay: `${(i * 100) + 500}ms` }}>
              
              <div className={`absolute top-0 left-0 w-1.5 h-full ${action.is_completed ? "bg-signal" : config.bg.replace('/10', '')}`} />
              
              <div className="flex items-start gap-4 ml-2">
                <button onClick={() => toggleAction(action.id, !!action.is_completed)}
                  className="mt-1 flex-shrink-0 transition-transform hover:scale-110">
                  {action.is_completed
                    ? <CheckCircle size={24} className="text-signal" />
                    : <Circle size={24} className="text-muted hover:text-brass" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <h3 className={`text-lg font-display truncate ${action.is_completed ? "line-through text-muted" : "text-paper"}`}>
                      {action.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md border ${config.bg} ${config.border} ${config.color}`}>
                        {action.priority} Priority
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md bg-surface2 border border-line text-muted flex items-center gap-1">
                        <Tag size={10} />{action.category}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm mb-3 leading-relaxed ${action.is_completed ? "text-muted/70" : "text-muted"}`}>
                    {action.description}
                  </p>
                  
                  {!action.is_completed && (
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-surface2 hover:bg-surface border border-transparent hover:border-line transition-all text-paper text-xs font-mono uppercase tracking-wider">
                        Execute Action
                      </button>
                    </div>
                  )}
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
            <h3 className="text-2xl font-display text-paper mb-2">All Caught Up!</h3>
            <p className="text-muted">There are no {filter !== "all" ? filter : ""} actions at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
