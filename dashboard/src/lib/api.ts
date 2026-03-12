const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface SystemStatus {
  status: string;
  uptime_secs: number;
  provider: string;
  model: string;
  memory_backend: string;
  memory_entries: number;
  channels: Record<string, { active: boolean; webhook_mode?: boolean }>;
  gateway: { host: string; port: number };
}

export interface Metrics {
  tokens: {
    total_in: number;
    total_out: number;
    by_provider: Record<string, { in: number; out: number }>;
  };
  requests: { total: number; last_24h: number; last_hour: number };
  tools: { total_calls: number; by_tool: Record<string, number> };
  cost_usd: { total: number; last_24h: number };
  uptime_secs: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  component: string;
  message: string;
  metadata: Record<string, unknown>;
}

export interface ChannelStatus {
  name: string;
  active: boolean;
  webhook_mode?: boolean;
  messages_received: number;
  messages_sent: number;
  last_activity: string | null;
}

export interface MemoryStats {
  backend: string;
  total_entries: number;
  by_category: Record<string, number>;
  health: boolean;
}

export interface MemoryEntry {
  id: string;
  key: string;
  category: string;
  timestamp: string;
  content_preview: string;
}

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  status: () => fetchJSON<SystemStatus>("/status"),
  metrics: () => fetchJSON<Metrics>("/metrics"),
  logs: (limit = 50, offset = 0, level?: string) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (level && level !== "all") params.set("level", level);
    return fetchJSON<{ logs: LogEntry[]; total: number; has_more: boolean }>(
      `/logs?${params}`
    );
  },
  channels: () => fetchJSON<{ channels: ChannelStatus[] }>("/channels"),
  memoryStats: () => fetchJSON<MemoryStats>("/memory/stats"),
  memoryRecent: (limit = 10) =>
    fetchJSON<{ entries: MemoryEntry[] }>(`/memory/recent?limit=${limit}`),
};
