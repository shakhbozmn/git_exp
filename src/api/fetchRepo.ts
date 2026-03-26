import type { GitHubRepo, RepoFetchError } from '@/types/github'

const OWNER_REPO_REGEX = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/

type FetchRepoResult =
  | { ok: true; data: GitHubRepo }
  | { ok: false; error: RepoFetchError }

export async function fetchRepo(path: string): Promise<FetchRepoResult> {
  if (!OWNER_REPO_REGEX.test(path)) {
    return {
      ok: false,
      error: {
        kind: 'invalid_path',
        message: 'Enter a valid "owner/repo" path (e.g. facebook/react)',
      },
    }
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${path}`, {
      headers: { Accept: 'application/vnd.github+json' },
    })

    if (response.status === 404) {
      return {
        ok: false,
        error: { kind: 'not_found', message: 'Repository not found' },
      }
    }

    if (response.status === 403) {
      const resetHeader = response.headers.get('X-RateLimit-Reset')
      const resetTime = resetHeader
        ? new Date(parseInt(resetHeader, 10) * 1000).toLocaleTimeString()
        : 'unknown'
      return {
        ok: false,
        error: {
          kind: 'rate_limited',
          message: `Rate limit reached, resets at ${resetTime}`,
        },
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          kind: 'network',
          message: `Unexpected error: ${response.status} ${response.statusText}`,
        },
      }
    }

    const data = (await response.json()) as GitHubRepo
    return { ok: true, data }
  } catch {
    return {
      ok: false,
      error: { kind: 'network', message: 'Could not reach GitHub' },
    }
  }
}
