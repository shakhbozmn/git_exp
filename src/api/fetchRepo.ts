import type { GitHubRepo, RepoFetchError } from '@/types/github'

const OWNER_REPO_REGEX = /^[a-zA-Z0-9_][a-zA-Z0-9_.-]*\/[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/

type FetchRepoResult =
  | { ok: true; data: GitHubRepo }
  | { ok: false; error: RepoFetchError }

export async function fetchRepo(path: string, signal?: AbortSignal): Promise<FetchRepoResult> {
  const normalizedPath = path.replace(/\.git$/, '')

  if (!OWNER_REPO_REGEX.test(normalizedPath)) {
    return {
      ok: false,
      error: {
        kind: 'invalid_path',
        message: 'Enter a valid "owner/repo" path (e.g. facebook/react)',
      },
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => { controller.abort() }, 10_000)

  if (signal) {
    signal.addEventListener('abort', () => { controller.abort(signal.reason) })
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${normalizedPath}`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: controller.signal,
    })

    if (response.status === 404) {
      return {
        ok: false,
        error: { kind: 'not_found', message: 'Repository not found' },
      }
    }

    if (response.status === 401) {
      return {
        ok: false,
        error: { kind: 'unauthorized', message: 'Authentication required — check your GitHub token' },
      }
    }

    if (response.status === 403) {
      const remaining = response.headers.get('X-RateLimit-Remaining')
      const retryAfter = response.headers.get('Retry-After')
      if (remaining === '0' || retryAfter !== null) {
        const resetHeader = response.headers.get('X-RateLimit-Reset')
        const resetTime = resetHeader
          ? new Date(parseInt(resetHeader, 10) * 1000).toLocaleTimeString()
          : 'unknown'
        return {
          ok: false,
          error: { kind: 'rate_limited', message: `Rate limit reached, resets at ${resetTime}` },
        }
      }
      return {
        ok: false,
        error: { kind: 'network', message: 'Access to this repository is restricted' },
      }
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      const resetTime = retryAfter
        ? new Date(Date.now() + parseInt(retryAfter, 10) * 1000).toLocaleTimeString()
        : 'unknown'
      return {
        ok: false,
        error: { kind: 'rate_limited', message: `Rate limit reached, resets at ${resetTime}` },
      }
    }

    if (response.status >= 500) {
      let serverMessage = 'GitHub is experiencing issues, try again later'
      try {
        const body = (await response.json()) as { message?: string }
        if (typeof body.message === 'string') {
          serverMessage = body.message
        }
      } catch {
        // ignore parse error
      }
      return {
        ok: false,
        error: { kind: 'server_error', message: serverMessage },
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        error: { kind: 'network', message: 'Access to this repository is restricted' },
      }
    }

    try {
      const data = (await response.json()) as GitHubRepo
      return { ok: true, data }
    } catch {
      return {
        ok: false,
        error: { kind: 'network', message: 'Unexpected response from GitHub' },
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      if (signal?.aborted) {
        return {
          ok: false,
          error: { kind: 'network', message: 'Request was cancelled' },
        }
      }
      return {
        ok: false,
        error: { kind: 'network', message: 'Request timed out' },
      }
    }
    return {
      ok: false,
      error: { kind: 'network', message: 'Could not reach GitHub' },
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
