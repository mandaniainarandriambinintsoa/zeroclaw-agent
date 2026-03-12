"use client";

import { useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { Zap, DollarSign, Wrench, Activity } from "lucide-react";

const COLORS = [
  "hsl(160, 84%, 39%)", // emerald
  "hsl(217, 91%, 60%)", // blue
  "hsl(38, 92%, 50%)",  // amber
  "hsl(0, 72%, 51%)",   // red
  "hsl(280, 67%, 52%)", // purple
];

const tooltipStyle = {
  backgroundColor: "hsl(0, 0%, 12%)",
  border: "1px solid hsl(0, 0%, 20%)",
  borderRadius: "8px",
  color: "white",
  fontSize: "13px",
};

// Mock cost history (will be replaced with real data)
const costHistory = [
  { date: "Mar 6", cost: 0.08 },
  { date: "Mar 7", cost: 0.12 },
  { date: "Mar 8", cost: 0.06 },
  { date: "Mar 9", cost: 0.15 },
  { date: "Mar 10", cost: 0.09 },
  { date: "Mar 11", cost: 0.11 },
  { date: "Mar 12", cost: 0.07 },
];

export default function MetricsPage() {
  const fetchMetrics = useCallback(() => api.metrics(), []);
  const { data: metrics, loading } = useApi(fetchMetrics, 15000);

  const providerData = metrics
    ? Object.entries(metrics.tokens.by_provider).map(([name, t]) => ({
        name,
        input: t.in,
        output: t.out,
      }))
    : [];

  const toolData = metrics
    ? Object.entries(metrics.tools.by_tool)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }))
    : [];

  const toolPieData = metrics
    ? Object.entries(metrics.tools.by_tool)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }))
    : [];

  return (
    <>
      <PageHeader
        title="Metrics"
        description="Token usage, costs, and tool analytics"
      />

      {/* Summary cards */}
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
              title="Total Tokens"
              value={
                (
                  (metrics?.tokens.total_in ?? 0) +
                  (metrics?.tokens.total_out ?? 0)
                ).toLocaleString()
              }
              icon={Zap}
            />
            <StatCard
              title="Total Cost"
              value={`$${(metrics?.cost_usd.total ?? 0).toFixed(2)}`}
              subtitle={`$${(metrics?.cost_usd.last_24h ?? 0).toFixed(2)} last 24h`}
              icon={DollarSign}
            />
            <StatCard
              title="Tool Calls"
              value={metrics?.tools.total_calls ?? 0}
              icon={Wrench}
            />
            <StatCard
              title="Total Requests"
              value={metrics?.requests.total ?? 0}
              subtitle={`${metrics?.requests.last_hour ?? 0}/hour`}
              icon={Activity}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Tokens by provider */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tokens by Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {providerData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={providerData}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 12 }}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      dataKey="input"
                      name="Input"
                      fill="hsl(160, 84%, 39%)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="output"
                      name="Output"
                      fill="hsl(217, 91%, 60%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tool usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tool Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {toolData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={toolData} layout="vertical">
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      dataKey="count"
                      fill="hsl(38, 92%, 50%)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cost over time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cost Over Time (USD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costHistory}>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(0, 0%, 45%)", fontSize: 12 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [`$${Number(v).toFixed(2)}`, "Cost"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="hsl(160, 84%, 39%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(160, 84%, 39%)", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tool distribution pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tool Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {toolPieData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={toolPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {toolPieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No data yet
                </div>
              )}
              {/* Legend */}
              {toolPieData.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {toolPieData.map((item, i) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
