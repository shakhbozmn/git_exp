"use client"

import * as React from "react"
import { fetchRepo } from "@/api/fetchRepo"
import type { RepoFetchState } from "@/types/github"

const STORAGE_KEY = "github-comparison-repos"
const HISTORY_KEY = "github-comparison-history"
const HISTORY_MAX = 5

export interface RecentPair { left: string; right: string }

async function runFetch(
  path: string,
  controllerRef: React.MutableRefObject<AbortController | null>,
  setState: React.Dispatch<React.SetStateAction<RepoFetchState>>
): Promise<void> {
  controllerRef.current?.abort()
  const controller = new AbortController()
  controllerRef.current = controller
  setState({ status: "loading" })
  const result = await fetchRepo(path, controller.signal)
  if (controller.signal.aborted) return
  if (result.ok) setState({ status: "success", data: result.data })
  else setState({ status: "error", error: result.error })
}

export function useRepoComparison() {
  const [leftPath, setLeftPath] = React.useState("")
  const [rightPath, setRightPath] = React.useState("")
  const [leftState, setLeftState] = React.useState<RepoFetchState>({ status: "idle" })
  const [rightState, setRightState] = React.useState<RepoFetchState>({ status: "idle" })
  const [hydrated, setHydrated] = React.useState(false)
  const [recentPairs, setRecentPairs] = React.useState<RecentPair[]>([])

  const leftControllerRef = React.useRef<AbortController | null>(null)
  const rightControllerRef = React.useRef<AbortController | null>(null)

  // Hydrate from URL params (priority) then localStorage on mount
  React.useEffect(() => {
    let initialLeft = ""
    let initialRight = ""
    // 1. URL search params (shareable links)
    try {
      const params = new URLSearchParams(window.location.search)
      initialLeft = params.get("left") ?? ""
      initialRight = params.get("right") ?? ""
    } catch { /* SSR guard */ }
    // 2. Fallback to localStorage for any side not in URL
    if (!initialLeft || !initialRight) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const obj = JSON.parse(raw) as Record<string, unknown>
          if (!initialLeft && typeof obj["left"] === "string") initialLeft = obj["left"]
          if (!initialRight && typeof obj["right"] === "string") initialRight = obj["right"]
        }
      } catch { /* ignore */ }
    }
    if (initialLeft) setLeftPath(initialLeft)
    if (initialRight) setRightPath(initialRight)
    setHydrated(true)
    // 3. Load history
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown[]
        setRecentPairs(parsed.filter((item): item is RecentPair =>
          typeof item === "object" && item !== null &&
          typeof (item as Record<string, unknown>)["left"] === "string" &&
          typeof (item as Record<string, unknown>)["right"] === "string"
        ))
      }
    } catch { /* ignore */ }
  }, [])

  // Persist path changes to localStorage + URL sync
  React.useEffect(() => {
    if (!hydrated) return
    try {
      const stored: Record<string, string> = {}
      if (leftPath) stored["left"] = leftPath
      if (rightPath) stored["right"] = rightPath
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch { /* ignore */ }
    try {
      const params = new URLSearchParams()
      if (leftPath) params.set("left", leftPath)
      if (rightPath) params.set("right", rightPath)
      const q = params.toString()
      window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname)
    } catch { /* ignore */ }
  }, [hydrated, leftPath, rightPath])

  // Record successful comparison pairs into history
  React.useEffect(() => {
    if (leftState.status !== "success" || rightState.status !== "success") return
    const left = leftState.data.full_name
    const right = rightState.data.full_name
    setRecentPairs(prev => {
      const filtered = prev.filter(p => !(p.left === left && p.right === right))
      const next = [{ left, right }, ...filtered].slice(0, HISTORY_MAX)
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftState.status, rightState.status])

  const fetchLeft = React.useCallback(async () => {
    await runFetch(leftPath, leftControllerRef, setLeftState)
  }, [leftPath])

  const fetchRight = React.useCallback(async () => {
    await runFetch(rightPath, rightControllerRef, setRightState)
  }, [rightPath])

  const fetchBoth = React.useCallback(async (left: string, right: string) => {
    setLeftPath(left)
    setRightPath(right)
    await Promise.allSettled([
      runFetch(left, leftControllerRef, setLeftState),
      runFetch(right, rightControllerRef, setRightState),
    ])
  }, [])

  const swapRepos = React.useCallback(() => {
    const pl = leftPath
    const pr = rightPath
    const sl = leftState
    const sr = rightState
    setLeftPath(pr)
    setRightPath(pl)
    setLeftState(sr)
    setRightState(sl)
  }, [leftPath, rightPath, leftState, rightState])

  const clearLeft = React.useCallback(() => {
    setLeftPath("")
    setLeftState({ status: "idle" })
  }, [])

  const clearRight = React.useCallback(() => {
    setRightPath("")
    setRightState({ status: "idle" })
  }, [])

  return {
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
  }
}
