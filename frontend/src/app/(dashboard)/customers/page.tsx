"use client";

import { useEffect, useState } from "react";
import { fetchAPI, formatCurrency, formatNumber, formatCurrencyCompact } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { Users, UserPlus, DollarSign, ShoppingBag, Crown, MapPin, Target } from "lucide-react";

const COLORS = ["#d4af37", "#b38b22", "#f5d76e", "#e6c229", "#c5a017", "#a48010"];

interface Segment { segment: string; count: number; total_orders: number; total_spent: number; avg_spent: number; }
interface Customer { name: string; segment: string; region: string; total_orders: number; total_spent: number; }

export default function CustomersPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [overview, setOverview] = useState<{
    summary: { total: number; orders: number; revenue: number };
    regional: Array<{ region: string; count: number; total_spent: number }>;
    top_customers: Customer[];
    growth: Array<{ month: string; new_customers: number }>;
  } | null>(null);
  const [loadingText, setLoadingText] = useState("Initializing customer intelligence...");
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        setLoadingText("Fetching customer segments...");
        const segPromise = fetchAPI<{ data: Segment[] }>("/api/customers/segments");
        const overPromise = fetchAPI<typeof overview>("/api/customers/overview");
        
        const [segData, overData] = await Promise.all([segPromise, overPromise]);
        
        setLoadingText("Analyzing demographic data...");
        await new Promise(r => setTimeout(r, 300));
        setSegments(segData.data);
        
        setLoadingText("Compiling growth metrics...");
        await new Promise(r => setTimeout(r, 300));
        setOverview(overData);
        
        setLoadingText("Rendering customer dashboard...");
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.error("Failed to load customers data:", e);
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
          <Users size={24} className="text-brass animate-pulse" />
        </div>
        <h2 className="text-2xl font-display text-paper mb-2">Customer Intelligence</h2>
        <div className="flex items-center gap-2 text-muted">
          <div className="w-1.5 h-1.5 bg-signal rounded-full pulse-dot"></div>
          <p className="font-mono text-sm tracking-wider uppercase">{loadingText}</p>
        </div>
      </div>
    );
  }

  const s = overview?.summary;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display text-paper mb-1">
            Customer <span className="text-brass">Intelligence</span>
          </h1>
          <p className="text-muted text-sm font-mono uppercase tracking-wider">
            Segments, retention, and geographical footprint
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-surface2 border border-line hover:border-brass/50 text-paper px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            Run Campaign
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "Total Customers", value: formatNumber(s?.total || 0), icon: <Users size={20} />, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Total Orders", value: formatNumber(s?.orders || 0), icon: <ShoppingBag size={20} />, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
          { label: "Customer LTV", value: formatCurrency(s?.revenue || 0), icon: <DollarSign size={20} />, color: "text-signal", bg: "bg-signal/10", border: "border-signal/20" },
        ].map((card, i) => (
          <div key={i} className={`bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-brass/30 transition-colors animate-slide-up`} style={{ animationDelay: `${i * 100}ms` }}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              {card.icon}
            </div>
            
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
              {card.label}
            </p>
            <p className="text-3xl font-display text-paper">
              {card.value}
            </p>
            
            <div className="flex items-center gap-2 mt-4">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${card.bg} ${card.color} border ${card.border}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer growth */}
        <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center">
              <UserPlus size={16} className="text-brass" />
            </div>
            <div>
              <h2 className="text-xl font-display text-paper">Acquisition Velocity</h2>
              <span className="text-xs font-mono uppercase tracking-wider text-muted">New Customers per Month</span>
            </div>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview?.growth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-signal)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-signal)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-surface2)", border: "1px solid var(--color-line)", borderRadius: "12px", color: "var(--color-paper)", fontSize: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }}
                  itemStyle={{ color: "var(--color-signal)" }} />
                <Area type="monotone" dataKey="new_customers" name="New Customers" stroke="var(--color-signal)" strokeWidth={2} fill="url(#growthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional */}
        <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center">
              <MapPin size={16} className="text-brass" />
            </div>
            <div>
              <h2 className="text-xl font-display text-paper">Regional Revenue</h2>
              <span className="text-xs font-mono uppercase tracking-wider text-muted">Spend by Location</span>
            </div>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview?.regional || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                <XAxis dataKey="region" stroke="var(--color-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted)" fontSize={11} tickFormatter={(v) => formatCurrencyCompact(v)} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "var(--color-surface2)" }} contentStyle={{ background: "var(--color-surface2)", border: "1px solid var(--color-line)", borderRadius: "12px", color: "var(--color-paper)", fontSize: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }}
                  formatter={(v: any) => [formatCurrency(Number(v)), "Total Spent"]} />
                <Bar dataKey="total_spent" name="Total Spent" radius={[6, 6, 0, 0]} maxBarSize={45}>
                  {(overview?.regional || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={1 - (i * 0.1)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segment distribution */}
        <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center">
              <Target size={16} className="text-brass" />
            </div>
            <div>
              <h2 className="text-xl font-display text-paper">Customer Demographics</h2>
              <span className="text-xs font-mono uppercase tracking-wider text-muted">Audience Segmentation</span>
            </div>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segments} dataKey="count" nameKey="segment" cx="50%" cy="50%" innerRadius={70} outerRadius={110} strokeWidth={0} paddingAngle={2}>
                  {segments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={1 - (i * 0.15)} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-surface2)", border: "1px solid var(--color-line)", borderRadius: "12px", color: "var(--color-paper)", fontSize: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "var(--color-muted)" }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top customers table */}
        <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "500ms" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center">
              <Crown size={16} className="text-brass" />
            </div>
            <div>
              <h2 className="text-xl font-display text-paper">Key Accounts</h2>
              <span className="text-xs font-mono uppercase tracking-wider text-muted">Highest Value Customers</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left py-3 font-mono text-xs uppercase tracking-wider text-muted">Name</th>
                  <th className="text-left py-3 font-mono text-xs uppercase tracking-wider text-muted">Segment</th>
                  <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Orders</th>
                  <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(overview?.top_customers || []).slice(0, 5).map((c, i) => (
                  <tr key={i} className="hover:bg-surface2/50 transition-colors group">
                    <td className="py-4 font-medium text-paper flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface2 border border-line flex items-center justify-center text-[10px] text-brass">
                        {c.name.charAt(0)}
                      </div>
                      <span className="group-hover:text-brass transition-colors">{c.name}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md bg-surface2 border border-line text-muted">
                        {c.segment}
                      </span>
                    </td>
                    <td className="py-4 text-right text-muted">{formatNumber(c.total_orders)}</td>
                    <td className="py-4 text-right text-paper font-medium">{formatCurrency(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
