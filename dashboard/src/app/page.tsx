"use client";

import { useCallback } from "react";
import {
  Activity,
  Zap,
  DollarSign,
  MessageSquare,
  Clock,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

// Mock chart data (replaced by real data when API is connected)
const chartData = [
  { day: "Mon", requests: 32 },
  { day: "Tue", requests: 45 },
  { day: "Wed", requests: 28 },
  { day: "Thu", requests: 56 },
  { day: "Fri", requests: 41 },
  { day: "Sat", requests: 18 },
  { day: "Sun", requests: 12 },
];

function formatUptime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

export default function OverviewPage() {
  const fetchStatus = useCallback(() => api.status(), []);
  const fetchMetrics = useCallback(() => api.metrics(), []);
  const fetchLogs = useCallback(() => api.logs(8), []);

  const { data: status, loading: statusLoading } = useApi(fetchStatus, 30000);
  const { data: metrics, loading: metricsLoading } = useApi(fetchMetrics, 15000);
  const { data: logsData, loading: logsLoading } = useApi(fetchLogs, 10000);

  const loading = statusLoading || metricsLoading;

  return (
    <>
      <PageHeader
        title="Overview"
        description="System health and key metrics at a glance"
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Status"
              value={status?.status === "running" ? "Running" : "Offline"}
              subtitle={
                status ? `Uptime: ${formatUptime(status.uptime_secs)}` : ""
              }
              icon={Activity}
            />
            <StatCard
              title="Requests (24h)"
              value={metrics?.requests.last_24h ?? 0}
              subtitle={`${metrics?.requests.last_hour ?? 0} last hour`}
              icon={MessageSquare}
            />
            <StatCard
              title="Tokens Used"
              value={
                metrics
                  ? (
                      metrics.tokens.total_in + metrics.tokens.total_out
                    ).toLocaleString()
                  : "0"
              }
              subtitle={`In: ${(metrics?.tokens.total_in ?? 0).toLocaleString()} / Out: ${(metrics?.tokens.total_out ?? 0).toLocaleString()}`}
              icon={Zap}
            />
            <StatCard
              title="Cost (USD)"
              value={`$${(metrics?.cost_usd.total ?? 0).toFixed(2)}`}
              subtitle={`$${(metrics?.cost_usd.last_24h ?? 0).toFixed(2)} last 24h`}
              icon={DollarSign}
            />
          </>
        )}
      </div>

      {/* Chart + Channels */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Request volume chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Request Volume (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="colorReqs"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(160, 84%, 39%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(160, 84%, 39%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 12%)",
                      border: "1px solid hsl(0, 0%, 20%)",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "13px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="hsl(160, 84%, 39%)"
                    strokeWidth={2}
                    fill="url(#colorReqs)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Active channels */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status ? (
                Object.entries(status.channels).map(([name, ch]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-sm font-medium capitalize">
                      {name}
                    </span>
                    <StatusBadge
                      status={ch.active ? "active" : "inactive"}
                      label={ch.active ? "Active" : "Off"}
                    />
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px]">
            {logsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : logsData?.logs.length ? (
              <div className="space-y-1">
                {logsData.logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        log.level === "error"
                          ? "bg-red-500"
                          : log.level === "warn"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{log.message}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.component}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(log.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
