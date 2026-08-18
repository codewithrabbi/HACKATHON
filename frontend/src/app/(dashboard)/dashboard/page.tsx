"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { fetchAPI, formatCurrency, formatNumber, formatPercent, formatCurrencyCompact, formatDate } from "@/lib/api";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Brain,
  ArrowRight,
  Zap,
  BarChart2,
  LineChart as LineChartIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";
import Link from "next/link";

interface KPI {
  title: string;
  value: number;
  change: number;
  format: string;
  icon: string;
  extra?: string;
}

interface Alert {
  id: number;
  title: string;
  description: string;
  severity: string;
  category: string;
}

interface Insight {
  title: string;
  description: string;
  severity: string;
  category: string;
}

const iconMap: Record<string, React.ReactNode> = {
  "dollar-sign": <DollarSign size={20} />,
  "shopping-cart": <ShoppingCart size={20} />,
  "trending-up": <TrendingUp size={20} />,
  package: <Package size={20} />,
};

function formatValue(value: number, format: string) {
  if (format === "currency") return formatCurrency(value);
  if (format === "percent") return formatPercent(value);
  return formatNumber(value);
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [revenue, setRevenue] = useState<Array<{ date: string; revenue: number }>>([]);
  const [loadingText, setLoadingText] = useState("Initializing dashboard...");
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [days, setDays] = useState(7);
  const [isRevenueLoading, setIsRevenueLoading] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // 1. Header Banner (OpsPilot dark ink theme)
      doc.setFillColor(13, 18, 16); // #0D1210 ink
      doc.rect(0, 0, pageWidth, 75, "F");

      // Accent gold strip
      doc.setFillColor(212, 162, 76); // #D4A24C brass
      doc.rect(0, 72, pageWidth, 3, "F");

      // Brand Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(242, 239, 233); // #F2EFE9 paper
      doc.text("OpsPilot AI", margin, 38);

      // Subtitle
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(212, 162, 76);
      doc.text("EXECUTIVE OPERATIONS & INTELLIGENCE REPORT", margin, 54);

      // Date / Metadata on Right
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(139, 148, 144); // #8B9490 muted
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      doc.text(`Generated: ${dateStr}`, pageWidth - margin, 38, { align: "right" });
      doc.text("Status: Confidential", pageWidth - margin, 52, { align: "right" });

      let currentY = 105;

      // Helper function for section headers
      const drawSectionHeader = (title: string, tag?: string) => {
        doc.setFillColor(212, 162, 76);
        doc.circle(margin + 4, currentY - 4, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(20, 27, 24);
        doc.text(title, margin + 14, currentY);

        if (tag) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(139, 148, 144);
          doc.text(tag, pageWidth - margin, currentY, { align: "right" });
        }

        currentY += 15;
      };

      // 2. KPIs Section
      drawSectionHeader("Key Performance Indicators", "REAL-TIME METRICS");

      const cardWidth = (contentWidth - 15) / 2;
      const cardHeight = 58;

      kpis.forEach((kpi, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = margin + col * (cardWidth + 15);
        const y = currentY + row * (cardHeight + 10);

        // Card background
        doc.setFillColor(248, 250, 249);
        doc.setDrawColor(225, 230, 228);
        doc.roundedRect(x, y, cardWidth, cardHeight, 6, 6, "FD");

        // KPI Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 110, 105);
        doc.text(kpi.title.toUpperCase(), x + 12, y + 16);

        // KPI Value
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(13, 18, 16);
        doc.text(formatValue(kpi.value, kpi.format), x + 12, y + 36);

        // Change badge
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        const isPositive = kpi.change >= 0;
        if (isPositive) {
          doc.setTextColor(22, 101, 52); // green
          doc.text(`▲ +${kpi.change}% vs prev`, x + 12, y + 49);
        } else {
          doc.setTextColor(185, 28, 28); // red
          doc.text(`▼ ${kpi.change}% vs prev`, x + 12, y + 49);
        }
      });

      currentY += Math.ceil(kpis.length / 2) * (cardHeight + 10) + 20;

      // 3. Active Alerts Section
      drawSectionHeader("Active Operational Alerts", `${alerts.length} ISSUES`);

      if (alerts.length === 0) {
        doc.setFillColor(248, 250, 249);
        doc.roundedRect(margin, currentY, contentWidth, 30, 4, 4, "F");
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text("All systems operational. No active alerts flagged.", margin + 15, currentY + 18);
        currentY += 45;
      } else {
        alerts.slice(0, 3).forEach((alert) => {
          const isCritical = alert.severity === "critical";
          const isWarning = alert.severity === "warning";

          // Alert box
          doc.setFillColor(252, 252, 252);
          doc.setDrawColor(230, 230, 230);
          doc.roundedRect(margin, currentY, contentWidth, 42, 4, 4, "FD");

          // Left border indicator
          if (isCritical) doc.setFillColor(228, 87, 46);
          else if (isWarning) doc.setFillColor(212, 162, 76);
          else doc.setFillColor(127, 224, 180);
          doc.roundedRect(margin, currentY, 4, 42, 2, 2, "F");

          // Severity badge
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          if (isCritical) doc.setTextColor(220, 38, 38);
          else if (isWarning) doc.setTextColor(180, 83, 9);
          else doc.setTextColor(22, 101, 52);
          doc.text(`[${alert.severity.toUpperCase()}]`, margin + 12, currentY + 14);

          // Alert Title
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(20, 20, 20);
          doc.text(alert.title, margin + 65, currentY + 14);

          // Alert Description
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(90, 95, 92);
          const descLines = doc.splitTextToSize(alert.description, contentWidth - 25);
          doc.text(descLines[0] || "", margin + 12, currentY + 28);

          currentY += 48;
        });
        currentY += 10;
      }

      // 4. AI Insights Section
      drawSectionHeader("AI Intelligence & Strategic Insights", "EXPLAINABLE AI");

      if (insights.length === 0) {
        doc.setFillColor(248, 250, 249);
        doc.roundedRect(margin, currentY, contentWidth, 30, 4, 4, "F");
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text("AI insights processing underway.", margin + 15, currentY + 18);
        currentY += 45;
      } else {
        insights.slice(0, 3).forEach((insight) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          const descLines = doc.splitTextToSize(insight.description, contentWidth - 30);
          const boxHeight = 24 + descLines.length * 11;

          // Box
          doc.setFillColor(249, 250, 251);
          doc.setDrawColor(230, 235, 232);
          doc.roundedRect(margin, currentY, contentWidth, boxHeight, 4, 4, "FD");

          // Left Gold Line
          doc.setFillColor(212, 162, 76);
          doc.roundedRect(margin, currentY, 4, boxHeight, 2, 2, "F");

          // Insight Title
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(13, 18, 16);
          doc.text(insight.title, margin + 14, currentY + 15);

          // Insight Description
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(75, 85, 80);
          doc.text(descLines, margin + 14, currentY + 28);

          currentY += boxHeight + 8;
        });
      }

      // 5. Footer
      doc.setDrawColor(220, 225, 223);
      doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(140, 150, 145);
      doc.text(
        "OpsPilot AI Platform • Continuous Autonomous Business Auditing • Confidential",
        margin,
        pageHeight - 22
      );
      doc.text("Page 1 of 1", pageWidth - margin, pageHeight - 22, { align: "right" });

      // Save PDF
      doc.save(`OpsPilot_Executive_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    async function loadAll() {
      try {
        setLoadingText("Fetching core metrics & alerts...");
        const kpiPromise = fetchAPI<{ kpis: KPI[] }>("/api/dashboard/kpis");
        const alertPromise = fetchAPI<{ alerts: Alert[] }>("/api/dashboard/alerts");
        const revenuePromise = fetchAPI<{ data: Array<{ date: string; revenue: number }> }>(`/api/analytics/revenue?days=7`);
        
        const [kpiData, alertData, revenueData] = await Promise.all([kpiPromise, alertPromise, revenuePromise]);
        setKpis(kpiData.kpis);
        setAlerts(alertData.alerts);
        setRevenue(revenueData.data);
        
        setLoadingText("Analyzing revenue trends...");
        await new Promise(r => setTimeout(r, 600)); // Small UX delay
        
        setLoadingText("Generating AI Insights (this may take up to 10 seconds)...");
        const insightData = await fetchAPI<{ insights: Insight[] }>("/api/dashboard/insights");
        setInsights(insightData.insights);
        
        setLoadingText("Finalizing dashboard...");
        await new Promise(r => setTimeout(r, 400));
      } catch (e) {
        console.error("Failed to load dashboard:", e);
      } finally {
        setIsFullyLoaded(true);
      }
    }

    loadAll();
  }, []);

  useEffect(() => {
    if (isFullyLoaded) {
      async function updateRevenue() {
        setIsRevenueLoading(true);
        try {
          const rev = await fetchAPI<{ data: Array<{ date: string; revenue: number }> }>(`/api/analytics/revenue?days=${days}`);
          setRevenue(rev.data);
        } catch (e) {
          console.error("Failed to load revenue:", e);
        } finally {
          setIsRevenueLoading(false);
        }
      }
      updateRevenue();
    }
  }, [days, isFullyLoaded]);

  if (!isFullyLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-surface2 border border-line flex items-center justify-center mb-6 shadow-2xl relative">
          <div className="absolute inset-0 rounded-full border-2 border-brass border-t-transparent animate-spin"></div>
          <Zap size={24} className="text-brass animate-pulse" />
        </div>
        <h2 className="text-2xl font-display text-paper mb-2">OpsPilot AI</h2>
        <div className="flex items-center gap-2 text-muted">
          <div className="w-1.5 h-1.5 bg-signal rounded-full pulse-dot"></div>
          <p className="font-mono text-sm tracking-wider uppercase">{loadingText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display text-paper mb-1">
            Welcome to <span className="text-brass">OpsPilot</span>
          </h1>
          <p className="text-muted text-sm font-mono uppercase tracking-wider">
            Your AI-powered operations command center
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-surface2 border border-line hover:border-brass/50 text-paper px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-brass border-t-transparent animate-spin"></div>
                Generating...
              </>
            ) : (
              "Generate Report"
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.title}
            className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-brass/30 transition-colors"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              {iconMap[kpi.icon] || <Zap size={80} />}
            </div>
            
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
              {kpi.title}
            </p>
            <p className="text-3xl font-display text-paper">
              {formatValue(kpi.value, kpi.format)}
            </p>
            
            <div className="flex items-center gap-2 mt-4">
              <div className={`px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium ${
                kpi.change >= 0 ? "bg-signal/10 text-signal" : "bg-alert/10 text-alert"
              }`}>
                {kpi.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {kpi.change >= 0 ? "+" : ""}{kpi.change}%
              </div>
              <span className="text-xs text-muted">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl relative flex flex-col h-full">
          {isRevenueLoading && (
            <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm rounded-3xl z-10 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-brass border-t-transparent animate-spin"></div>
            </div>
          )}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-display text-paper">Revenue Trend</h2>
              <span className="text-xs font-mono uppercase tracking-wider text-muted">Last {days} days</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1 bg-surface2 p-1 rounded-lg">
                <button
                  onClick={() => setChartType("bar")}
                  className={`p-1.5 rounded-md transition-all ${chartType === "bar" ? "bg-brass/20 text-brass shadow-sm" : "text-muted hover:text-paper hover:bg-surface"}`}
                  title="Bar Chart"
                >
                  <BarChart2 size={14} />
                </button>
                <button
                  onClick={() => setChartType("line")}
                  className={`p-1.5 rounded-md transition-all ${chartType === "line" ? "bg-brass/20 text-brass shadow-sm" : "text-muted hover:text-paper hover:bg-surface"}`}
                  title="Line Graph"
                >
                  <LineChartIcon size={14} />
                </button>
              </div>
              <div className="h-4 w-px bg-line"></div>
              <div className="flex gap-1 bg-surface2 p-1 rounded-lg">
                {[7, 30, 90, 180].map(d => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      days === d ? "bg-brass/20 text-brass shadow-sm" : "text-muted hover:text-paper hover:bg-surface"
                    }`}
                  >
                    {d}D
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-brass pulse-dot mt-1" />
                <span className="text-xs text-brass font-medium hidden sm:inline">Live</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brass)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-brass)" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="var(--color-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatDate(v, { month: "short", day: "numeric" })}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  stroke="var(--color-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrencyCompact(v)}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-surface2)" }}
                  contentStyle={{
                    background: "var(--color-surface2)",
                    border: "1px solid var(--color-line)",
                    borderRadius: "12px",
                    color: "var(--color-paper)",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                  }}
                  itemStyle={{ color: "var(--color-brass)" }}
                  formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
                  labelFormatter={(l: any) =>
                    formatDate(String(l), {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                />
                {chartType === "bar" ? (
                  <Bar
                    dataKey="revenue"
                    fill="url(#revGrad)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-brass)"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: "var(--color-brass)", stroke: "var(--color-surface)", strokeWidth: 2 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Intelligence */}
        <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center">
              <Brain size={16} className="text-brass" />
            </div>
            <div>
              <h2 className="text-xl font-display text-paper">OpsPilot</h2>
              <span className="text-xs font-mono uppercase tracking-wider text-muted">AI Insights</span>
            </div>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[280px] pr-1">
            {insights.length > 0 ? (
              insights.map((insight, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-surface2 border border-line relative overflow-hidden animate-fade-in"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    insight.severity === "critical"
                      ? "bg-alert"
                      : insight.severity === "warning"
                      ? "bg-brass"
                      : "bg-signal"
                  }`} />
                  <p className="text-sm font-medium text-paper">{insight.title}</p>
                  <p className="text-xs mt-1.5 text-muted leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Brain className="text-muted mb-2 opacity-50" size={32} />
                <p className="text-sm text-muted">No insights available at the moment.</p>
              </div>
            )}
          </div>
          
          <Link
            href="/copilot"
            className="flex items-center justify-center gap-2 mt-6 py-3 bg-surface2 border border-line rounded-xl text-sm font-medium text-paper hover:border-brass/50 transition-colors"
          >
            Chat with AI <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-surface/80 backdrop-blur-xl border border-line rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-full bg-alert/5 blur-[80px] pointer-events-none" />
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-alert/10 border border-alert/20 flex items-center justify-center">
              <AlertTriangle size={16} className="text-alert" />
            </div>
            <div>
              <h2 className="text-xl font-display text-paper">Active Alerts</h2>
              <span className="text-xs font-mono uppercase tracking-wider text-muted">Requires attention</span>
            </div>
          </div>
          <Link
            href="/alerts"
            className="text-sm font-medium text-muted hover:text-brass transition-colors flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {alerts.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-4 p-4 rounded-2xl bg-surface2 border border-line hover:border-alert/30 transition-colors"
            >
              <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-md ${
                alert.severity === "critical" ? "bg-alert/10 text-alert border border-alert/20" :
                alert.severity === "warning" ? "bg-brass/10 text-brass border border-brass/20" :
                "bg-signal/10 text-signal border border-signal/20"
              }`}>
                {alert.severity}
              </span>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-medium text-paper">{alert.title}</p>
                <p className="text-xs mt-1.5 text-muted leading-relaxed truncate">
                  {alert.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
