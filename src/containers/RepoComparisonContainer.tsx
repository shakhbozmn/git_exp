"use client"

import * as React from "react"
import { useRepoComparison } from "@/hooks/useRepoComparison"
import { RepoSearchInput } from "@/components/custom/RepoSearchInput"
import { RepoCard } from "@/components/custom/RepoCard"
import type { GitHubRepo } from "@/types/github"

function computeWinnerMap(
  left: GitHubRepo | null,
  right: GitHubRepo | null,
  side: "left" | "right"
): { stars: boolean; forks: boolean; issues: boolean } {
  if (!left || !right) {
    return { stars: false, forks: false, issues: false }
  }

  const repo = side === "left" ? left : right
  const other = side === "left" ? right : left

  return {
    stars: repo.stargazers_count >= other.stargazers_count,
    forks: repo.forks_count >= other.forks_count,
    issues: repo.open_issues_count >= other.open_issues_count,
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
    clearLeft,
    clearRight,
  } = useRepoComparison()

  const leftData =
    leftState.status === "success" ? leftState.data : null
  const rightData =
    rightState.status === "success" ? rightState.data : null

  const showWinnerBadge = leftData !== null && rightData !== null

  const leftWinners = computeWinnerMap(leftData, rightData, "left")
  const rightWinners = computeWinnerMap(leftData, rightData, "right")

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">GitHub Repository Comparison</h1>
        <p className="text-muted-foreground mt-2">
          Compare stars, forks, and open issues between two repositories
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RepoSearchInput
          label="Left Repository"
          value={leftPath}
          onChange={setLeftPath}
          onSearch={fetchLeft}
          onClear={clearLeft}
          isLoading={leftState.status === "loading"}
          placeholder="e.g. facebook/react"
        />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <RepoCard
          state={leftState}
          winners={leftWinners}
          showWinnerBadge={showWinnerBadge}
        />
        <RepoCard
          state={rightState}
          winners={rightWinners}
          showWinnerBadge={showWinnerBadge}
        />
      </div>
    </div>
  )
}
