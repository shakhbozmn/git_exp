import * as React from "react"
import { TrophyIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RepoMetricRowProps {
  icon: React.ReactNode
  label: string
  value: number
  isWinner: boolean
  showWinnerBadge: boolean
  otherValue?: number
}

export function RepoMetricRow({
  icon,
  label,
  value,
  isWinner,
  showWinnerBadge,
  otherValue,
}: RepoMetricRowProps) {
  const showBar = otherValue !== undefined && (value > 0 || otherValue > 0)
  const total = showBar ? value + (otherValue ?? 0) : 0
  const pct = showBar && total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div
      className={cn(
        "flex flex-col rounded-md px-3 py-2 text-sm",
        isWinner && showWinnerBadge
          ? "bg-amber-50/80 dark:bg-amber-950/30 border-l-2 border-l-amber-400 pl-[calc(0.75rem-2px)]"
          : ""
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-base font-bold tabular-nums",
              isWinner && showWinnerBadge && "text-amber-700 dark:text-amber-400"
            )}
          >
            {value.toLocaleString()}
          </span>
          {showWinnerBadge && isWinner && (
            <Badge
              variant="outline"
              className="border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1 px-1.5 py-0"
            >
              <TrophyIcon className="size-3" />
              Best
            </Badge>
          )}
        </div>
      </div>

      {showBar && (
        <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              isWinner && showWinnerBadge ? "bg-amber-400" : "bg-zinc-400/60"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
