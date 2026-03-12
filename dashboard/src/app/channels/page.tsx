"use client";

import { useCallback } from "react";
import {
  MessageSquare,
  Send,
  Inbox,
  Clock,
  Webhook,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

const channelIcons: Record<string, string> = {
  telegram: "T",
  discord: "D",
  slack: "S",
  whatsapp: "W",
  email: "E",
  matrix: "M",
  irc: "I",
  signal: "Si",
};

export default function ChannelsPage() {
  const fetchChannels = useCallback(() => api.channels(), []);
  const { data, loading } = useApi(fetchChannels, 30000);

  return (
    <>
      <PageHeader
        title="Channels"
        description="Communication channel status and activity"
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.channels.map((ch) => (
            <Card
              key={ch.name}
              className={
                ch.active ? "" : "opacity-50"
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                        ch.active
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-zinc-500/10 text-zinc-400"
                      }`}
                    >
                      {channelIcons[ch.name] || ch.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base capitalize">
                        {ch.name}
                      </CardTitle>
                    </div>
                  </div>
                  <StatusBadge
                    status={ch.active ? "active" : "inactive"}
                    label={ch.active ? "Active" : "Off"}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {ch.webhook_mode && (
                  <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Webhook className="h-3 w-3" />
                    Webhook mode
                  </div>
                )}
                <Separator className="mb-3" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-bold font-mono">
                        {ch.messages_received}
                      </p>
                      <p className="text-xs text-muted-foreground">Received</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Send className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-bold font-mono">
                        {ch.messages_sent}
                      </p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                  </div>
                </div>
                {ch.last_activity && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last activity{" "}
                    {formatDistanceToNow(new Date(ch.last_activity), {
                      addSuffix: true,
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {data?.channels.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">
                No channels configured
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
