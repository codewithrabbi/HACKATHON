"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { User } from "lucide-react";

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Scroll reveal observer
    const els = document.querySelectorAll(".fade-up");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));

    return () => {
      els.forEach((el) => io.unobserve(el));
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="bg-ink text-paper font-body grain relative overflow-x-hidden min-h-screen selection:bg-brass selection:text-ink">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-line/70 bg-ink/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 4H20V20H4V4Z" stroke="#D4A24C" strokeWidth="1.4" />
              <path d="M8 10L11 13L16 7" stroke="#D4A24C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-xl tracking-tight">OpsPilot</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted font-medium">
            <a href="#features" className="hover:text-paper transition brass-underline pb-1">Features</a>
            <a href="#trace" className="hover:text-paper transition brass-underline pb-1">Explainability</a>
            <a href="#pricing" className="hover:text-paper transition brass-underline pb-1">Pricing</a>
            <a href="#faq" className="hover:text-paper transition brass-underline pb-1">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium bg-surface2 border border-line hover:border-brass/50 text-paper px-4 py-2 rounded-full transition shadow-md hover:bg-surface/60">
                <div className="w-5 h-5 bg-brass/20 rounded-full flex items-center justify-center">
                  <User size={12} className="text-brass" />
                </div>
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-sm text-muted hover:text-paper transition">Log in</Link>
                <Link href="/register" className="text-sm font-medium bg-brass text-ink px-4 py-2 rounded-full hover:bg-brasslight transition shadow-lg shadow-brass/20">Start free</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-40 pb-28 px-6 lg:px-10 glow noise">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="fade-up">
            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-brass border border-brass/30 rounded-full px-3 py-1 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-signal"></span> AI BUSINESS ANALYST
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.08] tracking-tight mb-6">
              Ask your business anything.<br className="hidden sm:block" /> Get an <span className="italic text-brasslight">answer you can audit.</span>
            </h1>
            <p className="text-muted text-lg leading-relaxed mb-9 max-w-lg">
              OpsPilot reads your revenue, sales, and inventory like an analyst who never sleeps — then shows exactly which numbers it used to get there.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/register" className="bg-brass text-ink font-medium px-6 py-3.5 rounded-full hover:bg-brasslight transition">Start free — no card needed</Link>
              <a href="#trace" className="flex items-center gap-2 text-paper font-medium px-2 py-3.5 hover:text-brasslight transition">
                <span className="w-9 h-9 rounded-full border border-line flex items-center justify-center">▶</span> Watch it think
              </a>
            </div>
            <div className="mt-12 flex items-center gap-6 text-xs text-muted font-mono">
              <span>SOC 2 in progress</span><span className="w-1 h-1 rounded-full bg-line"></span>
              <span>Bank-grade encryption</span><span className="w-1 h-1 rounded-full bg-line"></span>
              <span>GDPR ready</span>
            </div>
          </div>

          {/* NEW HERO GRAPHIC: BENTO OVERLAPPING CARDS */}
          <div className="fade-up float relative h-[350px] sm:h-[450px] w-full flex items-center justify-center mt-10 lg:mt-0 scale-[0.85] sm:scale-100 origin-center">
            
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-brass/20 blur-[80px] rounded-full"></div>

            {/* Card 1: AI Chat (Top Left) */}
            <div className="absolute top-0 sm:top-10 left-0 sm:left-4 z-20 bg-surface2/90 backdrop-blur-md border border-line rounded-2xl p-4 shadow-xl max-w-[200px] sm:max-w-[240px] transform -rotate-6 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-full bg-brass/20 flex items-center justify-center text-xs">👤</div>
                <p className="text-[10px] font-mono text-muted">USER</p>
              </div>
              <p className="text-sm text-paper leading-snug">Why did our margins drop in Europe last week?</p>
            </div>

            {/* Card 2: Main Insight (Center) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-surface/95 backdrop-blur-xl border border-brass/30 rounded-2xl p-6 shadow-2xl w-[260px] sm:w-[320px]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-signal pulse-dot"></span>
                  <span className="text-xs font-mono text-signal tracking-wide">LIVE ANALYSIS</span>
                </div>
                <span className="text-lg">🤖</span>
              </div>
              <p className="text-4xl font-display text-paper mb-1">€1.2M</p>
              <p className="text-xs text-muted mb-6">European Margins (Week 32)</p>
              
              {/* Mini Bar Chart */}
              <div className="flex items-end gap-1.5 sm:gap-2 h-16 w-full opacity-90">
                <div className="w-1/6 bg-brass/20 hover:bg-brass/50 transition-colors h-3/5 rounded-t-sm"></div>
                <div className="w-1/6 bg-brass/20 hover:bg-brass/50 transition-colors h-4/5 rounded-t-sm"></div>
                <div className="w-1/6 bg-brass/20 hover:bg-brass/50 transition-colors h-full rounded-t-sm"></div>
                <div className="w-1/6 bg-brass/20 hover:bg-brass/50 transition-colors h-2/5 rounded-t-sm"></div>
                <div className="w-1/6 bg-alert/80 h-1/5 rounded-t-sm relative group cursor-pointer">
                   {/* Tooltip on hover */}
                   <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-ink text-[11px] font-mono text-paper px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-alert/50 z-50">
                     -18% Drop
                   </div>
                </div>
                <div className="w-1/6 bg-brass/20 hover:bg-brass/50 transition-colors h-3/5 rounded-t-sm"></div>
              </div>
            </div>

            {/* Card 3: Alert (Bottom Right) */}
            <div className="absolute bottom-0 sm:bottom-12 right-0 sm:right-4 z-30 bg-ink/95 backdrop-blur-md border border-alert/40 rounded-2xl p-4 sm:p-5 shadow-xl max-w-[220px] sm:max-w-[260px] transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="flex gap-3 sm:gap-4">
                <div className="mt-1 w-6 h-6 rounded-full bg-alert/20 flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 bg-alert rounded-full"></span>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-alert mb-1.5">ROOT CAUSE FOUND</p>
                  <p className="text-xs sm:text-sm text-paper/90 leading-relaxed">
                    Logistics cost spiked by <span className="text-alert font-medium">24%</span> due to expedited shipping in Germany.
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* TRUST TICKER */}
      <section className="border-y border-line/70 py-6 overflow-hidden">
        <div className="ticker-track flex gap-16 whitespace-nowrap font-mono text-sm text-muted w-max">
          <span>WESTBRIDGE RETAIL</span><span>NORTHFIELD FOODS</span><span>ORBIT COMMERCE</span><span>PARALLEL LOGISTICS</span><span>HARLOW MANUFACTURING</span><span>KESTREL GROUP</span>
          <span>WESTBRIDGE RETAIL</span><span>NORTHFIELD FOODS</span><span>ORBIT COMMERCE</span><span>PARALLEL LOGISTICS</span><span>HARLOW MANUFACTURING</span><span>KESTREL GROUP</span>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="px-6 lg:px-10 py-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14">
          <div className="fade-up bg-surface/60 border border-line rounded-2xl p-8">
            <p className="font-mono text-xs tracking-widest text-muted mb-4">THE OLD WAY</p>
            <h3 className="font-display text-2xl mb-6">Dashboards you have to interrogate</h3>
            <ul className="space-y-4 text-muted">
              <li className="flex gap-3"><span className="text-alert mt-1">✕</span> Insights buried three filters deep in a BI tool nobody opens twice</li>
              <li className="flex gap-3"><span className="text-alert mt-1">✕</span> An analyst spends two days explaining why revenue dipped</li>
              <li className="flex gap-3"><span className="text-alert mt-1">✕</span> Anomalies get noticed only after the quarter is already lost</li>
            </ul>
          </div>
          <div className="fade-up bg-surface2/60 border border-brass/25 rounded-2xl p-8">
            <p className="font-mono text-xs tracking-widest text-brass mb-4">WITH OpsPilot</p>
            <h3 className="font-display text-2xl mb-6">Answers that show their work</h3>
            <ul className="space-y-4 text-paper">
              <li className="flex gap-3"><span className="text-signal mt-1">✓</span> Ask in plain language, get a cited answer in seconds</li>
              <li className="flex gap-3"><span className="text-signal mt-1">✓</span> Root-cause analysis runs automatically, not on request</li>
              <li className="flex gap-3"><span className="text-signal mt-1">✓</span> Anomalies and stock-outs surface before they cost you</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 lg:px-10 py-24 bg-surface/40 border-y border-line/60">
        <div className="max-w-7xl mx-auto">
          <div className="fade-up max-w-2xl mb-16">
            <p className="font-mono text-xs tracking-widest text-brass mb-4">CAPABILITIES</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl leading-tight">One analyst, eight ways of paying attention.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature cards */}
            <div className="fade-up group bg-surface border border-line rounded-xl p-6 hover:border-brass/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-brass/10 flex items-center justify-center mb-5 text-brass">🤖</div>
              <h4 className="font-medium mb-2">AI Business Analyst</h4>
              <p className="text-sm text-muted leading-relaxed">Ask questions about your business data in plain language, no query syntax required.</p>
            </div>
            <div className="fade-up group bg-surface border border-line rounded-xl p-6 hover:border-brass/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-brass/10 flex items-center justify-center mb-5 text-brass">📊</div>
              <h4 className="font-medium mb-2">Real-Time Intelligence</h4>
              <p className="text-sm text-muted leading-relaxed">Revenue, sales, inventory, and operational KPIs, live and always current.</p>
            </div>
            <div className="fade-up group bg-surface border border-line rounded-xl p-6 hover:border-brass/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-brass/10 flex items-center justify-center mb-5 text-brass">🔎</div>
              <h4 className="font-medium mb-2">Root-Cause Analysis</h4>
              <p className="text-sm text-muted leading-relaxed">Identifies the actual factors behind an unusual change, not just the change itself.</p>
            </div>
            <div className="fade-up group bg-surface border border-line rounded-xl p-6 hover:border-brass/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-brass/10 flex items-center justify-center mb-5 text-brass">🚨</div>
              <h4 className="font-medium mb-2">Anomaly Detection</h4>
              <p className="text-sm text-muted leading-relaxed">Unusual sales, inventory, or operational patterns are flagged automatically.</p>
            </div>
            <div className="fade-up group bg-surface border border-line rounded-xl p-6 hover:border-brass/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-brass/10 flex items-center justify-center mb-5 text-brass">📈</div>
              <h4 className="font-medium mb-2">Demand Forecasting</h4>
              <p className="text-sm text-muted leading-relaxed">Predicts future demand and warns of stock-outs before they happen.</p>
            </div>
            <div className="fade-up group bg-surface border border-line rounded-xl p-6 hover:border-brass/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-brass/10 flex items-center justify-center mb-5 text-brass">💡</div>
              <h4 className="font-medium mb-2">Action Recommendations</h4>
              <p className="text-sm text-muted leading-relaxed">Suggests the practical next step for every problem it detects.</p>
            </div>
            <div className="fade-up group bg-surface border border-line rounded-xl p-6 hover:border-brass/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-brass/10 flex items-center justify-center mb-5 text-brass">🧾</div>
              <h4 className="font-medium mb-2">Explainable AI & Audit Trail</h4>
              <p className="text-sm text-muted leading-relaxed">Every insight shows exactly which data and tools produced it.</p>
            </div>
            <div className="fade-up group bg-surface border border-line rounded-xl p-6 hover:border-brass/40 hover:-translate-y-1 transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-brass/10 flex items-center justify-center mb-5 text-brass">📚</div>
              <h4 className="font-medium mb-2">Business Knowledge / RAG</h4>
              <p className="text-sm text-muted leading-relaxed">Answers questions using your own company policies and internal documents.</p>
            </div>
          </div>
        </div>
      </section>

      {/* EXPLAINABILITY / AUDIT TRAIL SHOWCASE */}
      <section id="trace" className="px-6 lg:px-10 py-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="fade-up order-2 lg:order-1">
            <div className="bg-surface border border-line rounded-2xl p-6">
              <p className="font-mono text-xs text-muted mb-5">WHY THIS INSIGHT — trace</p>
              <div className="space-y-0">
                <div className="flex gap-4 pb-5 border-l border-line ml-3 pl-6 relative">
                  <span className="absolute -left-[7px] top-0 w-3.5 h-3.5 rounded-full bg-brass"></span>
                  <div><p className="text-sm text-paper font-medium">01 — Queried sales_db (Q3, Dhaka region)</p><p className="text-xs text-muted mt-1">42,109 rows scanned</p></div>
                </div>
                <div className="flex gap-4 pb-5 border-l border-line ml-3 pl-6 relative">
                  <span className="absolute -left-[7px] top-0 w-3.5 h-3.5 rounded-full bg-brass"></span>
                  <div><p className="text-sm text-paper font-medium">02 — Cross-referenced inventory.log</p><p className="text-xs text-muted mt-1">Found SKU-2291 stock-out, day 4 of week</p></div>
                </div>
                <div className="flex gap-4 pb-5 border-l border-line ml-3 pl-6 relative">
                  <span className="absolute -left-[7px] top-0 w-3.5 h-3.5 rounded-full bg-signal"></span>
                  <div><p className="text-sm text-paper font-medium">03 — Ran anomaly + correlation model</p><p className="text-xs text-muted mt-1">94% confidence, no seasonal explanation found</p></div>
                </div>
                <div className="flex gap-4 ml-3 pl-6 relative">
                  <span className="absolute -left-[7px] top-0 w-3.5 h-3.5 rounded-full bg-signal pulse-dot"></span>
                  <div><p className="text-sm text-brasslight font-medium">Conclusion ready — cited, reproducible</p></div>
                </div>
              </div>
            </div>
          </div>
          <div className="fade-up order-1 lg:order-2">
            <p className="font-mono text-xs tracking-widest text-brass mb-4">EXPLAINABLE AI</p>
            <h2 className="font-display text-3xl md:text-4xl leading-tight mb-6">No black box. Every number has a receipt.</h2>
            <p className="text-muted text-lg leading-relaxed mb-6">Most analytics tools give you a conclusion and ask you to trust it. OpsPilot shows the data it queried, the tools it ran, and the reasoning in between — so you can check its work in the time it takes to read a sentence.</p>
            <a href="#" className="text-brasslight font-medium brass-underline pb-1">See a full audit trail →</a>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 lg:px-10 py-24 bg-surface/40 border-y border-line/60">
        <div className="max-w-7xl mx-auto">
          <div className="fade-up max-w-xl mb-16">
            <p className="font-mono text-xs tracking-widest text-brass mb-4">SETUP</p>
            <h2 className="font-display text-3xl md:text-4xl">Live in an afternoon, not a quarter.</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="fade-up relative pl-0">
              <p className="font-mono text-4xl text-brass/40 mb-4">01</p>
              <h4 className="font-medium mb-2">Connect your data</h4>
              <p className="text-sm text-muted">Point OpsPilot at your sales, inventory, and ops systems.</p>
            </div>
            <div className="fade-up relative">
              <p className="font-mono text-4xl text-brass/40 mb-4">02</p>
              <h4 className="font-medium mb-2">Ask a question</h4>
              <p className="text-sm text-muted">Type it like you'd ask a colleague — no dashboards to learn.</p>
            </div>
            <div className="fade-up relative">
              <p className="font-mono text-4xl text-brass/40 mb-4">03</p>
              <h4 className="font-medium mb-2">Get a cited answer</h4>
              <p className="text-sm text-muted">See the insight and exactly what data produced it.</p>
            </div>
            <div className="fade-up relative">
              <p className="font-mono text-4xl text-brass/40 mb-4">04</p>
              <h4 className="font-medium mb-2">Act on it</h4>
              <p className="text-sm text-muted">Follow OpsPilot's recommended next step, or hand it to your team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ANOMALY / FORECAST VISUAL */}
      <section className="px-6 lg:px-10 py-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="fade-up">
            <p className="font-mono text-xs tracking-widest text-brass mb-4">ANOMALY DETECTION + FORECASTING</p>
            <h2 className="font-display text-3xl md:text-4xl leading-tight mb-6">It notices the dip before your Monday report does.</h2>
            <p className="text-muted text-lg leading-relaxed">OpsPilot watches every stream continuously, flags what breaks pattern, and projects demand forward so stock-outs show up as a warning, not a surprise.</p>
          </div>
          <div className="fade-up bg-surface border border-line rounded-2xl p-6">
            <svg viewBox="0 0 480 220" className="w-full h-auto">
              <line x1="0" y1="180" x2="480" y2="180" stroke="#2A342F" strokeWidth="1" />
              <polyline points="0,140 40,150 80,130 120,145 160,80 200,95 240,60 280,90" fill="none" stroke="#8B9490" strokeWidth="2" />
              <circle cx="160" cy="80" r="6" fill="#E4572E" className="pulse-dot" />
              <polyline points="280,90 320,70 360,55 400,50 440,35 480,25" fill="none" stroke="#7FE0B4" strokeWidth="2" strokeDasharray="6 5" />
              <text x="150" y="60" fill="#E4572E" fontSize="11" fontFamily="IBM Plex Mono">anomaly</text>
              <text x="380" y="20" fill="#7FE0B4" fontSize="11" fontFamily="IBM Plex Mono">forecast</text>
            </svg>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-6 lg:px-10 py-24 bg-surface/40 border-y border-line/60">
        <div className="max-w-7xl mx-auto">
          <div className="fade-up max-w-xl mb-16">
            <p className="font-mono text-xs tracking-widest text-brass mb-4">RESULTS</p>
            <h2 className="font-display text-3xl md:text-4xl">Told plainly, by the people who used it.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="fade-up bg-surface border border-line rounded-xl p-7">
              <p className="text-paper leading-relaxed mb-6">"We used to lose a day chasing why a region underperformed. Now it's a two-line answer with the source attached."</p>
              <p className="text-sm text-muted font-mono">— Ops Director, Retail chain</p>
            </div>
            <div className="fade-up bg-surface border border-line rounded-xl p-7">
              <p className="text-paper leading-relaxed mb-6">"Stock-outs dropped noticeably once we started acting on the forecast warnings instead of last month's report."</p>
              <p className="text-sm text-muted font-mono">— Supply Chain Lead, Manufacturing</p>
            </div>
            <div className="fade-up bg-surface border border-line rounded-xl p-7">
              <p className="text-paper leading-relaxed mb-6">"The audit trail is what got finance to trust an AI tool at all. They can see the receipt, not just the number."</p>
              <p className="text-sm text-muted font-mono">— Finance Manager, E-commerce</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 lg:px-10 py-28">
        <div className="max-w-7xl mx-auto">
          <div className="fade-up text-center max-w-xl mx-auto mb-16">
            <p className="font-mono text-xs tracking-widest text-brass mb-4">PRICING</p>
            <h2 className="font-display text-3xl md:text-4xl">Start small. Scale with your data.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="fade-up bg-surface border border-line rounded-2xl p-8">
              <h4 className="font-medium mb-1">Starter</h4>
              <p className="text-3xl font-display mb-6">$0<span className="text-base text-muted"> /mo</span></p>
              <ul className="space-y-3 text-sm text-muted mb-8">
                <li>500 queries / month</li><li>1 connected data source</li><li>Basic anomaly alerts</li>
              </ul>
              <a href="#" className="block text-center border border-line rounded-full py-3 hover:border-brass/50 transition">Get started</a>
            </div>
            <div className="fade-up bg-surface2 border border-brass rounded-2xl p-8 relative">
              <span className="absolute -top-3 left-8 bg-brass text-ink text-xs font-mono px-3 py-1 rounded-full">MOST POPULAR</span>
              <h4 className="font-medium mb-1">Growth</h4>
              <p className="text-3xl font-display mb-6">$149<span className="text-base text-muted"> /mo</span></p>
              <ul className="space-y-3 text-sm text-paper mb-8">
                <li>Unlimited queries</li><li>10 connected sources</li><li>Forecasting + root-cause analysis</li><li>Full audit trail</li>
              </ul>
              <a href="#" className="block text-center bg-brass text-ink rounded-full py-3 hover:bg-brasslight transition font-medium">Start free trial</a>
            </div>
            <div className="fade-up bg-surface border border-line rounded-2xl p-8">
              <h4 className="font-medium mb-1">Enterprise</h4>
              <p className="text-3xl font-display mb-6">Custom</p>
              <ul className="space-y-3 text-sm text-muted mb-8">
                <li>Unlimited everything</li><li>Dedicated infra + SSO</li><li>Custom RAG on internal docs</li>
              </ul>
              <a href="#" className="block text-center border border-line rounded-full py-3 hover:border-brass/50 transition">Talk to sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 lg:px-10 py-24 bg-surface/40 border-y border-line/60">
        <div className="max-w-3xl mx-auto">
          <div className="fade-up mb-12">
            <p className="font-mono text-xs tracking-widest text-brass mb-4">FAQ</p>
            <h2 className="font-display text-3xl md:text-4xl">Questions, answered plainly.</h2>
          </div>
          <div className="space-y-3">
            <details className="fade-up group bg-surface border border-line rounded-xl p-5" open>
              <summary className="flex justify-between items-center cursor-pointer font-medium">How does OpsPilot connect to our data? <span className="text-brass group-open:rotate-45 transition">+</span></summary>
              <p className="text-muted text-sm mt-3 leading-relaxed">Through direct connectors to common databases, spreadsheets, and commerce platforms — no engineering sprint required.</p>
            </details>
            <details className="fade-up group bg-surface border border-line rounded-xl p-5">
              <summary className="flex justify-between items-center cursor-pointer font-medium">Can we trust the AI's conclusions? <span className="text-brass group-open:rotate-45 transition">+</span></summary>
              <p className="text-muted text-sm mt-3 leading-relaxed">Every answer comes with its audit trail — the exact data queried and the tools used — so your team can verify it, not just take our word.</p>
            </details>
            <details className="fade-up group bg-surface border border-line rounded-xl p-5">
              <summary className="flex justify-between items-center cursor-pointer font-medium">Does it work with our internal policy documents? <span className="text-brass group-open:rotate-45 transition">+</span></summary>
              <p className="text-muted text-sm mt-3 leading-relaxed">Yes — the RAG layer indexes your internal docs so OpsPilot can answer policy and process questions alongside data questions.</p>
            </details>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 lg:px-10 py-28 text-center glow">
        <div className="fade-up max-w-2xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl leading-tight mb-6">Stop guessing why the numbers moved.</h2>
          <p className="text-muted text-lg mb-10">Connect your first data source and ask OpsPilot your first question in under ten minutes.</p>
          <Link href="/register" className="inline-block bg-brass text-ink font-medium px-8 py-4 rounded-full hover:bg-brasslight transition">Start free — no card needed</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line/70 px-6 lg:px-10 py-14">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 4H20V20H4V4Z" stroke="#D4A24C" strokeWidth="1.4" />
                <path d="M8 10L11 13L16 7" stroke="#D4A24C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-display text-lg">OpsPilot</span>
            </div>
            <p className="text-sm text-muted max-w-xs">The AI business analyst that shows its work.</p>
          </div>
          <div className="flex flex-wrap gap-16 text-sm">
            <div><p className="text-paper font-medium mb-3">Product</p><ul className="space-y-2 text-muted"><li>Features</li><li>Pricing</li><li>Security</li></ul></div>
            <div><p className="text-paper font-medium mb-3">Company</p><ul className="space-y-2 text-muted"><li>About</li><li>Careers</li><li>Contact</li></ul></div>
            <div><p className="text-paper font-medium mb-3">Legal</p><ul className="space-y-2 text-muted"><li>Privacy</li><li>Terms</li></ul></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-line/60 text-xs text-muted font-mono">© 2026 OpsPilot. All rights reserved.</div>
      </footer>
    </div>
  );
}
