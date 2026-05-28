import { create } from 'zustand'
import type {
  MALAnimeEntry,
  MALStatus,
  PaheSearchResult,
  PaheEpisode,
  PlayPageData,
  VideoSource
} from '../types'

export type Page = 'home' | 'search' | 'anime' | 'player' | 'settings'

interface WatchedMap {
  [animeSession: string]: number[]
}

export interface Preferences {
  preferredAudio: string
  preferredResolution: string
  autoUpdateMAL: boolean
  autoAdvanceStatus: boolean
  autoMarkComplete: boolean
}

const RESOLUTION_ORDER = ['1080', '720', '480', '360']

const PREF_STORAGE_KEYS: Record<keyof Preferences, string> = {
  preferredAudio: 'preferred_audio',
  preferredResolution: 'preferred_resolution',
  autoUpdateMAL: 'auto_update_mal',
  autoAdvanceStatus: 'auto_advance_status',
  autoMarkComplete: 'auto_mark_complete',
}

// Score-based source selection. Priority: audio match > closest resolution > higher resolution.
function pickBestSource(
  sources: VideoSource[],
  preferredAudio: string,
  preferredResolution: string
): VideoSource | null {
  if (!sources.length) return null
  const prefResIdx = RESOLUTION_ORDER.indexOf(preferredResolution)
  const scored = sources.map((s) => {
    const audioMatch = s.audio === preferredAudio ? 0 : 1
    const resIdx = RESOLUTION_ORDER.indexOf(s.resolution)
    const actualIdx = resIdx === -1 ? RESOLUTION_ORDER.length : resIdx
    const prefIdx = prefResIdx === -1 ? 0 : prefResIdx
    const resDist = Math.abs(actualIdx - prefIdx)
    return { s, score: audioMatch * 100 + resDist * 10 + actualIdx }
  })
  scored.sort((a, b) => a.score - b.score)
  return scored[0].s
}

interface Store {
  // Auth
  isAuthenticated: boolean
  malClientId: string
  malClientSecret: string

  // Navigation
  page: Page
  setPage: (p: Page) => void

  // MAL list
  malList: MALAnimeEntry[]
  malListLoading: boolean
  malListError: string | null
  loadMALList: () => Promise<void>

  // Search
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchResults: PaheSearchResult[]
  searchLoading: boolean
  searchError: string | null
  runSearch: (q: string) => Promise<void>

  // Current anime (AnimePahe)
  currentAnime: PaheSearchResult | null
  currentEpisodes: PaheEpisode[]
  episodesLoading: boolean
  episodesPage: number
  episodesTotalPages: number
  openAnime: (anime: PaheSearchResult) => Promise<void>
  loadMoreEpisodes: () => Promise<void>

  // Player
  currentPlayData: PlayPageData | null
  currentEpisodeSession: string | null
  currentAnimeSession: string | null
  currentEpisodeNum: number | null
  selectedSource: VideoSource | null
  playerLoading: boolean
  openPlayer: (animeSession: string, episodeSession: string, episodeNum: number) => Promise<void>
  setSelectedSource: (s: VideoSource) => void

  // Watched episodes (persisted)
  watched: WatchedMap
  markWatched: (animeSession: string, episodeNum: number) => void
  unmarkWatched: (animeSession: string, episodeNum: number) => void
  isWatched: (animeSession: string, episodeNum: number) => boolean

  // Preferences (persisted)
  preferredAudio: string
  preferredResolution: string
  autoUpdateMAL: boolean
  autoAdvanceStatus: boolean
  autoMarkComplete: boolean
  updatePreferences: (prefs: Partial<Preferences>) => Promise<void>

  // Settings / auth actions
  authenticate: (clientId: string, clientSecret: string) => Promise<void>
  logout: () => Promise<void>
  initFromStorage: () => Promise<void>

  // MAL status update
  updateMALStatus: (animeId: number, updates: Record<string, unknown>) => Promise<void>
}

export const useStore = create<Store>((set, get) => ({
  isAuthenticated: false,
  malClientId: '',
  malClientSecret: '',

  preferredAudio: 'jpn',
  preferredResolution: '1080',
  autoUpdateMAL: true,
  autoAdvanceStatus: true,
  autoMarkComplete: true,

  page: 'home',
  setPage: (p) => set({ page: p }),

  malList: [],
  malListLoading: false,
  malListError: null,
  loadMALList: async () => {
    set({ malListLoading: true, malListError: null })
    try {
      const list = await window.api.mal.getAnimeList()
      set({ malList: list, malListLoading: false })
    } catch (e) {
      set({ malListError: String(e), malListLoading: false })
    }
  },

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  searchResults: [],
  searchLoading: false,
  searchError: null,
  runSearch: async (q) => {
    set({ searchLoading: true, searchError: null, searchResults: [] })
    try {
      const data = await window.api.pahe.search(q)
      set({ searchResults: data.data, searchLoading: false })
    } catch (e) {
      set({ searchError: String(e), searchLoading: false })
    }
  },

  currentAnime: null,
  currentEpisodes: [],
  episodesLoading: false,
  episodesPage: 1,
  episodesTotalPages: 1,
  openAnime: async (anime) => {
    set({
      currentAnime: anime,
      currentEpisodes: [],
      episodesPage: 1,
      episodesLoading: true,
      page: 'anime'
    })
    try {
      const data = await window.api.pahe.episodes(anime.session, 1)
      set({
        currentEpisodes: data.data,
        episodesLoading: false,
        episodesTotalPages: data.last_page,
        episodesPage: 1
      })
    } catch {
      set({ episodesLoading: false })
    }
  },
  loadMoreEpisodes: async () => {
    const { currentAnime, episodesPage, episodesTotalPages, currentEpisodes } = get()
    if (!currentAnime || episodesPage >= episodesTotalPages) return
    const nextPage = episodesPage + 1
    set({ episodesLoading: true })
    try {
      const data = await window.api.pahe.episodes(currentAnime.session, nextPage)
      set({
        currentEpisodes: [...currentEpisodes, ...data.data],
        episodesPage: nextPage,
        episodesLoading: false
      })
    } catch {
      set({ episodesLoading: false })
    }
  },

  currentPlayData: null,
  currentEpisodeSession: null,
  currentAnimeSession: null,
  currentEpisodeNum: null,
  selectedSource: null,
  playerLoading: false,
  openPlayer: async (animeSession, episodeSession, episodeNum) => {
    set({
      playerLoading: true,
      currentAnimeSession: animeSession,
      currentEpisodeSession: episodeSession,
      currentEpisodeNum: episodeNum,
      currentPlayData: null,
      selectedSource: null,
      page: 'player'
    })
    try {
      const data = await window.api.pahe.playPage(animeSession, episodeSession)
      const { preferredAudio, preferredResolution } = get()
      const preferred = pickBestSource(data.sources, preferredAudio, preferredResolution)
      set({ currentPlayData: data, selectedSource: preferred, playerLoading: false })
    } catch {
      set({ playerLoading: false })
    }
  },
  setSelectedSource: (s) => {
    set({ selectedSource: s, preferredAudio: s.audio, preferredResolution: s.resolution })
    window.api.storage.set('preferred_audio', s.audio)
    window.api.storage.set('preferred_resolution', s.resolution)
  },

  watched: {},
  markWatched: (animeSession, episodeNum) => {
    const watched = { ...get().watched }
    const existing = watched[animeSession] || []
    if (!existing.includes(episodeNum)) {
      watched[animeSession] = [...existing, episodeNum]
      set({ watched })
      window.api.storage.set('watched', watched)
    }
  },
  unmarkWatched: (animeSession, episodeNum) => {
    const watched = { ...get().watched }
    watched[animeSession] = (watched[animeSession] || []).filter((n) => n !== episodeNum)
    set({ watched })
    window.api.storage.set('watched', watched)
  },
  isWatched: (animeSession, episodeNum) => {
    return (get().watched[animeSession] || []).includes(episodeNum)
  },

  updatePreferences: async (prefs) => {
    set(prefs as Partial<Store>)
    for (const [k, v] of Object.entries(prefs)) {
      const sk = PREF_STORAGE_KEYS[k as keyof Preferences]
      if (sk) await window.api.storage.set(sk, v as unknown)
    }
  },

  authenticate: async (clientId, clientSecret) => {
    await window.api.mal.startAuth(clientId, clientSecret)
    await window.api.storage.set('mal_client_id', clientId)
    await window.api.storage.set('mal_client_secret', clientSecret)
    set({ isAuthenticated: true, malClientId: clientId, malClientSecret: clientSecret })
    await get().loadMALList()
  },
  logout: async () => {
    await window.api.mal.logout()
    set({ isAuthenticated: false, malList: [] })
  },
  initFromStorage: async () => {
    try {
      const all = await window.api.storage.getAll()
      const token = all['mal_access_token'] as string | null
      const watched = (all['watched'] as WatchedMap) || {}
      const clientId = (all['mal_client_id'] as string) || ''
      const clientSecret = (all['mal_client_secret'] as string) || ''
      const preferredAudio = (all['preferred_audio'] as string) || 'jpn'
      const preferredResolution = (all['preferred_resolution'] as string) || '1080'
      const autoUpdateMAL = all['auto_update_mal'] !== undefined ? Boolean(all['auto_update_mal']) : true
      const autoAdvanceStatus = all['auto_advance_status'] !== undefined ? Boolean(all['auto_advance_status']) : true
      const autoMarkComplete = all['auto_mark_complete'] !== undefined ? Boolean(all['auto_mark_complete']) : true
      set({
        watched,
        malClientId: clientId,
        malClientSecret: clientSecret,
        preferredAudio,
        preferredResolution,
        autoUpdateMAL,
        autoAdvanceStatus,
        autoMarkComplete
      })
      if (token) {
        set({ isAuthenticated: true })
        get().loadMALList().catch(() => {})
      }
    } catch {
      // Storage read failed; app starts unauthenticated, user can re-login
    }
  },

  updateMALStatus: async (animeId, updates) => {
    await window.api.mal.updateStatus(animeId, updates)
    const { malList } = get()
    // MAL's PATCH param is num_watched_episodes but GET returns num_episodes_watched — normalize before merging locally
    const localUpdates: Record<string, unknown> = { ...updates }
    if ('num_watched_episodes' in localUpdates) {
      localUpdates['num_episodes_watched'] = localUpdates['num_watched_episodes']
      delete localUpdates['num_watched_episodes']
    }
    const newList = malList.map((entry) => {
      if (entry.node.id === animeId) {
        return { ...entry, list_status: { ...entry.list_status, ...localUpdates } }
      }
      return entry
    })
    set({ malList: newList as typeof malList })
  }
}))
