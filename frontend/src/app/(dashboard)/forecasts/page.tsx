"use client";

import { useEffect, useState } from "react";
import { fetchAPI, formatCurrency, formatNumber, formatCurrencyCompact } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, BarChart, Bar, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Clock, ShieldAlert, Sparkles, Search } from "lucide-react";

interface Forecast {
  product: string; forecast_days: number; moving_average: number;
  trend_pct: number; trend_direction: string;
  forecast: Array<{ day: number; predicted_units: number; lower_bound: number; upper_bound: number }>;
}
interface StockoutPred {
  product: string; current_stock: number; avg_daily_sales: number;
  days_until_stockout: number; risk_level: string; supplier: string; supplier_delivery_days: number;
}

export default function ForecastsPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [stockouts, setStockouts] = useState<StockoutPred[]>([]);
  const [revenueProj, setRevenueProj] = useState<{
    historical: Array<{ month: string; revenue: number }>;
    projection: Array<{ month: string; projected_revenue: number; lower_bound: number; upper_bound: number }>;
    avg_growth_pct: number;
  } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const [loadingText, setLoadingText] = useState("Initializing predictive models...");
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        setLoadingText("Running demand forecasting algorithms...");
        const fcPromise = fetchAPI<{ data: Forecast[] }>("/api/forecasts/demand");
        const soPromise = fetchAPI<{ data: StockoutPred[] }>("/api/forecasts/stockout");
        const revPromise = fetchAPI<typeof revenueProj>("/api/forecasts/revenue");
        
        const [fcData, soData, revData] = await Promise.all([fcPromise, soPromise, revPromise]);
        
        setLoadingText("Analyzing historical patterns...");
        await new Promise(r => setTimeout(r, 400));
        setForecasts(fcData.data);
        
        setLoadingText("Predicting inventory depletion rates...");
        await new Promise(r => setTimeout(r, 400));
        setStockouts(soData.data);
        setRevenueProj(revData);
        
        setLoadingText("Rendering AI predictions...");
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.error("Failed to load forecast data:", e);
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
          <Sparkles size={24} className="text-brass animate-pulse" />
        </div>
        <h2 className="text-2xl font-display text-paper mb-2">Predictive Intelligence</h2>
        <div className="flex items-center gap-2 text-muted">
          <div className="w-1.5 h-1.5 bg-signal rounded-full pulse-dot"></div>
          <p className="font-mono text-sm tracking-wider uppercase">{loadingText}</p>
        </div>
      </div>
    );
  }

  const selected = forecasts[selectedProduct];
  const TrendIcon = selected?.trend_direction === "declining" ? TrendingDown
    : selected?.trend_direction === "growing" ? TrendingUp : Minus;
  const trendColor = selected?.trend_direction === "declining" ? "text-alert"
    : selected?.trend_direction === "growing" ? "text-signal" : "text-muted";

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display text-paper mb-1">
            Predictive <span className="text-brass">Intelligence</span>
          </h1>
          <p className="text-muted text-sm font-mono uppercase tracking-wider">
            Demand forecasting, stockout timelines, and revenue models
          </p>
        </div>
        
        <div className="relative w-full sm:w-auto min-w-[250px] z-50">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-muted" />
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="w-full bg-surface2 border border-line rounded-xl py-2 pl-10 pr-4 text-sm text-paper placeholder-muted focus:outline-none focus:border-brass/50 transition-colors"
          />
          
          {isSearchFocused && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-line rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
              {forecasts
                .map((f, i) => ({ ...f, originalIndex: i }))
                .filter((f) => f.product.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((f) => (
                  <button
                    key={f.product}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input onBlur from firing first
                      setSelectedProduct(f.originalIndex);
                      setSearchQuery(f.product);
                      setIsSearchFocused(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-paper hover:bg-surface2 hover:text-brass transition-colors border-b border-line/50 last:border-0"
                  >
                    {f.product}
                  </button>
                ))}
              
              {forecasts.filter((f) => f.product.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="px-4 py-3 text-sm text-muted text-center">
                  No products found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Product selector */}
      <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex gap-2 overflow-x-auto pb-2 w-full custom-scrollbar">
          {forecasts
            .map((f, i) => ({ ...f, originalIndex: i }))
            .filter((f) => f.product.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((f) => {
              const isActive = f.originalIndex === selectedProduct;
              return (
                <button
                  key={f.product}
                  onClick={() => setSelectedProduct(f.originalIndex)}
                  className={`whitespace-nowrap shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brass/10 border border-brass/30 text-brass shadow-lg"
                      : "bg-surface/50 border border-transparent text-muted hover:bg-surface2 hover:text-paper"
                  }`}
                >
                  {f.product}
                </button>
              );
            })}
        </div>
      </div>

      {selected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-brass/30 transition-colors">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">Daily Average</p>
            <p className="text-3xl font-display text-paper">{selected.moving_average} <span className="text-sm font-sans text-muted font-normal">units</span></p>
          </div>
          
          <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-brass/30 transition-colors">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">Projected Trend</p>
            <div className="flex items-center gap-2">
              <TrendIcon size={24} className={trendColor} />
              <p className={`text-3xl font-display ${trendColor}`}>
                {selected.trend_pct > 0 ? "+" : ""}{selected.trend_pct}%
              </p>
            </div>
          </div>
          
          <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-brass/30 transition-colors">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">Direction</p>
            <p className="text-3xl font-display text-paper capitalize">{selected.trend_direction}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demand forecast chart */}
        {selected && (
          <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "300ms" }}>
            <h2 className="text-xl font-display text-paper mb-1">{selected.product} Forecast</h2>
            <span className="text-xs font-mono uppercase tracking-wider text-muted block mb-6">30-Day Predictive Model</span>
            
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selected.forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-brass)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-brass)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--color-surface2)", border: "1px solid var(--color-line)", borderRadius: "12px", color: "var(--color-paper)", fontSize: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }} />
                  <Area type="monotone" dataKey={["lower_bound", "upper_bound"] as any} stroke="none" fill="var(--color-brass)" fillOpacity={0.15} name="Confidence Interval" />
                  <Line type="monotone" dataKey="predicted_units" stroke="var(--color-brass)" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: "var(--color-brass)", stroke: "var(--color-surface)", strokeWidth: 2 }} name="Predicted" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Revenue projection */}
        {revenueProj && (
          <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-display text-paper mb-1">Revenue Projection</h2>
                <span className="text-xs font-mono uppercase tracking-wider text-muted">90-Day Outlook</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted">Avg Growth</span>
                <span className={`px-2 py-1 rounded-md text-xs font-mono font-medium ${
                  revenueProj.avg_growth_pct >= 0 ? "bg-signal/10 text-signal" : "bg-alert/10 text-alert"
                }`}>
                  {revenueProj.avg_growth_pct > 0 ? "+" : ""}{revenueProj.avg_growth_pct}%
                </span>
              </div>
            </div>
            
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...revenueProj.historical.slice(-4), ...revenueProj.projection.map(p => ({ month: p.month, revenue: p.projected_revenue }))]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted)" fontSize={11} tickFormatter={(v) => formatCurrencyCompact(v)} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "var(--color-surface2)" }} contentStyle={{ background: "var(--color-surface2)", border: "1px solid var(--color-line)", borderRadius: "12px", color: "var(--color-paper)", fontSize: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }}
                    formatter={(v: any) => [formatCurrency(Number(v)), "Revenue"]} />
                  <Bar dataKey="revenue" fill="var(--color-brass)" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Stockout predictions */}
      <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "500ms" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center">
            <Clock size={16} className="text-brass" />
          </div>
          <div>
            <h2 className="text-xl font-display text-paper">Stockout Timeline</h2>
            <span className="text-xs font-mono uppercase tracking-wider text-muted">Predicted depletion dates</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-3 font-mono text-xs uppercase tracking-wider text-muted">Product</th>
                <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Current Stock</th>
                <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Daily Sales</th>
                <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Days Left</th>
                <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Supplier Lead</th>
                <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {stockouts.map((s) => (
                <tr key={s.product} className="hover:bg-surface2/50 transition-colors group">
                  <td className="py-4 font-medium text-paper group-hover:text-brass transition-colors">{s.product}</td>
                  <td className="py-4 text-right text-muted">{s.current_stock}</td>
                  <td className="py-4 text-right text-muted">{s.avg_daily_sales}</td>
                  <td className="py-4 text-right font-medium" style={{ color: s.days_until_stockout < 10 ? "var(--color-alert)" : "var(--color-paper)" }}>
                    {s.days_until_stockout}
                  </td>
                  <td className="py-4 text-right text-muted">{s.supplier_delivery_days}d</td>
                  <td className="py-4 text-right flex justify-end">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest border ${
                      s.risk_level === "critical" ? "bg-alert/10 border-alert/20 text-alert"
                      : s.risk_level === "warning" ? "bg-brass/10 border-brass/20 text-brass"
                      : "bg-signal/10 border-signal/20 text-signal"
                    }`}>
                      {s.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
