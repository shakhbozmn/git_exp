export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  watchers_count: number
  pushed_at: string | null
  created_at: string
  language: string | null
  topics: string[]
  license: { name: string } | null
  fork: boolean
  archived: boolean
  owner: {
    login: string
    avatar_url: string
  }
}

export interface RepoFetchError {
  kind: 'not_found' | 'rate_limited' | 'network' | 'invalid_path' | 'unauthorized' | 'server_error'
  message: string
}

export type RepoFetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: GitHubRepo }
  | { status: 'error'; error: RepoFetchError }
