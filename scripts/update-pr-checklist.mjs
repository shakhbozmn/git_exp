#!/usr/bin/env node
// @ts-check
/**
 * update-pr-checklist.mjs
 *
 * Ticks `- [ ]` items in the PR body using two strategies:
 *
 *   1. CI step keyword matching — checks if the item text contains keywords
 *      for a CI step (lint, type-check, build, e2e) and ticks it when that
 *      step succeeded.
 *
 *   2. Playwright title matching (fallback) — fuzzy-matches passed E2E test
 *      titles against remaining unchecked items.
 *
 * Environment variables (injected by GitHub Actions):
 *   GITHUB_TOKEN        — GitHub API token
 *   GITHUB_REPOSITORY   — "owner/repo"
 *   PR_NUMBER           — pull request number
 *   LINT_OUTCOME        — success | failure | skipped | cancelled
 *   TYPECHECK_OUTCOME   — success | failure | skipped | cancelled
 *   BUILD_OUTCOME       — success | failure | skipped | cancelled
 *   E2E_OUTCOME         — success | failure | skipped | cancelled
 */

import { readFileSync, existsSync } from "fs"

const {
  GITHUB_TOKEN,
  GITHUB_REPOSITORY,
  PR_NUMBER,
  LINT_OUTCOME = "skipped",
  TYPECHECK_OUTCOME = "skipped",
  BUILD_OUTCOME = "skipped",
  E2E_OUTCOME = "skipped",
} = process.env

if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !PR_NUMBER) {
  console.log("Missing required env vars, skipping PR checklist update.")
  process.exit(0)
}

const [owner, repo] = GITHUB_REPOSITORY.split("/")

// ---------------------------------------------------------------------------
// Strategy 1: CI step keyword matching
// ---------------------------------------------------------------------------

/**
 * Returns true if the checklist line is resolved by a passing CI step.
 * Matches keywords to the step names regardless of surrounding text.
 * @param {string} line
 */
function resolvesViaCI(line) {
  const l = line.toLowerCase()
  if (/\b(lint|eslint|linting)\b/.test(l) && LINT_OUTCOME === "success") return true
  if (/\b(type[\s-]?check|typecheck|tsc|typescript)\b/.test(l) && TYPECHECK_OUTCOME === "success") return true
  if (/\b(build|compil(e|es|ed|ation))\b/.test(l) && BUILD_OUTCOME === "success") return true
  if (/\b(e2e|end[\s-]to[\s-]end|playwright|integration test)\b/.test(l) && E2E_OUTCOME === "success") return true
  return false
}

// ---------------------------------------------------------------------------
// Strategy 2: Playwright passed-title fuzzy matching
// ---------------------------------------------------------------------------

/** @type {string[]} */
let passedTitles = []

if (existsSync("playwright-results.json")) {
  const results = JSON.parse(readFileSync("playwright-results.json", "utf8"))

  /**
   * Walk the nested suites tree and collect passed test titles.
   * @param {unknown} suite
   * @returns {string[]}
   */
  function collectPassedTitles(suite) {
    /** @type {string[]} */
    const passed = []
    if (!suite || typeof suite !== "object") return passed

    const s = /** @type {Record<string, unknown>} */ (suite)

    if (Array.isArray(s["specs"])) {
      for (const spec of /** @type {unknown[]} */ (s["specs"])) {
        const sp = /** @type {Record<string, unknown>} */ (spec)
        const tests = /** @type {Array<Record<string, unknown>>} */ (sp["tests"] ?? [])
        const ok = tests.every((t) => t["status"] === "expected" || t["status"] === "skipped")
        if (ok && typeof sp["title"] === "string") {
          passed.push(sp["title"])
        }
      }
    }

    if (Array.isArray(s["suites"])) {
      for (const child of /** @type {unknown[]} */ (s["suites"])) {
        passed.push(...collectPassedTitles(child))
      }
    }

    return passed
  }

  for (const suite of results.suites ?? []) {
    passedTitles.push(...collectPassedTitles(suite))
  }
  console.log(`Passed Playwright tests: ${passedTitles.length}`)
} else {
  console.log("playwright-results.json not found, skipping Playwright title matching.")
}

/**
 * Returns true if ≥ 60% of testTitle's words appear (case-insensitive) in checklistLine.
 * Uses a higher threshold than before to reduce false positives.
 * @param {string} testTitle
 * @param {string} checklistLine
 */
function fuzzyMatch(testTitle, checklistLine) {
  const titleWords = testTitle.toLowerCase().split(/\W+/).filter((w) => w.length > 2)
  if (titleWords.length === 0) return false
  const lineNorm = checklistLine.toLowerCase()
  const matchCount = titleWords.filter((w) => lineNorm.includes(w)).length
  return matchCount >= Math.ceil(titleWords.length * 0.6)
}

// ---------------------------------------------------------------------------
// Fetch PR body
// ---------------------------------------------------------------------------

const prRes = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/pulls/${PR_NUMBER}`,
  {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  }
)

if (!prRes.ok) {
  console.error(`Failed to fetch PR: ${prRes.status} ${prRes.statusText}`)
  process.exit(0)
}

const pr = await prRes.json()
const originalBody = /** @type {string} */ (pr.body ?? "")

if (!originalBody.includes("- [ ]")) {
  console.log("No unchecked items in PR body, nothing to update.")
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Apply both matching strategies
// ---------------------------------------------------------------------------

let tickedCount = 0

const updatedBody = originalBody
  .split("\n")
  .map((line) => {
    if (!line.trim().startsWith("- [ ]")) return line
    const shouldTick = resolvesViaCI(line) || passedTitles.some((title) => fuzzyMatch(title, line))
    if (shouldTick) {
      tickedCount++
      return line.replace("- [ ]", "- [x]")
    }
    return line
  })
  .join("\n")

if (updatedBody === originalBody) {
  console.log("No checklist items matched, body unchanged.")
  process.exit(0)
}

console.log(`Ticking ${tickedCount} checklist item(s).`)

// ---------------------------------------------------------------------------
// PATCH updated body
// ---------------------------------------------------------------------------

const patchRes = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/pulls/${PR_NUMBER}`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ body: updatedBody }),
  }
)

if (patchRes.ok) {
  console.log("PR checklist updated successfully.")
} else {
  console.error(`Failed to update PR: ${patchRes.status} ${patchRes.statusText}`)
}
