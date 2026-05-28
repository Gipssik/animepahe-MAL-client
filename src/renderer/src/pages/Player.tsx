import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Download,
  Loader2,
  Monitor,
  Volume2,
  Zap
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { RateModal } from '../components/RateModal'
import type { VideoSource } from '../types'

function parseNavSession(href: string | null): { animeSession: string; episodeSession: string } | null {
  if (!href) return null
  const match = href.match(/\/play\/([^/]+)\/([^/]+)/)
  if (!match) return null
  return { animeSession: match[1], episodeSession: match[2] }
}

export function Player() {
  const {
    currentPlayData,
    currentEpisodeSession,
    currentAnimeSession,
    currentEpisodeNum,
    selectedSource,
    playerLoading,
    setSelectedSource,
    openPlayer,
    setPage,
    markWatched,
    unmarkWatched,
    currentAnime,
    updateMALStatus,
    malList,
    isAuthenticated,
    autoUpdateMAL,
    autoAdvanceStatus,
    autoMarkComplete
  } = useStore()

  const webviewRef = useRef<HTMLElement>(null)
  const [marked, setMarked] = useState(false)
  const [ratingInfo, setRatingInfo] = useState<{ id: number; title: string } | null>(null)

  useEffect(() => {
    setMarked(false)
  }, [currentEpisodeSession])

  const handleMarkWatched = async () => {
    if (!currentAnimeSession || currentEpisodeNum === null) return
    markWatched(currentAnimeSession, currentEpisodeNum)
    setMarked(true)

    if (!autoUpdateMAL || !isAuthenticated || !currentPlayData?.malId) return
    const malId = parseInt(currentPlayData.malId)
    const entry = malList.find((e) => e.node.id === malId)
    if (!entry || currentEpisodeNum <= entry.list_status.num_episodes_watched) return

    const updates: Record<string, unknown> = { num_watched_episodes: currentEpisodeNum }
    const willComplete =
      autoMarkComplete && entry.node.num_episodes > 0 && currentEpisodeNum >= entry.node.num_episodes
    if (willComplete) {
      updates.status = 'completed'
    } else if (autoAdvanceStatus && entry.list_status.status === 'plan_to_watch') {
      updates.status = 'watching'
    }
    await updateMALStatus(malId, updates)
    if (willComplete) {
      setRatingInfo({
        id: malId,
        title: currentPlayData.animeTitle || currentAnime?.title || entry.node.title
      })
    }
  }

  const handleNav = async (href: string | null, direction: 'prev' | 'next') => {
    const nav = parseNavSession(href)
    if (!nav || currentEpisodeNum === null) return
    const epNum = direction === 'next' ? currentEpisodeNum + 1 : currentEpisodeNum - 1
    await openPlayer(nav.animeSession, nav.episodeSession, epNum)
  }

  const groupedSources = currentPlayData?.sources.reduce<
    Record<string, VideoSource[]>
  >((acc, src) => {
    const key = src.audio
    if (!acc[key]) acc[key] = []
    acc[key].push(src)
    return acc
  }, {})

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-primary">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border flex-shrink-0">
        <button
          onClick={() => setPage('anime')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-bg-hover transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-white truncate">
            {currentPlayData?.animeTitle || currentAnime?.title || 'Loading...'}
          </span>
          {currentEpisodeNum !== null && (
            <span className="text-xs text-gray-500 ml-2">Episode {currentEpisodeNum}</span>
          )}
        </div>

        {/* Ep navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleNav(currentPlayData?.prevHref ?? null, 'prev')}
            disabled={!currentPlayData?.prevHref}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-bg-hover transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => handleNav(currentPlayData?.nextHref ?? null, 'next')}
            disabled={!currentPlayData?.nextHref}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-bg-hover transition-colors disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Mark / unmark watched */}
        <button
          onClick={() => {
            if (marked) {
              if (currentAnimeSession && currentEpisodeNum !== null) {
                unmarkWatched(currentAnimeSession, currentEpisodeNum)
              }
              setMarked(false)
            } else {
              handleMarkWatched()
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            marked
              ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
              : 'bg-bg-card text-gray-400 hover:text-white hover:bg-bg-hover'
          }`}
        >
          <Check size={13} />
          {marked ? 'Watched' : 'Mark watched'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col bg-black overflow-hidden">
          {playerLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-accent" />
            </div>
          ) : selectedSource ? (
            <webview
              ref={webviewRef as React.RefObject<HTMLElement>}
              src={selectedSource.src}
              httpreferrer="https://animepahe.pw/"
              allowpopups="true"
              className="flex-1 w-full border-0"
              style={{ minHeight: 0 }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
              No video source available
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="w-64 flex-shrink-0 border-l border-border overflow-y-auto">
          {/* Source selector */}
          {groupedSources && Object.keys(groupedSources).length > 0 && (
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Video Sources
              </h3>
              {Object.entries(groupedSources).map(([audio, sources]) => (
                <div key={audio} className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Volume2 size={11} className="text-gray-500" />
                    <span className="text-[11px] text-gray-500 uppercase font-medium">
                      {audio === 'jpn' ? 'Japanese' : audio === 'eng' ? 'English Dub' : audio}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {sources.map((src) => (
                      <button
                        key={src.src}
                        onClick={() => setSelectedSource(src)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                          selectedSource?.src === src.src
                            ? 'bg-accent text-white'
                            : 'bg-bg-card text-gray-400 hover:text-white hover:bg-bg-hover'
                        }`}
                      >
                        <Monitor size={11} />
                        <span className="font-medium">{src.resolution}p</span>
                        {src.av1 === '1' && (
                          <span className="ml-auto flex items-center gap-0.5 text-[10px] text-green-400">
                            <Zap size={9} />
                            AV1
                          </span>
                        )}
                        <span className="text-[10px] opacity-70">{src.fansub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Downloads */}
          {currentPlayData?.downloads && currentPlayData.downloads.length > 0 && (
            <div className="px-4 pb-4 border-t border-border pt-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Downloads
              </h3>
              <div className="space-y-1">
                {currentPlayData.downloads.map((dl, i) => (
                  <a
                    key={i}
                    href={dl.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white bg-bg-card hover:bg-bg-hover transition-colors"
                  >
                    <Download size={11} />
                    <span className="truncate">{dl.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {ratingInfo && (
        <RateModal
          animeId={ratingInfo.id}
          animeTitle={ratingInfo.title}
          onClose={() => setRatingInfo(null)}
        />
      )}
    </div>
  )
}
