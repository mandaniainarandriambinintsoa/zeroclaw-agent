"use client";

import { useCallback, useState } from "react";
import { ScrollText, RefreshCw } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { format } from "date-fns";

const levelStyles: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/10",
  warn: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10",
  error: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/10",
  debug:
    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/10",
};

const levels = ["all", "info", "warn", "error", "debug"] as const;

export default function LogsPage() {
  const [level, setLevel] = useState<string>("all");
  const [limit] = useState(50);

  const fetchLogs = useCallback(
    () => api.logs(limit, 0, level),
    [limit, level]
  );
  const { data, loading, refetch } = useApi(fetchLogs, 10000);

  return (
    <>
      <PageHeader
        title="Logs"
        description="Real-time activity and event log viewer"
      />

      {/* Filters */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {levels.map((l) => (
            <Button
              key={l}
              variant={level === l ? "default" : "outline"}
              size="sm"
              onClick={() => setLevel(l)}
              className="capitalize text-xs"
            >
              {l}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          className="gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              {data ? `${data.total} entries` : "Loading..."}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Auto-refresh 10s
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data?.logs.length ? (
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Timestamp</TableHead>
                    <TableHead className="w-[80px]">Level</TableHead>
                    <TableHead className="w-[120px]">Component</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.logs.map((log) => (
                    <TableRow key={log.id} className="group">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            levelStyles[log.level] ?? levelStyles.debug
                          }
                        >
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.component}
                      </TableCell>
                      <TableCell className="text-sm max-w-[400px] truncate">
                        {log.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <ScrollText className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                No logs found
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
