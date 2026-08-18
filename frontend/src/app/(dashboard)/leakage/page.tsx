"use client";

import { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { AlertTriangle, TrendingDown, DollarSign, ArrowRight, ShieldAlert, BadgeCheck } from "lucide-react";

interface Leakage {
  id: number;
  problem: string;
  evidence: string;
  financial_impact: string;
  recommended_action: string;
  created_at: string;
}

export default function LeakagePage() {
  const [leakages, setLeakages] = useState<Leakage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeakages();
  }, []);

  async function loadLeakages() {
    try {
      setLoading(true);
      const data = await fetchAPI<Leakage[]>("/api/leakage/");
      setLeakages(data);
    } catch (e) {
      console.error("Failed to load leakages:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-16 h-16 border-4 border-brass border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(201,162,39,0.3)]"></div>
        <div className="text-xl font-medium text-brass animate-pulse">Scanning for Revenue Leakage...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen pb-24 relative">
      {/* Background ambient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-alert/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10 mt-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-alert/10 border border-alert/20 text-alert text-sm font-medium mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-alert"></span>
              </span>
              Active Monitoring
            </div>
            <h1 className="text-4xl md:text-5xl font-display text-paper mb-3">
              Revenue <span className="text-transparent bg-clip-text bg-gradient-to-r from-alert to-orange-400">Leakage</span>
            </h1>
            <p className="text-muted text-lg font-light max-w-2xl">
              AI-driven forensic analysis of your transactions to detect pricing errors, uncollected payments, and financial anomalies.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="px-6 py-4 rounded-2xl bg-surface/50 border border-line backdrop-blur-md flex items-center gap-4 shadow-xl">
              <div className="bg-alert/10 p-3 rounded-xl border border-alert/20 text-alert">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted font-medium">Issues Detected</p>
                <p className="text-2xl font-display text-paper">{leakages.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {leakages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-line/50 bg-surface/30 backdrop-blur-md shadow-2xl">
            <div className="w-24 h-24 bg-brass/10 border border-brass/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(201,162,39,0.15)] relative">
              <BadgeCheck className="w-12 h-12 text-brass absolute z-10" />
              <div className="absolute inset-0 border border-brass/30 rounded-full animate-ping opacity-20"></div>
            </div>
            <h3 className="text-2xl font-display text-paper mb-2">No Revenue Leakage Detected</h3>
            <p className="text-muted text-center max-w-md text-lg font-light">
              Your financial data is looking pristine! Our AI hasn't detected any significant pricing errors, suspicious transactions, or anomalies.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {leakages.map((leakage, idx) => (
              <div
                key={leakage.id}
                className="group relative overflow-hidden rounded-3xl border border-line/80 bg-surface/40 backdrop-blur-md hover:bg-surface/60 hover:border-alert/30 transition-all duration-500 shadow-xl"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-alert/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                <div className="p-8 relative z-10 flex flex-col h-full">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-alert/20 to-alert/5 border border-alert/20 flex items-center justify-center text-alert shadow-[0_0_15px_rgba(248,113,113,0.15)]">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-display text-paper">{leakage.problem}</h3>
                    </div>
                    
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-alert/10 border border-alert/20 text-alert font-mono font-medium shadow-sm whitespace-nowrap">
                      <DollarSign className="w-4 h-4 opacity-70" />
                      {leakage.financial_impact}
                    </div>
                  </div>

                  <div className="flex-1 space-y-6">
                    {/* Evidence Section (Monospace / Terminal style) */}
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                        Forensic Evidence
                      </p>
                      <div className="bg-dark/80 p-4 rounded-xl border border-line font-mono text-sm text-zinc-300 leading-relaxed shadow-inner">
                        <span className="text-alert/60 mr-2">{">"}</span>
                        {leakage.evidence}
                      </div>
                    </div>

                    {/* Recommended Action Section */}
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-brass/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brass/50"></span>
                        Recommended Action
                      </p>
                      <div className="flex items-start gap-4 bg-gradient-to-r from-brass/10 to-transparent p-5 rounded-xl border-l-2 border-brass/50 group-hover:border-brass transition-colors duration-300">
                        <ArrowRight className="w-5 h-5 text-brass shrink-0 mt-0.5" />
                        <p className="text-paper leading-relaxed">
                          {leakage.recommended_action}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-alert/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tr-3xl"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
