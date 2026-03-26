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
}

export function RepoMetricRow({
  icon,
  label,
  value,
  isWinner,
  showWinnerBadge,
}: RepoMetricRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2 text-sm",
        isWinner && showWinnerBadge && "bg-amber-50 dark:bg-amber-950/20"
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-semibold tabular-nums",
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
  )
}
