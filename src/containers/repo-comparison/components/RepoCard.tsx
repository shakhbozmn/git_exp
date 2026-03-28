import * as React from "react"
import {
  StarIcon,
  GitForkIcon,
  CircleDotIcon,
  ExternalLinkIcon,
  SearchIcon,
  AlertCircleIcon,
  CalendarIcon,
  EyeIcon,
  SearchXIcon,
  ClockIcon,
  WifiOffIcon,
  LockIcon,
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { RepoMetricRow } from "./RepoMetricRow"
import { cn } from "@/lib/utils"
import type { RepoFetchState, GitHubRepo, RepoFetchError } from "@/types/github"
import { timeAgo } from "../utils/timeAgo"

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-500",
  Rust: "bg-orange-500",
  Go: "bg-cyan-400",
  Java: "bg-red-500",
  C: "bg-blue-700",
  "C++": "bg-blue-700",
  Ruby: "bg-red-600",
  Swift: "bg-orange-400",
  Kotlin: "bg-violet-500",
}

function getLanguageColor(lang: string): string {
  return LANGUAGE_COLORS[lang] ?? "bg-zinc-400"
}

interface WinnerMap {
  stars: boolean
  forks: boolean
  issues: boolean
  watchers: boolean
}

interface RepoCardProps {
  state: RepoFetchState
  winners: WinnerMap
  showWinnerBadge: boolean
  otherData?: GitHubRepo | null
  isOverallWinner?: boolean
  className?: string
  animationDelay?: string
}

function formatFullDate(iso: string | null): string {
  if (iso === null) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function ErrorIcon({ kind }: { kind: RepoFetchError["kind"] }) {
  switch (kind) {
    case "not_found":
      return <SearchXIcon className="size-4" />
    case "rate_limited":
      return <ClockIcon className="size-4" />
    case "network":
    case "server_error":
      return <WifiOffIcon className="size-4" />
    case "invalid_path":
      return <AlertCircleIcon className="size-4" />
    case "unauthorized":
      return <LockIcon className="size-4" />
  }
}

function SuccessCard({
  data,
  winners,
  showWinnerBadge,
  otherData,
  isOverallWinner,
  animationDelay,
}: {
  data: GitHubRepo
  winners: WinnerMap
  showWinnerBadge: boolean
  otherData: GitHubRepo | null
  isOverallWinner: boolean
  animationDelay?: string
}) {
  const fallbackChar = data.owner.login[0]?.toUpperCase() ?? "?"
  const visibleTopics = data.topics.slice(0, 3)
  const extraTopics = data.topics.length - visibleTopics.length

  return (
    <div
      className={cn(
        "h-full flex flex-col gap-4 p-4 border rounded-xl bg-card",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default",
        "animate-card-in",
        isOverallWinner
          ? "ring-2 ring-amber-400/70 shadow-lg shadow-amber-100/50 dark:shadow-amber-900/20"
          : ""
      )}
      style={animationDelay !== undefined ? { animationDelay } : undefined}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Avatar size="lg">
          <AvatarImage src={data.owner.avatar_url} alt={data.owner.login} />
          <AvatarFallback>{fallbackChar}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold truncate">{data.name}</p>
          <p className="text-sm text-muted-foreground truncate">{data.owner.login}</p>
        </div>
        <a
          href={data.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1.5 rounded-md hover:bg-accent transition-colors"
          aria-label="View on GitHub"
        >
          <ExternalLinkIcon className="size-4 text-muted-foreground" />
        </a>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground italic line-clamp-2">
        {data.description ?? "No description provided."}
      </p>

      {/* Metadata chips */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {data.language !== null && (
          <span className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5">
            <span className={cn("size-2 rounded-full shrink-0", getLanguageColor(data.language))} />
            {data.language}
          </span>
        )}
        {data.license !== null && (
          <span className="bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
            {data.license.name}
          </span>
        )}
        {data.fork && (
          <Badge variant="secondary" className="text-xs font-normal rounded-full">
            Fork
          </Badge>
        )}
        {data.archived && (
          <Badge variant="outline" className="text-xs font-normal rounded-full text-amber-600 border-amber-300">
            Archived
          </Badge>
        )}
      </div>

      {/* Topics */}
      {data.topics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleTopics.map((topic) => (
            <span
              key={topic}
              className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs rounded-full px-2 py-0.5"
            >
              {topic}
            </span>
          ))}
          {extraTopics > 0 && (
            <span className="text-xs text-muted-foreground px-1 py-0.5">
              +{extraTopics} more
            </span>
          )}
        </div>
      )}

      {/* Spacer: pins metrics to card bottom regardless of topic count */}
      <div className="flex-1 min-h-0" />

      <Separator />

      {/* Metrics */}
      <div className="flex flex-col gap-1">
        <RepoMetricRow
          icon={<StarIcon className="size-4" />}
          label="Stars"
          value={data.stargazers_count}
          isWinner={winners.stars}
          showWinnerBadge={showWinnerBadge}
          {...(otherData !== null && { otherValue: otherData.stargazers_count })}
        />
        <RepoMetricRow
          icon={<GitForkIcon className="size-4" />}
          label="Forks"
          value={data.forks_count}
          isWinner={winners.forks}
          showWinnerBadge={showWinnerBadge}
          {...(otherData !== null && { otherValue: otherData.forks_count })}
        />
        <RepoMetricRow
          icon={<CircleDotIcon className="size-4" />}
          label="Open Issues"
          value={data.open_issues_count}
          isWinner={winners.issues}
          showWinnerBadge={showWinnerBadge}
          {...(otherData !== null && { otherValue: otherData.open_issues_count })}
        />
        <RepoMetricRow
          icon={<EyeIcon className="size-4" />}
          label="Watchers"
          value={data.watchers_count}
          isWinner={winners.watchers}
          showWinnerBadge={showWinnerBadge}
          {...(otherData !== null && { otherValue: otherData.watchers_count })}
        />
      </div>

      <Separator />

      {/* Activity row */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarIcon className="size-3.5 shrink-0" />
        <span>
          Pushed <span className="font-medium text-foreground">{timeAgo(data.pushed_at)}</span>
        </span>
        <span className="ml-auto hidden sm:inline">{formatFullDate(data.pushed_at)}</span>
      </div>
    </div>
  )
}

function LoadingCard({ animationDelay }: { animationDelay?: string }) {
  return (
    <div
      className="h-full flex flex-col gap-4 p-4 border rounded-xl bg-card animate-card-in"
      style={animationDelay !== undefined ? { animationDelay } : undefined}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="size-7 rounded-md shrink-0" />
      </div>
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

export function RepoCard({
  state,
  winners,
  showWinnerBadge,
  otherData,
  isOverallWinner,
  className,
  animationDelay,
}: RepoCardProps) {
  return (
    <div aria-live="polite" aria-atomic="true" className={cn("min-h-[460px]", className)}>
      {state.status === "loading" && (
        <LoadingCard {...(animationDelay !== undefined && { animationDelay })} />
      )}
      {state.status === "error" && (
        <div
          className="p-4 border rounded-xl bg-card animate-card-in"
          style={animationDelay !== undefined ? { animationDelay } : undefined}
        >
          <Alert variant="destructive">
            <ErrorIcon kind={state.error.kind} />
            <AlertDescription>{state.error.message}</AlertDescription>
          </Alert>
        </div>
      )}
      {state.status === "success" && (
        <SuccessCard
          key={state.data.id}
          data={state.data}
          winners={winners}
          showWinnerBadge={showWinnerBadge}
          otherData={otherData ?? null}
          isOverallWinner={isOverallWinner ?? false}
          {...(animationDelay !== undefined && { animationDelay })}
        />
      )}
      {state.status === "idle" && (
        <div className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl text-center min-h-[240px]">
          <SearchIcon className="size-10 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Search for a repository</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Enter owner/repo above to get started
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
