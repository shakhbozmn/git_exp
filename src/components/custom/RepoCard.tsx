import * as React from "react"
import { StarIcon, GitForkIcon, CircleDotIcon, ExternalLinkIcon } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RepoMetricRow } from "@/components/custom/RepoMetricRow"
import type { RepoFetchState, GitHubRepo } from "@/types/github"
import { cn } from "@/lib/utils"

interface WinnerMap {
  stars: boolean
  forks: boolean
  issues: boolean
}

interface RepoCardProps {
  state: RepoFetchState
  winners: WinnerMap
  showWinnerBadge: boolean
  className?: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function SuccessCard({
  data,
  winners,
  showWinnerBadge,
}: {
  data: GitHubRepo
  winners: WinnerMap
  showWinnerBadge: boolean
}) {
  const fallbackChar = data.owner.login[0]?.toUpperCase() ?? "?"

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl bg-card">
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarImage src={data.owner.avatar_url} alt={data.owner.login} />
          <AvatarFallback>{fallbackChar}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold truncate">{data.name}</p>
          <p className="text-sm text-muted-foreground truncate">{data.owner.login}</p>
        </div>
      </div>

      {data.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{data.description}</p>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Badge variant="secondary" className="text-xs font-normal">
          Pushed {formatDate(data.pushed_at)}
        </Badge>
      </div>

      <div className="flex flex-col gap-1">
        <RepoMetricRow
          icon={<StarIcon className="size-4" />}
          label="Stars"
          value={data.stargazers_count}
          isWinner={winners.stars}
          showWinnerBadge={showWinnerBadge}
        />
        <RepoMetricRow
          icon={<GitForkIcon className="size-4" />}
          label="Forks"
          value={data.forks_count}
          isWinner={winners.forks}
          showWinnerBadge={showWinnerBadge}
        />
        <RepoMetricRow
          icon={<CircleDotIcon className="size-4" />}
          label="Open Issues"
          value={data.open_issues_count}
          isWinner={winners.issues}
          showWinnerBadge={showWinnerBadge}
        />
      </div>

      <Button variant="outline" asChild className="mt-auto">
        <a href={data.html_url} target="_blank" rel="noopener noreferrer">
          <ExternalLinkIcon className="size-4" />
          View on GitHub
        </a>
      </Button>
    </div>
  )
}

function LoadingCard() {
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl bg-card">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  )
}

export function RepoCard({ state, winners, showWinnerBadge, className }: RepoCardProps) {
  if (state.status === "loading") {
    return <LoadingCard />
  }

  if (state.status === "error") {
    return (
      <div className={cn("p-4 border rounded-xl bg-card", className)}>
        <Alert variant="destructive">
          <AlertDescription>{state.error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (state.status === "success") {
    return (
      <SuccessCard
        data={state.data}
        winners={winners}
        showWinnerBadge={showWinnerBadge}
      />
    )
  }

  // idle state
  return (
    <div
      className={cn(
        "flex items-center justify-center p-8 border-2 border-dashed rounded-xl text-muted-foreground text-sm text-center",
        className
      )}
    >
      Enter an owner/repo path above and press Search to load a repository.
    </div>
  )
}
