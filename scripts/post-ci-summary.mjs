#!/usr/bin/env node
// @ts-check
/**
 * post-ci-summary.mjs
 *
 * Posts (or updates) a single PR comment with a CI status table.
 * For failed steps, includes the captured output as a collapsible section.
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
  console.log("Missing required env vars, skipping CI summary.")
  process.exit(0)
}

const [owner, repo] = GITHUB_REPOSITORY.split("/")
const MARKER = "<!-- ci-summary-bot -->"
const TAIL_LINES = 100

/** @param {string | undefined} outcome */
function icon(outcome) {
  if (outcome === "success") return "✅"
  if (outcome === "failure") return "❌"
  if (outcome === "skipped") return "⏭️"
  return "❔"
}

/**
 * Read the last N lines of a file. Returns null if the file doesn't exist.
 * @param {string} path
 * @param {number} n
 */
function tailFile(path, n) {
  if (!existsSync(path)) return null
  const lines = readFileSync(path, "utf8").trimEnd().split("\n")
  const start = Math.max(0, lines.length - n)
  const tail = lines.slice(start)
  if (start > 0) tail.unshift(`... (first ${start} lines omitted)`)
  return tail.join("\n")
}

const steps = [
  { name: "Lint",       outcome: LINT_OUTCOME,     file: "lint-output.txt"  },
  { name: "Type-check", outcome: TYPECHECK_OUTCOME, file: "tsc-output.txt"   },
  { name: "Build",      outcome: BUILD_OUTCOME,     file: "build-output.txt" },
  { name: "E2E",        outcome: E2E_OUTCOME,       file: null               },
]

const tableRows = steps
  .map((s) => `| ${icon(s.outcome)} | **${s.name}** | \`${s.outcome}\` |`)
  .join("\n")

const failureDetails = steps
  .filter((s) => s.outcome === "failure" && s.file)
  .flatMap((s) => {
    const output = tailFile(/** @type {string} */ (s.file), TAIL_LINES)
    if (!output) return []
    return [
      `<details>`,
      `<summary>🔍 <strong>${s.name} — error output</strong></summary>`,
      ``,
      "```",
      output,
      "```",
      `</details>`,
      ``,
    ]
  })

const allPassed = steps.every((s) => s.outcome === "success" || s.outcome === "skipped")

const statusLine = allPassed
  ? "**All checks passed ✅**"
  : "**One or more checks failed — see details below.**"

const body = [
  MARKER,
  `## CI Check Results`,
  ``,
  statusLine,
  ``,
  `| | Step | Status |`,
  `|---|---|---|`,
  tableRows,
  ``,
  ...failureDetails,
].join("\n")

// ---------------------------------------------------------------------------
// Find existing summary comment on this PR (to update instead of re-posting)
// ---------------------------------------------------------------------------

const baseHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
}

const listRes = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments?per_page=100`,
  { headers: baseHeaders }
)

let existingCommentId = null
if (listRes.ok) {
  const comments = /** @type {Array<{id: number, body: string}>} */ (await listRes.json())
  for (const c of comments) {
    if (typeof c.body === "string" && c.body.includes(MARKER)) {
      existingCommentId = c.id
      break
    }
  }
}

// ---------------------------------------------------------------------------
// Create or update the summary comment
// ---------------------------------------------------------------------------

const jsonHeaders = { ...baseHeaders, "Content-Type": "application/json" }

if (existingCommentId) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/comments/${existingCommentId}`,
    { method: "PATCH", headers: jsonHeaders, body: JSON.stringify({ body }) }
  )
  console.log(
    res.ok
      ? `Updated CI summary comment #${existingCommentId}`
      : `Failed to update comment: ${res.status} ${res.statusText}`
  )
} else {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments`,
    { method: "POST", headers: jsonHeaders, body: JSON.stringify({ body }) }
  )
  if (res.ok) {
    const created = /** @type {{id: number}} */ (await res.json())
    console.log(`Created CI summary comment #${created.id}`)
  } else {
    console.error(`Failed to post CI summary comment: ${res.status} ${res.statusText}`)
  }
}
