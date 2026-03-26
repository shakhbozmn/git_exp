"use client"

import * as React from "react"
import { fetchRepo } from "@/api/fetchRepo"
import type { RepoFetchState } from "@/types/github"

const STORAGE_KEY = "github-comparison-repos"

interface StoredPaths {
  left?: string
  right?: string
}

export function useRepoComparison() {
  const [leftPath, setLeftPath] = React.useState("")
  const [rightPath, setRightPath] = React.useState("")
  const [leftState, setLeftState] = React.useState<RepoFetchState>({ status: "idle" })
  const [rightState, setRightState] = React.useState<RepoFetchState>({ status: "idle" })
  const isFirstRender = React.useRef(true)

  // Hydrate from localStorage on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const stored = JSON.parse(raw) as StoredPaths
        if (stored.left) setLeftPath(stored.left)
        if (stored.right) setRightPath(stored.right)
      }
    } catch {
      // ignore parse errors
    }
    isFirstRender.current = false
  }, [])

  // Persist path changes to localStorage (skip on first render to avoid overwriting hydrated values)
  React.useEffect(() => {
    if (isFirstRender.current) return
    try {
      const stored: StoredPaths = {}
      if (leftPath) stored.left = leftPath
      if (rightPath) stored.right = rightPath
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // ignore storage errors
    }
  }, [leftPath, rightPath])

  const fetchLeft = React.useCallback(async () => {
    setLeftState({ status: "loading" })
    const result = await fetchRepo(leftPath)
    if (result.ok) {
      setLeftState({ status: "success", data: result.data })
    } else {
      setLeftState({ status: "error", error: result.error })
    }
  }, [leftPath])

  const fetchRight = React.useCallback(async () => {
    setRightState({ status: "loading" })
    const result = await fetchRepo(rightPath)
    if (result.ok) {
      setRightState({ status: "success", data: result.data })
    } else {
      setRightState({ status: "error", error: result.error })
    }
  }, [rightPath])

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
    clearLeft,
    clearRight,
  }
}
