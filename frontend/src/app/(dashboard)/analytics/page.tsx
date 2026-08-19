"use client";

import { useEffect, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { fetchAPI, formatCurrency, formatCurrencyCompact, formatNumber, formatDate } from "@/lib/api";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { BarChart3, TrendingUp, Package, MapPin, Zap } from "lucide-react";

const COLORS = ["#d4af37", "#00f2fe", "#f43f5e", "#10b981", "#8b5cf6", "#f59e0b", "#3b82f6"];

interface ProductData {
  name: string; category: string; revenue: number; units_sold: number;
  profit: number; margin_pct: number;
}
interface RegionData {
  region: string; revenue: number; units: number; orders: number; percentage: number;
}
interface CategoryData {
  category: string; revenue: number; units: number; product_count: number;
}

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState<Array<{ date: string; revenue: number; units: number }>>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [tableProducts, setTableProducts] = useState<ProductData[]>([]);
  
  const [loadingText, setLoadingText] = useState("Initializing analytics...");
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [revenueDays, setRevenueDays] = useState(30);
  const [productsDays, setProductsDays] = useState(30);
  const [regionsDays, setRegionsDays] = useState(30);
  const [tableDays, setTableDays] = useState(30);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingText("Fetching analytics data...");
        const [revData, prodData, regData, catData] = await Promise.all([
          fetchAPI<{ data: typeof revenue }>(`/api/analytics/revenue?days=30`),
          fetchAPI<{ data: ProductData[] }>(`/api/analytics/products?days=30`),
          fetchAPI<{ data: RegionData[] }>(`/api/analytics/regions?days=30`),
          fetchAPI<{ data: CategoryData[] }>(`/api/analytics/categories?days=30`),
        ]);
        
        setRevenue(revData.data);
        setProducts(prodData.data);
        setTableProducts(prodData.data);
        setRegions(regData.data);
        setCategories(catData.data);
        
        setLoadingText("Rendering visualizations...");
        await new Promise(r => setTimeout(r, 400));
      } catch (e) {
        console.error("Failed to load analytics:", e);
      } finally {
        setIsFullyLoaded(true);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (isFullyLoaded) fetchAPI<{ data: typeof revenue }>(`/api/analytics/revenue?days=${revenueDays}`).then(r => setRevenue(r.data));
  }, [revenueDays, isFullyLoaded]);

  useEffect(() => {
    if (isFullyLoaded) fetchAPI<{ data: ProductData[] }>(`/api/analytics/products?days=${productsDays}`).then(r => setProducts(r.data));
  }, [productsDays, isFullyLoaded]);

  useEffect(() => {
    if (isFullyLoaded) fetchAPI<{ data: RegionData[] }>(`/api/analytics/regions?days=${regionsDays}`).then(r => setRegions(r.data));
  }, [regionsDays, isFullyLoaded]);

  useEffect(() => {
    if (isFullyLoaded) fetchAPI<{ data: ProductData[] }>(`/api/analytics/products?days=${tableDays}`).then(r => setTableProducts(r.data));
  }, [tableDays, isFullyLoaded]);

  const DaySwitcher = ({ days, setDays }: { days: number, setDays: (d: number) => void }) => (
    <div className="flex gap-1 bg-surface2 p-1 rounded-lg border border-line">
      {[7, 30, 90, 180].map(d => (
        <button
          key={d}
          onClick={() => setDays(d)}
          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
            days === d ? "bg-brass/20 text-brass shadow-sm" : "text-muted hover:text-paper hover:bg-surface"
          }`}
        >
          {d}D
        </button>
      ))}
    </div>
  );

  if (!isFullyLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-surface2 border border-line flex items-center justify-center mb-6 shadow-2xl relative">
          <div className="absolute inset-0 rounded-full border-2 border-brass border-t-transparent animate-spin"></div>
          <BarChart3 size={24} className="text-brass animate-pulse" />
        </div>
        <h2 className="text-2xl font-display text-paper mb-2">Analytics Engine</h2>
        <div className="flex items-center gap-2 text-muted">
          <div className="w-1.5 h-1.5 bg-signal rounded-full pulse-dot"></div>
          <p className="font-mono text-sm tracking-wider uppercase">{loadingText}</p>
        </div>
      </div>
    );
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = 595.28;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // Header Banner
      doc.setFillColor(13, 18, 16);
      doc.rect(0, 0, pageWidth, 75, "F");

      // Accent gold strip
      doc.setFillColor(212, 162, 76);
      doc.rect(0, 72, pageWidth, 3, "F");

      // Brand Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(242, 239, 233);
      doc.text("OpsPilot AI", margin, 38);

      // Subtitle
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(212, 162, 76);
      doc.text("ANALYTICS & INTELLIGENCE REPORT", margin, 54);

      let currentY = 110;

      // --- 1. Calculate Summary Metrics ---
      const totalRevenue = revenue.reduce((sum, item) => sum + item.revenue, 0);
      const totalUnits = revenue.reduce((sum, item) => sum + item.units, 0);
      const topProd = products.length > 0 ? products[0] : null;
      const topRegion = regions.length > 0 ? regions[0] : null;

      // --- 2. Executive Summary Box ---
      doc.setFillColor(248, 250, 249);
      doc.setDrawColor(225, 230, 228);
      doc.roundedRect(margin, currentY, contentWidth, 65, 6, 6, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(13, 18, 16);
      doc.text("Executive Summary", margin + 15, currentY + 22);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 80);
      let summaryText = `Over the selected period, total recorded revenue reached ${formatCurrency(totalRevenue)} with ${formatNumber(totalUnits)} units sold. `;
      if (topProd) summaryText += `The top performing product was ${topProd.name} (${formatCurrency(topProd.revenue)}). `;
      if (topRegion) summaryText += `${topRegion.region} emerged as the top region.`;
      
      const splitSummary = doc.splitTextToSize(summaryText, contentWidth - 30);
      doc.text(splitSummary, margin + 15, currentY + 40);

      currentY += 85;

      // --- 3. KPI Cards ---
      const cardWidth = (contentWidth - 20) / 3;
      const cardHeight = 55;

      const drawKPI = (x: number, y: number, title: string, value: string) => {
        doc.setFillColor(252, 253, 252);
        doc.setDrawColor(225, 230, 228);
        doc.roundedRect(x, y, cardWidth, cardHeight, 4, 4, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 110, 105);
        doc.text(title.toUpperCase(), x + 12, y + 20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(13, 18, 16);
        let valStr = value;
        if (valStr.length > 15) valStr = valStr.substring(0, 15) + "..";
        doc.text(valStr, x + 12, y + 42);
      };

      drawKPI(margin, currentY, "TOTAL REVENUE", formatCurrency(totalRevenue));
      drawKPI(margin + cardWidth + 10, currentY, "UNITS SOLD", formatNumber(totalUnits));
      drawKPI(margin + (cardWidth + 10) * 2, currentY, "TOP PRODUCT", topProd ? topProd.name : "N/A");

      currentY += cardHeight + 35;

      // --- 4. Render Charts with Insights ---
      const charts = [
        { id: "analytics-rev-chart", title: "Revenue Over Time" },
        { id: "analytics-prod-chart", title: "Top Products by Revenue" },
        { id: "analytics-reg-chart", title: "Regional Distribution" },
        { id: "analytics-table-chart", title: "Product Intelligence Table" }
      ];

      for (const chart of charts) {
        const chartElement = document.getElementById(chart.id);
        if (!chartElement) continue;

        // Render to canvas
        const canvasWidth = chartElement.offsetWidth;
        const canvasHeight = chartElement.offsetHeight;
        const imgData = await toPng(chartElement, {
          backgroundColor: "#131816",
          pixelRatio: 2,
        });
        const imgHeight = (canvasHeight * contentWidth) / canvasWidth;

        // Check if page break is needed for header + text + image
        if (currentY + imgHeight + 40 > 800) {
          doc.addPage();
          currentY = margin;
        }

        // Draw Section Header
        doc.setFillColor(212, 162, 76);
        doc.circle(margin + 4, currentY - 4, 3, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(20, 27, 24);
        doc.text(chart.title, margin + 14, currentY);
        
        // Add insight text
        let insightText = "";
        if (chart.id === "analytics-rev-chart") {
            insightText = `Visualizes the daily revenue trend. Average daily revenue is approximately ${formatCurrency(totalRevenue / (revenue.length || 1))}.`;
        } else if (chart.id === "analytics-prod-chart" && topProd) {
            insightText = `${topProd.name} contributes significantly, with a profit margin of ${topProd.margin_pct}%.`;
        } else if (chart.id === "analytics-reg-chart" && topRegion) {
            insightText = `${topRegion.region} accounts for ${topRegion.percentage}% of the total volume.`;
        } else if (chart.id === "analytics-table-chart") {
            insightText = `Comprehensive breakdown of product-level metrics and profitability.`;
        }

        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(120, 128, 124);
        doc.text(insightText, margin + 14, currentY + 16);

        currentY += 28;

        // Draw Image
        doc.addImage(imgData, "PNG", margin, currentY, contentWidth, imgHeight);
        currentY += imgHeight + 35;
      }

      doc.save("opspilot-analytics-report.pdf");
    } catch (error: any) {
      console.error("Failed to generate report:", error);
      alert("Failed to generate report: " + (error?.message || String(error)));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display text-paper mb-1">
            Analytics <span className="text-brass">Hub</span>
          </h1>
          <p className="text-muted text-sm font-mono uppercase tracking-wider">
            Deep dive into business performance & trends
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={handleGenerateReport} 
            disabled={isGenerating}
            className={`bg-brass text-black px-4 py-2 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all flex items-center gap-2 h-[36px] ${isGenerating ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isGenerating ? "Exporting..." : "Export Report"}
          </button>
        </div>
      </div>

      <div id="analytics-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue over time */}
        <div className="lg:col-span-2 bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center">
                <TrendingUp size={16} className="text-brass" />
              </div>
              <div>
                <h2 className="text-xl font-display text-paper">Revenue Over Time</h2>
                <span className="text-xs font-mono uppercase tracking-wider text-muted">Historical Trend</span>
              </div>
            </div>
            <DaySwitcher days={revenueDays} setDays={setRevenueDays} />
          </div>
          
          <div id="analytics-rev-chart" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brass)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-brass)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(v) => formatDate(v, { month: "short", day: "numeric" })}
                  interval="preserveStartEnd" minTickGap={40} />
                <YAxis stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(v) => formatCurrencyCompact(v)} />
                <Tooltip contentStyle={{ background: "var(--color-surface2)", border: "1px solid var(--color-line)", borderRadius: "12px", color: "var(--color-paper)", fontSize: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }}
                  itemStyle={{ color: "var(--color-brass)" }}
                  formatter={(v: any) => [formatCurrency(Number(v)), "Revenue"]}
                  labelFormatter={(l: any) => formatDate(String(l), { month: "long", day: "numeric", year: "numeric" })} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-brass)" strokeWidth={2} fill="url(#revGradAnalytics)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product performance */}
        <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center">
                <Package size={16} className="text-brass" />
              </div>
              <div>
                <h2 className="text-xl font-display text-paper">Top Products</h2>
                <span className="text-xs font-mono uppercase tracking-wider text-muted">By Revenue</span>
              </div>
            </div>
            <DaySwitcher days={productsDays} setDays={setProductsDays} />
          </div>
          
          <div id="analytics-prod-chart" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={products.slice(0, 5)} layout="vertical" margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(v) => formatCurrencyCompact(v)} />
                <YAxis type="category" dataKey="name" stroke="var(--color-muted)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip cursor={{ fill: "var(--color-surface2)" }} contentStyle={{ background: "var(--color-surface2)", border: "1px solid var(--color-line)", borderRadius: "12px", color: "var(--color-paper)", fontSize: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }}
                  itemStyle={{ color: "var(--color-brass)" }}
                  formatter={(v: any) => [formatCurrency(Number(v)), "Revenue"]} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={30}>
                  {products.slice(0, 5).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional breakdown */}
        <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center">
                <MapPin size={16} className="text-brass" />
              </div>
              <div>
                <h2 className="text-xl font-display text-paper">Regional Distribution</h2>
                <span className="text-xs font-mono uppercase tracking-wider text-muted">Revenue Share</span>
              </div>
            </div>
            <DaySwitcher days={regionsDays} setDays={setRegionsDays} />
          </div>
          
          <div id="analytics-reg-chart" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={regions} dataKey="revenue" nameKey="region" cx="50%" cy="50%" innerRadius={70} outerRadius={110} strokeWidth={0} paddingAngle={2}>
                  {regions.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-surface2)", border: "1px solid var(--color-line)", borderRadius: "12px", color: "var(--color-paper)", fontSize: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }}
                  itemStyle={{ color: "var(--color-brass)" }}
                  formatter={(v: any) => [formatCurrency(Number(v)), "Revenue"]} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "var(--color-muted)" }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Details Table */}
        <div className="lg:col-span-2 bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center">
                <BarChart3 size={16} className="text-brass" />
              </div>
              <div>
                <h2 className="text-xl font-display text-paper">Product Intelligence</h2>
                <span className="text-xs font-mono uppercase tracking-wider text-muted">Detailed Metrics</span>
              </div>
            </div>
            <DaySwitcher days={tableDays} setDays={setTableDays} />
          </div>
          
          <div id="analytics-table-chart" className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left py-3 font-mono text-xs uppercase tracking-wider text-muted">Product</th>
                  <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Revenue</th>
                  <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Units Sold</th>
                  <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Profit</th>
                  <th className="text-right py-3 font-mono text-xs uppercase tracking-wider text-muted">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {tableProducts.map((p) => (
                  <tr key={p.name} className="hover:bg-surface2/50 transition-colors group">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-paper group-hover:text-brass transition-colors">{p.name}</span>
                        <span className="text-xs text-muted mt-0.5">{p.category}</span>
                      </div>
                    </td>
                    <td className="text-right py-4 text-paper font-medium">{formatCurrency(p.revenue)}</td>
                    <td className="text-right py-4 text-muted">{formatNumber(p.units_sold)}</td>
                    <td className="text-right py-4 text-paper">{formatCurrency(p.profit)}</td>
                    <td className="text-right py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        p.margin_pct >= 50 ? "bg-signal/10 text-signal border border-signal/20" : 
                        p.margin_pct >= 30 ? "bg-brass/10 text-brass border border-brass/20" : 
                        "bg-alert/10 text-alert border border-alert/20"
                      }`}>
                        {p.margin_pct}%
                      </span>
                    </td>
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
