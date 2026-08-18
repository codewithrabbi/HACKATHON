"use client";

import { useEffect, useState, useRef } from "react";
import { streamChat, fetchAPI, SSEMessage } from "@/lib/api";
import {
  Send, Bot, User, Loader2, Wrench, Sparkles,
  TrendingDown, AlertTriangle, BarChart2, Truck, GitCompare, Award,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import ChatChart, { ChartSpec } from "@/components/ChatChart";

const iconMap: Record<string, React.ReactNode> = {
  "trending-down": <TrendingDown size={18} />,
  "alert-triangle": <AlertTriangle size={18} />,
  "bar-chart-2": <BarChart2 size={18} />,
  truck: <Truck size={18} />,
  "git-compare": <GitCompare size={18} />,
  award: <Award size={18} />,
};

interface Message {
  role: "user" | "assistant";
  content: string;
  tools?: Array<{ name: string; status: string }>;
}

// Removed basic parser, using react-markdown instead

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTools, setActiveTools] = useState<Array<{ name: string; status: string }>>([]);
  const [suggestions, setSuggestions] = useState<Array<{ text: string; icon: string }>>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAPI<{ questions: typeof suggestions }>("/api/chat/suggested")
      .then((d) => setSuggestions(d.questions))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTools]);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);
    setActiveTools([]);

    let assistantContent = "";
    const tools: Array<{ name: string; status: string }> = [];
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    await streamChat(text.trim(), history, (msg: SSEMessage) => {
      if (msg.type === "content") {
        assistantContent += (assistantContent ? " " : "") + (msg.content || "");
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            last.content = assistantContent;
            last.tools = [...tools];
          } else {
            updated.push({ role: "assistant", content: assistantContent, tools: [...tools] });
          }
          return [...updated];
        });
      } else if (msg.type === "tool_call") {
        const tool = { name: msg.tool || "unknown", status: "running" };
        tools.push(tool);
        setActiveTools([...tools]);
      } else if (msg.type === "tool_result") {
        const t = tools.find((t) => t.name === msg.tool && t.status === "running");
        if (t) t.status = msg.success ? "done" : "error";
        setActiveTools([...tools]);
      } else if (msg.type === "error") {
        assistantContent = msg.content || "An error occurred.";
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            last.content = assistantContent;
          } else {
            updated.push({ role: "assistant", content: assistantContent });
          }
          return [...updated];
        });
      }
    });

    setIsStreaming(false);
    setActiveTools([]);
  }

  const toolDisplayName = (name: string) =>
    name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="full-bleed-page relative flex flex-col h-screen bg-ink overflow-hidden noise grain">
      {/* Glow Effect */}
      <div className="absolute inset-0 pointer-events-none glow opacity-50"></div>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-ink/70 backdrop-blur-2xl border-b border-line/50 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-brass/10"
            style={{ background: "linear-gradient(135deg, var(--color-brass), var(--color-brasslight))" }}>
            <Bot size={24} className="text-ink" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-paper tracking-tight">OpsPilot AI</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-signal pulse-dot"></span>
              <p className="text-xs text-muted font-mono uppercase tracking-widest">
                System Online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-10 z-10">
        <div className="max-w-4xl mx-auto space-y-8 pt-8">
          
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in fade-up in">
              <div className="w-20 h-20 rounded-full bg-surface2/50 border border-line flex items-center justify-center mb-6 float">
                <Sparkles size={32} className="text-brass" />
              </div>
              <h2 className="text-3xl font-display font-bold mb-3 text-paper">How can I help you today?</h2>
              <p className="text-base mb-10 text-muted max-w-lg mx-auto">
                Ask me about sales trends, inventory risks, demand forecasts, or any ad-hoc data analysis.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s.text)}
                    className="group relative flex items-center gap-3 text-left bg-surface2/40 backdrop-blur-md border border-line/60 rounded-xl px-4 py-3 hover:bg-surface2/80 hover:border-brass/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-brass/5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 group-hover:bg-brass/10 transition-colors">
                      <div className="text-muted group-hover:text-brass transition-colors">
                        {iconMap[s.icon] || <Sparkles size={14} />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-[13px] font-medium text-paper/90 line-clamp-2 leading-snug">{s.text}</p>
                    </div>
                    <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 text-brass">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex w-full animate-fade-in fade-up in ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "user" ? (
                // User Bubble
                <div className="flex items-end gap-3 max-w-[80%]">
                  <div className="bg-surface2/60 backdrop-blur-md border border-line rounded-3xl rounded-tr-sm px-6 py-4 shadow-lg">
                    <p className="text-[15px] leading-relaxed text-paper">{msg.content}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0 border border-line">
                    <User size={14} className="text-muted" />
                  </div>
                </div>
              ) : (
                // AI Response (No Bubble)
                <div className="flex gap-5 w-full max-w-[90%]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-brass/5 mt-1"
                    style={{ background: "linear-gradient(135deg, var(--color-brass), var(--color-brasslight))" }}>
                    <Bot size={20} className="text-ink" />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col gap-3 pt-2">
                    {/* Tool Calls */}
                    {msg.tools && msg.tools.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {msg.tools.map((t, j) => (
                          <div key={j} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono tracking-wide shadow-sm transition-all
                            ${t.status === "done" ? "bg-signal/10 border-signal/20 text-signal" 
                            : t.status === "error" ? "bg-alert/10 border-alert/20 text-alert" 
                            : "bg-brass/10 border-brass/20 text-brass pulse-dot"}`}>
                            {t.status === "running" ? <Loader2 size={12} className="animate-spin" /> : <Wrench size={12} />}
                            {toolDisplayName(t.name)}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* AI Text Content */}
                    <div className="text-[15px] leading-relaxed text-paper/90 font-body markdown-content w-full">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          code({node, inline, className, children, ...props}: any) {
                            const match = /language-(\w+)/.exec(className || "");
                            if (!inline && match && match[1] === "chart") {
                              try {
                                const spec = JSON.parse(String(children).replace(/\n$/, "")) as ChartSpec;
                                return <ChatChart spec={spec} />;
                              } catch (e) {
                                return <div className="text-alert text-sm">Failed to render chart data.</div>;
                              }
                            }
                            return <code className={className} {...props}>{children}</code>;
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Active Streaming Indicator (Thinking / Tools) */}
          {isStreaming && (activeTools.length > 0 || (messages.length > 0 && messages[messages[messages.length - 1].role === "user" ? messages.length - 1 : 0]?.role === "user")) && (
            <div className="flex gap-5 w-full max-w-[90%] animate-fade-in fade-up in">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md mt-1"
                style={{ background: "linear-gradient(135deg, var(--color-brass), var(--color-brasslight))" }}>
                <Bot size={20} className="text-ink" />
              </div>
              <div className="flex-1 min-w-0 pt-2 space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 size={16} className="animate-spin text-brass" />
                  <span className="text-sm font-mono tracking-widest text-muted uppercase">
                    {activeTools.length > 0 ? "Analyzing Data..." : "Thinking..."}
                  </span>
                </div>
                {activeTools.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeTools.map((t, i) => (
                      <div key={i} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono tracking-wide
                        ${t.status === "done" ? "bg-signal/10 border-signal/20 text-signal" 
                        : t.status === "running" ? "bg-brass/10 border-brass/20 text-brass pulse-dot" 
                        : "bg-alert/10 border-alert/20 text-alert"}`}>
                        {t.status === "running" ? <Loader2 size={12} className="animate-spin" /> : <Wrench size={12} />}
                        {toolDisplayName(t.name)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 z-20 bg-ink/80 backdrop-blur-3xl border-t border-line/50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="relative flex items-end gap-3 bg-surface2/50 border border-line rounded-3xl p-2 transition-all focus-within:border-brass/50 focus-within:bg-surface2 shadow-xl"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Message OpsPilot AI..."
              disabled={isStreaming}
              rows={1}
              className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none py-3 px-4 text-[15px] outline-none text-paper placeholder:text-muted/60"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, var(--color-brass), var(--color-brasslight))" }}
            >
              {isStreaming ? <Loader2 size={20} className="animate-spin text-ink" /> : <Send size={20} className="text-ink ml-1" />}
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[11px] text-muted/60 font-mono">OpsPilot AI can make mistakes. Verify critical business decisions.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
