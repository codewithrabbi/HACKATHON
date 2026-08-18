"use client";

import { useEffect, useState } from "react";
import { fetchAPI, formatNumber } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { AlertTriangle, CheckCircle, Truck, Package, Box, Zap } from "lucide-react";

interface InventoryItem {
  product_id: string; name: string; category: string; current_stock: number;
  reorder_point: number; max_capacity: number; warehouse: string;
  supplier_name: string; stock_status: string; capacity_pct: number;
}
interface RiskItem {
  name: string; current_stock: number; reorder_point: number; avg_daily_sales: number;
  estimated_days_until_stockout: number; supplier_name: string; avg_delivery_days: number; urgency: string;
}
interface Supplier {
  name: string; country: string; avg_delivery_days: number; reliability_score: number;
  products_supplied: number; risk_level: string; issues: string[];
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState({ total_products: 0, critical: 0, low: 0, healthy: 0, health_score: 0 });
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingText, setLoadingText] = useState("Initializing inventory data...");
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    async function loadAll() {
      try {
        setLoadingText("Fetching stock levels & status...");
        const invPromise = fetchAPI<{ items: InventoryItem[]; summary: typeof summary }>("/api/inventory/status");
        const riskPromise = fetchAPI<{ at_risk_products: RiskItem[] }>("/api/inventory/risks");
        const supPromise = fetchAPI<{ suppliers: Supplier[] }>("/api/inventory/suppliers");
        
        const [invData, riskData, supData] = await Promise.all([invPromise, riskPromise, supPromise]);
        setItems(invData.items);
        setSummary(invData.summary);
        
        setLoadingText("Analyzing stockout risks...");
        await new Promise(r => setTimeout(r, 300));
        setRisks(riskData.at_risk_products);
        
        setLoadingText("Evaluating supplier reliability...");
        await new Promise(r => setTimeout(r, 300));
        setSuppliers(supData.suppliers);
        
        setLoadingText("Rendering dashboard...");
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.error("Failed to load inventory:", e);
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
          <Box size={24} className="text-brass animate-pulse" />
        </div>
        <h2 className="text-2xl font-display text-paper mb-2">Inventory System</h2>
        <div className="flex items-center gap-2 text-muted">
          <div className="w-1.5 h-1.5 bg-signal rounded-full pulse-dot"></div>
          <p className="font-mono text-sm tracking-wider uppercase">{loadingText}</p>
        </div>
      </div>
    );
  }

  const filteredItems = statusFilter 
    ? items.filter(i => statusFilter === "healthy" ? ["normal", "overstocked"].includes(i.stock_status) : i.stock_status === statusFilter) 
    : items;

  const statusColor = (s: string) =>
    s === "critical" ? "#D32F2F"
    : s === "low" ? "#D32F2F"
    : s === "overstocked" ? "#06b6d4"
    : "#2E7D32";

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display text-paper mb-1">
            Inventory <span className="text-brass">Control</span>
          </h1>
          <p className="text-muted text-sm font-mono uppercase tracking-wider">
            Real-time stock levels, risks & suppliers
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-surface2 border border-line hover:border-brass/50 text-paper px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            Generate PO
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: "Total Products", value: summary.total_products, filter: null, icon: <Package size={20} />, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Healthy Stock", value: summary.healthy, filter: "healthy", icon: <CheckCircle size={20} />, color: "text-signal", bg: "bg-signal/10", border: "border-signal/20" },
          { label: "Low Stock", value: summary.low, filter: "low", icon: <AlertTriangle size={20} />, color: "text-brass", bg: "bg-brass/10", border: "border-brass/20" },
          { label: "Critical Risk", value: summary.critical, filter: "critical", icon: <AlertTriangle size={20} />, color: "text-alert", bg: "bg-alert/10", border: "border-alert/20" },
        ].map((card, i) => (
          <div key={i} 
            onClick={() => setStatusFilter(statusFilter === card.filter ? null : card.filter)}
            className={`bg-surface/80 backdrop-blur-xl border ${statusFilter === card.filter ? "border-brass shadow-[0_0_15px_rgba(212,175,55,0.15)]" : "border-line hover:border-brass/30"} rounded-3xl p-6 shadow-2xl relative overflow-hidden group cursor-pointer transition-all animate-slide-up`} 
            style={{ animationDelay: `${i * 100}ms` }}>
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

      {/* Stock levels chart */}
      <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center">
            <Box size={16} className="text-brass" />
          </div>
          <div>
            <h2 className="text-xl font-display text-paper">Stock Levels vs Reorder Points</h2>
            <span className="text-xs font-mono uppercase tracking-wider text-muted">Current Inventory Status</span>
          </div>
        </div>
        
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "var(--color-surface2)" }} contentStyle={{ background: "var(--color-surface2)", border: "1px solid var(--color-line)", borderRadius: "12px", color: "var(--color-paper)", fontSize: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }} itemStyle={{ color: "var(--color-paper)" }} />
              <Bar dataKey="current_stock" name="Current Stock" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {filteredItems.map((item, i) => (
                  <Cell key={i} fill={statusColor(item.stock_status)} />
                ))}
              </Bar>
              <Bar dataKey="reorder_point" name="Reorder Point" fill="#ED6C02" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock-out risks */}
        <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-alert/10 border border-alert/20 flex items-center justify-center">
                <AlertTriangle size={16} className="text-alert" />
              </div>
              <div>
                <h2 className="text-xl font-display text-paper">Stock-Out Risks</h2>
                <span className="text-xs font-mono uppercase tracking-wider text-muted">Requires Immediate Action</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {risks.map((r) => (
              <div key={r.name} className="p-4 rounded-2xl bg-surface2 border border-line hover:border-alert/30 transition-colors relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${r.urgency === "high" ? "bg-alert" : r.urgency === "medium" ? "bg-brass" : "bg-signal"}`} />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-paper">{r.name}</span>
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md ${
                    r.urgency === "high" ? "bg-alert/10 text-alert border border-alert/20" : 
                    r.urgency === "medium" ? "bg-brass/10 text-brass border border-brass/20" : 
                    "bg-signal/10 text-signal border border-signal/20"
                  }`}>
                    {r.urgency} Risk
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted">
                  <span className="bg-surface px-2 py-1 rounded-md border border-line">Stock: <span className="text-paper">{r.current_stock}</span></span>
                  <span className="bg-surface px-2 py-1 rounded-md border border-line">Daily Sales: <span className="text-paper">~{r.avg_daily_sales}</span></span>
                  <span className={`px-2 py-1 rounded-md border ${
                    r.estimated_days_until_stockout < 7 ? "bg-alert/10 text-alert border-alert/20 font-medium" : "bg-surface border-line"
                  }`}>
                    {r.estimated_days_until_stockout} days left
                  </span>
                </div>
              </div>
            ))}
            {risks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="text-signal mb-2 opacity-50" size={32} />
                <p className="text-sm text-muted">No products at risk of stock-out.</p>
              </div>
            )}
          </div>
        </div>

        {/* Supplier performance */}
        <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center">
                <Truck size={16} className="text-brass" />
              </div>
              <div>
                <h2 className="text-xl font-display text-paper">Supplier Performance</h2>
                <span className="text-xs font-mono uppercase tracking-wider text-muted">Delivery & Reliability</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {suppliers.map((s) => (
              <div key={s.name} className="p-4 rounded-2xl bg-surface2 border border-line hover:border-brass/30 transition-colors relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${s.risk_level === "high" ? "bg-alert" : s.risk_level === "medium" ? "bg-brass" : "bg-signal"}`} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-paper">{s.name}</span>
                    <span className="text-[10px] font-mono text-muted bg-surface px-2 py-0.5 rounded-md border border-line">{s.country}</span>
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md ${
                    s.risk_level === "high" ? "bg-alert/10 text-alert border border-alert/20" : 
                    s.risk_level === "medium" ? "bg-brass/10 text-brass border border-brass/20" : 
                    "bg-signal/10 text-signal border border-signal/20"
                  }`}>
                    {s.risk_level} Risk
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted">
                  <span className="bg-surface px-2 py-1 rounded-md border border-line">Avg Delivery: <span className="text-paper">{s.avg_delivery_days} days</span></span>
                  <span className="bg-surface px-2 py-1 rounded-md border border-line">Reliability: <span className="text-paper">{(s.reliability_score * 100).toFixed(0)}%</span></span>
                  <span className="bg-surface px-2 py-1 rounded-md border border-line">Products: <span className="text-paper">{s.products_supplied}</span></span>
                </div>
                {s.issues.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {s.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-alert bg-alert/5 p-2 rounded-lg border border-alert/10">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Details Table */}
      <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "500ms" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center">
            <Package size={16} className="text-brass" />
          </div>
          <div>
            <h2 className="text-xl font-display text-paper">Inventory Details</h2>
            <span className="text-xs font-mono uppercase tracking-wider text-muted">Complete Stock List</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-3 font-mono text-xs uppercase tracking-wider text-muted">Product</th>
                <th className="text-left py-3 font-mono text-xs uppercase tracking-wider text-muted">Category</th>
                <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Current Stock</th>
                <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Reorder Point</th>
                <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredItems.map((item) => (
                <tr key={item.product_id} className="hover:bg-surface2/50 transition-colors group">
                  <td className="py-4">
                    <span className="font-medium text-paper group-hover:text-brass transition-colors">{item.name}</span>
                  </td>
                  <td className="py-4 text-muted">{item.category}</td>
                  <td className="text-right py-4 text-paper font-medium">{formatNumber(item.current_stock)}</td>
                  <td className="text-right py-4 text-muted">{formatNumber(item.reorder_point)}</td>
                  <td className="text-right py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-widest ${
                      item.stock_status === "critical" ? "bg-alert/10 text-alert border border-alert/20" : 
                      item.stock_status === "low" ? "bg-brass/10 text-brass border border-brass/20" : 
                      item.stock_status === "overstocked" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                      "bg-signal/10 text-signal border border-signal/20"
                    }`}>
                      {item.stock_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted font-mono text-sm">
              No products found for this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
