"use client";

import { useCallback } from "react";
import { Brain, Database, Heart, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { format } from "date-fns";

const categoryColors: Record<string, string> = {
  core: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  daily: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  conversation: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export default function MemoryPage() {
  const fetchStats = useCallback(() => api.memoryStats(), []);
  const fetchRecent = useCallback(() => api.memoryRecent(15), []);

  const { data: stats, loading: statsLoading } = useApi(fetchStats, 30000);
  const { data: recent, loading: recentLoading } = useApi(fetchRecent, 15000);

  return (
    <>
      <PageHeader
        title="Memory"
        description="Knowledge base statistics and recent entries"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
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
              title="Total Entries"
              value={stats?.total_entries ?? 0}
              icon={Database}
            />
            <StatCard
              title="Backend"
              value={stats?.backend ?? "unknown"}
              icon={Brain}
            />
            <StatCard
              title="Categories"
              value={Object.keys(stats?.by_category ?? {}).length}
              icon={Tag}
            />
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Health
                  </p>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-3">
                  <StatusBadge
                    status={stats?.health ? "active" : "error"}
                    label={stats?.health ? "Healthy" : "Unhealthy"}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Category breakdown */}
      {stats?.by_category && Object.keys(stats.by_category).length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entries by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.by_category).map(([cat, count]) => (
                <div
                  key={cat}
                  className="flex items-center gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <Badge
                    variant="outline"
                    className={
                      categoryColors[cat] ??
                      "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    }
                  >
                    {cat}
                  </Badge>
                  <span className="text-xl font-bold font-mono">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent entries */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recent?.entries.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Key</TableHead>
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead className="w-[150px]">Timestamp</TableHead>
                  <TableHead>Content</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs">
                      {entry.key}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          categoryColors[entry.category] ??
                          "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        }
                      >
                        {entry.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(entry.timestamp), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                      {entry.content_preview}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No memory entries yet
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
