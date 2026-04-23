"use client"

import * as React from "react"
import { TrophyIcon, GitCompareIcon, ArrowLeftRightIcon, ArrowUpDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRepoComparison } from "./hooks/useRepoComparison"
import { RepoSearchInput } from "./components/RepoSearchInput"
import { RepoCard } from "./components/RepoCard"
import type { GitHubRepo } from "@/types/github"

const PRESET_PAIRS = [
  { label: "react vs vue",          left: "facebook/react",          right: "vuejs/vue" },
  { label: "next.js vs nuxt",       left: "vercel/next.js",          right: "nuxt/nuxt" },
  { label: "vite vs webpack",       left: "vitejs/vite",             right: "webpack/webpack" },
  { label: "tailwind vs bootstrap", left: "tailwindlabs/tailwindcss", right: "twbs/bootstrap" },
  { label: "typescript vs flow",    left: "microsoft/TypeScript",    right: "facebook/flow" },
  { label: "bun vs deno",           left: "oven-sh/bun",             right: "denoland/deno" },
]

function computeWinnerMap(
  left: GitHubRepo | null,
  right: GitHubRepo | null,
  side: "left" | "right"
): { stars: boolean; forks: boolean; issues: boolean; watchers: boolean } {
  if (!left || !right) {
    return { stars: false, forks: false, issues: false, watchers: false }
  }

  const repo = side === "left" ? left : right
  const other = side === "left" ? right : left

  return {
    stars: repo.stargazers_count > other.stargazers_count,
    forks: repo.forks_count > other.forks_count,
    issues: repo.open_issues_count < other.open_issues_count,
    watchers: repo.watchers_count > other.watchers_count,
  }
}

export function RepoComparisonContainer() {
  const {
    leftPath,
    rightPath,
    leftState,
    rightState,
    setLeftPath,
    setRightPath,
    fetchLeft,
    fetchRight,
    fetchBoth,
    swapRepos,
    clearLeft,
    clearRight,
    recentPairs,
  } = useRepoComparison()

  const leftData =
    leftState.status === "success" ? leftState.data : null
  const rightData =
    rightState.status === "success" ? rightState.data : null

  const showWinnerBadge = leftData !== null && rightData !== null

  const leftWinners = computeWinnerMap(leftData, rightData, "left")
  const rightWinners = computeWinnerMap(leftData, rightData, "right")

  const leftWinCount = showWinnerBadge
    ? [leftWinners.stars, leftWinners.forks, leftWinners.issues, leftWinners.watchers].filter(Boolean).length
    : 0
  const rightWinCount = showWinnerBadge
    ? [rightWinners.stars, rightWinners.forks, rightWinners.issues, rightWinners.watchers].filter(Boolean).length
    : 0

  const leftIsOverallWinner = showWinnerBadge && leftWinCount > rightWinCount
  const rightIsOverallWinner = showWinnerBadge && rightWinCount > leftWinCount

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto px-4 py-8">
      {/* Enhanced hero section */}
      <div className="flex flex-col items-center gap-3 text-center shrink-0 sm:gap-1.5">
        <div className="flex items-center justify-center size-12 sm:size-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-border animate-hero-in">
          <GitCompareIcon className="size-6 sm:size-5 text-zinc-600 dark:text-zinc-400" />
        </div>
        <div className="flex flex-col items-center gap-1.5 animate-hero-in anim-delay-100">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-zinc-400 bg-clip-text text-transparent">
            GitHub Repository Comparison
          </h1>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-border rounded-full px-2.5 py-0.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live GitHub data
          </span>
        </div>
        <p className="text-base sm:text-sm text-muted-foreground max-w-md animate-hero-in anim-delay-200">
          Instantly compare metrics, activity, and metadata between any two GitHub repositories
        </p>
        <p className="text-xs text-muted-foreground/60 animate-hero-in anim-delay-300 sm:hidden">Tip: Press Enter &#8629; to search</p>
      </div>

      {/* Search row with swap button */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end animate-hero-in anim-delay-400 shrink-0">
        <RepoSearchInput
          label="Left Repository"
          value={leftPath}
          onChange={setLeftPath}
          onSearch={fetchLeft}
          onClear={clearLeft}
          isLoading={leftState.status === "loading"}
          placeholder="e.g. facebook/react"
        />
        <div className="hidden sm:flex items-center justify-center pb-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={swapRepos}
            aria-label="Swap repositories"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftRightIcon className="size-4" />
          </Button>
        </div>
        <RepoSearchInput
          label="Right Repository"
          value={rightPath}
          onChange={setRightPath}
          onSearch={fetchRight}
          onClear={clearRight}
          isLoading={rightState.status === "loading"}
          placeholder="e.g. vuejs/vue"
        />
      </div>

      {/* Mobile swap — visible only below sm breakpoint */}
      <div className="flex sm:hidden justify-center -mt-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={swapRepos}
          className="gap-1.5 text-muted-foreground text-xs"
        >
          <ArrowUpDownIcon className="size-3.5" />
          Swap
        </Button>
      </div>

      {/* Preset chips */}
      <div className="overflow-x-auto -mx-4 px-4 animate-hero-in anim-delay-500 shrink-0">
        <div className="flex gap-2 pb-1 w-max sm:w-auto sm:flex-wrap">
          {PRESET_PAIRS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => { void fetchBoth(p.left, p.right) }}
              className={cn(
                "shrink-0 text-xs font-medium rounded-full px-3 py-1 cursor-pointer",
                "bg-muted text-muted-foreground border border-border",
                "hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Winner banner — always in DOM, fades in/out to avoid layout shift */}
      <div
        className={cn(
          "flex items-center justify-center gap-2 text-sm text-muted-foreground min-h-[28px] shrink-0",
          "transition-opacity duration-300",
          showWinnerBadge ? "opacity-100" : "opacity-0 pointer-events-none select-none"
        )}
        aria-hidden={!showWinnerBadge}
      >
        {showWinnerBadge && (
          leftWinCount !== rightWinCount ? (
            <>
              <TrophyIcon className="size-4 text-amber-500 shrink-0" />
              <span className="font-medium text-foreground">
                {leftIsOverallWinner ? leftData!.full_name : rightData!.full_name}
              </span>
              <span>leads</span>
              <span className="font-mono font-bold text-foreground">
                {Math.max(leftWinCount, rightWinCount)}&nbsp;–&nbsp;{Math.min(leftWinCount, rightWinCount)}
              </span>
              <span>
                {leftIsOverallWinner ? rightData!.full_name : leftData!.full_name}
              </span>
            </>
          ) : (
            <span>Equal match — no overall winner</span>
          )
        )}
      </div>

      {/* Recent pairs history */}
      {recentPairs.length > 0 && (
        <div className="flex flex-col gap-2 animate-card-in shrink-0">
          <p className="text-xs font-medium text-muted-foreground">Recently compared:</p>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-1 w-max sm:w-auto sm:flex-wrap">
              {recentPairs.map((pair) => (
                <button
                  key={`${pair.left}__${pair.right}`}
                  type="button"
                  onClick={() => { void fetchBoth(pair.left, pair.right) }}
                  className={cn(
                    "shrink-0 text-xs font-mono rounded-full px-3 py-1 cursor-pointer",
                    "bg-muted text-muted-foreground border border-border",
                    "hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
                  )}
                >
                  {pair.left} <span className="opacity-50 mx-0.5">vs</span> {pair.right}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RepoCard
          state={leftState}
          winners={leftWinners}
          showWinnerBadge={showWinnerBadge}
          otherData={rightData}
          isOverallWinner={leftIsOverallWinner}
        />
        <RepoCard
          state={rightState}
          winners={rightWinners}
          showWinnerBadge={showWinnerBadge}
          otherData={leftData}
          isOverallWinner={rightIsOverallWinner}
          animationDelay="100ms"
        />
      </div>
    </div>
  )
}
