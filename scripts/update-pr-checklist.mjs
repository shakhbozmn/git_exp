#!/usr/bin/env node
// @ts-check
/**
 * update-pr-checklist.mjs
 *
 * Reads playwright-results.json, collects passed test titles, then fuzzy-matches
 * them against `- [ ]` items in the PR body and ticks matched items to `- [x]`.
 *
 * Environment variables (injected by GitHub Actions):
 *   GITHUB_TOKEN        — GitHub API token
 *   GITHUB_REPOSITORY   — "owner/repo"
 *   PR_NUMBER           — pull request number
 */

import { readFileSync, existsSync } from "fs"

const { GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER } = process.env

if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !PR_NUMBER) {
  console.log("Missing required env vars, skipping PR checklist update.")
  process.exit(0)
}

const [owner, repo] = GITHUB_REPOSITORY.split("/")

// ---------------------------------------------------------------------------
// Read Playwright results
// ---------------------------------------------------------------------------

if (!existsSync("playwright-results.json")) {
  console.log("playwright-results.json not found, nothing to update.")
  process.exit(0)
}

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

/** @type {string[]} */
const passedTitles = []
for (const suite of results.suites ?? []) {
  passedTitles.push(...collectPassedTitles(suite))
}

console.log(`Passed tests: ${passedTitles.length}`)
if (passedTitles.length === 0) {
  console.log("No passed tests to match against checklist.")
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Fetch current PR body
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
// Fuzzy-match and tick
// ---------------------------------------------------------------------------

/**
 * Returns true if ≥ half of testTitle's words appear (case-insensitive) in checklistLine.
 * @param {string} testTitle
 * @param {string} checklistLine
 */
function fuzzyMatch(testTitle, checklistLine) {
  const titleWords = testTitle.toLowerCase().split(/\W+/).filter(Boolean)
  const lineNorm = checklistLine.toLowerCase()
  const matchCount = titleWords.filter((w) => lineNorm.includes(w)).length
  return matchCount >= Math.ceil(titleWords.length / 2)
}

const updatedBody = originalBody
  .split("\n")
  .map((line) => {
    if (!line.trim().startsWith("- [ ]")) return line
    const isMatched = passedTitles.some((title) => fuzzyMatch(title, line))
    return isMatched ? line.replace("- [ ]", "- [x]") : line
  })
  .join("\n")

if (updatedBody === originalBody) {
  console.log("No checklist items matched, body unchanged.")
  process.exit(0)
}

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
