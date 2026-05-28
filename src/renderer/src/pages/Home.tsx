import { useEffect, useState } from 'react'
import { RefreshCw, Search, Tv, LogIn } from 'lucide-react'
import { useStore } from '../store/useStore'
import { MALCard } from '../components/MALCard'
import { RateModal } from '../components/RateModal'
import type { MALAnimeEntry, MALStatus } from '../types'
import { MAL_STATUS_LABELS } from '../types'

const STATUS_ORDER: MALStatus[] = ['watching', 'plan_to_watch', 'on_hold', 'dropped', 'completed']

export function Home() {
  const {
    isAuthenticated,
    malList,
    malListLoading,
    malListError,
    loadMALList,
    updateMALStatus,
    setPage,
    runSearch,
    openAnime
  } = useStore()

  const [activeStatus, setActiveStatus] = useState<MALStatus>('watching')
  const [localSearch, setLocalSearch] = useState('')
  const [ratingEntry, setRatingEntry] = useState<MALAnimeEntry | null>(null)

  useEffect(() => {
    if (isAuthenticated && malList.length === 0) loadMALList()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
        <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-2">
          <Tv size={32} className="text-accent" />
        </div>
        <h2 className="text-xl font-bold text-white">Connect to MyAnimeList</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          Link your MAL account to see your anime lists, track progress, and update statuses.
        </p>
        <button
          onClick={() => setPage('settings')}
          className="mt-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
        >
          <LogIn size={16} />
          Connect Account
        </button>
      </div>
    )
  }

  const byStatus = STATUS_ORDER.reduce<Record<MALStatus, MALAnimeEntry[]>>(
    (acc, s) => ({ ...acc, [s]: [] }),
    {} as Record<MALStatus, MALAnimeEntry[]>
  )
  for (const entry of malList) {
    const s = entry.list_status.status
    if (byStatus[s]) byStatus[s].push(entry)
  }

  const filtered = localSearch.trim()
    ? byStatus[activeStatus].filter((e) => {
        const q = localSearch.toLowerCase()
        return (
          e.node.title.toLowerCase().includes(q) ||
          (e.node.alternative_titles?.en?.toLowerCase().includes(q) ?? false)
        )
      })
    : byStatus[activeStatus]

  const handleCardClick = async (entry: MALAnimeEntry) => {
    await runSearch(entry.node.title)
    const results = useStore.getState().searchResults
    if (results.length > 0) {
      openAnime(results[0])
    } else {
      setPage('search')
    }
  }

  const handleStatusChange = async (entry: MALAnimeEntry, status: MALStatus) => {
    await updateMALStatus(entry.node.id, { status })
    if (status === 'completed') setRatingEntry(entry)
  }

  const handleEpisodeUpdate = async (entry: MALAnimeEntry, ep: number) => {
    const maxEp = entry.node.num_episodes
    const clamped = maxEp > 0 ? Math.min(ep, maxEp) : ep
    const updates: Record<string, unknown> = { num_watched_episodes: clamped }
    const willComplete = maxEp > 0 && clamped >= maxEp
    if (willComplete) updates.status = 'completed'
    await updateMALStatus(entry.node.id, updates)
    if (willComplete) setRatingEntry(entry)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">My Anime List</h1>
          <button
            onClick={loadMALList}
            disabled={malListLoading}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-hover transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={malListLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STATUS_ORDER.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeStatus === status
                  ? 'bg-accent text-white'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-bg-hover'
              }`}
            >
              {MAL_STATUS_LABELS[status]}
              <span className="ml-1.5 text-[10px] opacity-70">
                ({byStatus[status].length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search within list */}
      <div className="px-6 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Filter list..."
            className="w-full bg-bg-card border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {malListLoading && malList.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Loading your list...
          </div>
        )}
        {malListError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {malListError}
          </div>
        )}
        {!malListLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm gap-2">
            <span>No anime in this list</span>
          </div>
        )}
        <div className="grid grid-cols-1 gap-2 pb-4">
          {filtered.map((entry) => (
            <MALCard
              key={entry.node.id}
              entry={entry}
              onClick={() => handleCardClick(entry)}
              onStatusChange={(status) => handleStatusChange(entry, status)}
              onEpisodeUpdate={(ep) => handleEpisodeUpdate(entry, ep)}
              onRate={() => setRatingEntry(entry)}
            />
          ))}
        </div>
      </div>

      {ratingEntry && (
        <RateModal
          animeId={ratingEntry.node.id}
          animeTitle={ratingEntry.node.title}
          onClose={() => setRatingEntry(null)}
        />
      )}
    </div>
  )
}
