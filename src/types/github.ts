export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  pushed_at: string
  owner: {
    login: string
    avatar_url: string
  }
}

export interface RepoFetchError {
  kind: 'not_found' | 'rate_limited' | 'network' | 'invalid_path'
  message: string
}

export type RepoFetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: GitHubRepo }
  | { status: 'error'; error: RepoFetchError }
