export interface PaheSearchResult {
  id: number
  title: string
  type: string
  episodes: number
  status: string
  season: string
  year: number
  score: number
  poster: string
  session: string
}

export interface PaheSearchResponse {
  total: number
  per_page: number
  current_page: number
  last_page: number
  next_page_url: string | null
  prev_page_url: string | null
  data: PaheSearchResult[]
}

export interface PaheEpisode {
  id: number
  anime_id: number
  episode: number
  episode2: number
  edition: string
  title: string
  snapshot: string
  disc: string
  audio: string
  duration: string
  session: string
  filler: number
  created_at: string
}

export interface PaheEpisodesResponse {
  total: number
  per_page: number
  current_page: number
  last_page: number
  next_page_url: string | null
  data: PaheEpisode[]
}

export interface VideoSource {
  src: string
  fansub: string
  resolution: string
  audio: string
  av1: string
}

export interface PlayPageData {
  sources: VideoSource[]
  downloads: Array<{ href: string; label: string }>
  prevHref: string | null
  nextHref: string | null
  episodeNumber: number | null
  malId: string | null
  animeTitle: string | null
}

export interface MALPicture {
  medium: string
  large: string
}

export interface MALListStatus {
  status: MALStatus
  score: number
  num_episodes_watched: number
  updated_at: string
}

export interface MALAnimeNode {
  id: number
  title: string
  main_picture?: MALPicture
  synopsis?: string
  mean?: number
  status?: string
  num_episodes: number
  media_type?: string
  genres?: Array<{ id: number; name: string }>
  my_list_status?: MALListStatus
  start_date?: string
  alternative_titles?: { en?: string; ja?: string; synonyms?: string[] }
}

export interface MALAnimeEntry {
  node: MALAnimeNode
  list_status: MALListStatus
}

export type MALStatus =
  | 'watching'
  | 'completed'
  | 'on_hold'
  | 'dropped'
  | 'plan_to_watch'

export const MAL_STATUS_LABELS: Record<MALStatus, string> = {
  watching: 'Watching',
  completed: 'Completed',
  on_hold: 'On Hold',
  dropped: 'Dropped',
  plan_to_watch: 'Plan to Watch'
}

export const MAL_STATUS_COLORS: Record<MALStatus, string> = {
  watching: 'text-green-400 bg-green-400/10',
  completed: 'text-blue-400 bg-blue-400/10',
  on_hold: 'text-yellow-400 bg-yellow-400/10',
  dropped: 'text-red-400 bg-red-400/10',
  plan_to_watch: 'text-purple-400 bg-purple-400/10'
}

// Typed window.api
export interface WindowApi {
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
  }
  storage: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<void>
    getAll: () => Promise<Record<string, unknown>>
  }
  pahe: {
    search: (query: string) => Promise<PaheSearchResponse>
    episodes: (sessionId: string, page?: number) => Promise<PaheEpisodesResponse>
    playPage: (animeSession: string, episodeSession: string) => Promise<PlayPageData>
  }
  mal: {
    startAuth: (clientId: string, clientSecret: string) => Promise<{ success: boolean; accessToken: string }>
    refreshToken: () => Promise<string>
    logout: () => Promise<void>
    getAnimeList: (status?: string) => Promise<MALAnimeEntry[]>
    updateStatus: (animeId: number, updates: Record<string, unknown>) => Promise<MALListStatus>
    searchAnime: (query: string) => Promise<{ data: Array<{ node: MALAnimeNode }> }>
    getAnimeDetails: (animeId: number) => Promise<MALAnimeNode>
  }
}

declare global {
  interface Window {
    api: WindowApi
  }
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string
          httpreferrer?: string
          allowpopups?: string
          partition?: string
        },
        HTMLElement
      >
    }
  }
}
