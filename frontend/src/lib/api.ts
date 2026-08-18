/**
 * API client for OpsPilot backend.
 */

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function fetchAPI<T = unknown>(endpoint: string): Promise<T> {
  try {
    const res = await axios.get<T>(`${API_BASE}${endpoint}`);
    return res.data;
  } catch (error: any) {
    throw new Error(`API error: ${error.response?.status || error.message}`);
  }
}

export async function postAPI<T = unknown>(
  endpoint: string,
  body: unknown
): Promise<T> {
  try {
    const res = await axios.post<T>(`${API_BASE}${endpoint}`, body);
    return res.data;
  } catch (error: any) {
    throw new Error(`API error: ${error.response?.status || error.message}`);
  }
}

export interface SSEMessage {
  type: "content" | "tool_call" | "tool_result" | "done" | "error";
  content?: string;
  tool?: string;
  args?: Record<string, unknown>;
  success?: boolean;
}

export async function streamChat(
  message: string,
  history: Array<{ role: string; content: string }>,
  onMessage: (msg: SSEMessage) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    onMessage({ type: "error", content: `API error: ${res.status}` });
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          onMessage(data);
        } catch {
          // skip malformed JSON
        }
      }
    }
  }
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  BDT: "৳",
  INR: "₹"
};

export function formatCurrency(value: number): string {
  const currency = typeof window !== 'undefined' ? localStorage.getItem('opspilot_currency') || 'USD' : 'USD';
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  const num = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  return `${symbol}${num}`;
}

export function formatCurrencyCompact(value: number): string {
  const currency = typeof window !== 'undefined' ? localStorage.getItem('opspilot_currency') || 'USD' : 'USD';
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  const num = new Intl.NumberFormat('en-US', {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
  return `${symbol}${num}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatDate(dateString: string | Date | number, options: Intl.DateTimeFormatOptions): string {
  return new Date(dateString).toLocaleDateString('en-US', options);
}

export function formatTime(dateString: string | Date | number, options: Intl.DateTimeFormatOptions): string {
  return new Date(dateString).toLocaleTimeString('en-US', options);
}
