import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "active" | "inactive" | "error" | "warning";

const styles: Record<Status, string> = {
  active:
    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10",
  inactive:
    "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/10",
  error: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/10",
  warning:
    "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10",
};

export function StatusBadge({
  status,
  label,
}: {
  status: Status;
  label?: string;
}) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", styles[status])}>
      <span
        className={cn(
          "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
          status === "active" && "bg-emerald-500",
          status === "inactive" && "bg-zinc-400",
          status === "error" && "bg-red-500",
          status === "warning" && "bg-amber-500"
        )}
      />
      {label || status}
    </Badge>
  );
}
