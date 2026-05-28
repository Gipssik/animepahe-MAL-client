import { useEffect, useState } from 'react'
import { ArrowLeft, Star, Calendar, Tv, Loader2, CheckCircle, Clock, Play } from 'lucide-react'
import { useStore } from '../store/useStore'

function formatDuration(dur: string) {
  const [h, m] = dur.split(':')
  if (h === '00') return `${parseInt(m)}m`
  return `${parseInt(h)}h ${parseInt(m)}m`
}

export function AnimeDetail() {
  const {
    currentAnime,
    currentEpisodes,
    episodesLoading,
    episodesPage,
    episodesTotalPages,
    loadMoreEpisodes,
    openPlayer,
    isWatched,
    markWatched,
    unmarkWatched,
    setPage
  } = useStore()

  const [highlightEp, setHighlightEp] = useState<number | null>(null)

  if (!currentAnime) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        No anime selected
      </div>
    )
  }

  const handlePlay = async (episodeSession: string, episodeNum: number) => {
    setHighlightEp(episodeNum)
    await openPlayer(currentAnime.session, episodeSession, episodeNum)
  }

  const firstUnwatched = currentEpisodes.find(
    (ep) => !isWatched(currentAnime.session, ep.episode)
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header / Hero */}
      <div className="flex-shrink-0 relative">
        {/* Blurred background */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={currentAnime.poster}
            alt=""
            className="w-full h-full object-cover scale-110 blur-xl opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/60 to-bg-primary" />
        </div>

        <div className="relative flex gap-5 px-6 pt-5 pb-4">
          <button
            onClick={() => setPage('search')}
            className="absolute top-4 left-4 p-1.5 rounded-lg bg-bg-card/80 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </button>

          <img
            src={currentAnime.poster}
            alt={currentAnime.title}
            className="w-28 h-40 object-cover rounded-xl shadow-2xl flex-shrink-0 ml-6"
          />

          <div className="flex-1 min-w-0 pt-2">
            <h1 className="text-xl font-bold text-white leading-tight mb-2">
              {currentAnime.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {currentAnime.score > 0 && (
                <span className="flex items-center gap-1 text-sm text-yellow-400 font-semibold">
                  <Star size={13} fill="currentColor" />
                  {currentAnime.score.toFixed(2)}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Tv size={12} />
                {currentAnime.type}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar size={12} />
                {currentAnime.season} {currentAnime.year}
              </span>
              <span className="text-xs text-gray-400">
                {currentAnime.episodes > 0 ? `${currentAnime.episodes} episodes` : '? episodes'}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  currentAnime.status === 'Finished Airing'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {currentAnime.status}
              </span>
            </div>

            {firstUnwatched && (
              <button
                onClick={() => handlePlay(firstUnwatched.session, firstUnwatched.episode)}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Play size={14} fill="currentColor" />
                {firstUnwatched.episode === 1 ? 'Start Watching' : `Resume Ep. ${firstUnwatched.episode}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Episodes */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-300">
            Episodes ({currentEpisodes.length}
            {episodesTotalPages > 1 ? `/${currentAnime.episodes}` : ''})
          </h2>
        </div>

        {episodesLoading && currentEpisodes.length === 0 && (
          <div className="flex items-center gap-2 justify-center h-20 text-gray-500 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading episodes...
          </div>
        )}

        <div className="grid grid-cols-1 gap-1.5">
          {currentEpisodes.map((ep) => {
            const watched = isWatched(currentAnime.session, ep.episode)
            return (
              <button
                key={ep.id}
                onClick={() => handlePlay(ep.session, ep.episode)}
                className={`group flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  watched
                    ? 'bg-bg-card border-border opacity-60 hover:opacity-100'
                    : highlightEp === ep.episode
                    ? 'bg-accent/20 border-accent/50'
                    : 'bg-bg-card border-border hover:border-accent/40 hover:bg-bg-hover'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <img
                    src={ep.snapshot}
                    alt={`Episode ${ep.episode}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Play size={14} className="text-white opacity-80" fill="currentColor" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      Episode {ep.episode}
                    </span>
                    {ep.filler === 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                        Filler
                      </span>
                    )}
                    {ep.title && (
                      <span className="text-xs text-gray-400 truncate">{ep.title}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-500">{ep.disc}</span>
                    <span className="text-xs text-gray-500">{ep.audio.toUpperCase()}</span>
                    <span className="text-xs text-gray-500">{formatDuration(ep.duration)}</span>
                  </div>
                </div>

                {/* Watch status */}
                <div className="flex-shrink-0">
                  {watched ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); unmarkWatched(currentAnime.session, ep.episode) }}
                      className="text-green-400 hover:text-gray-500 transition-colors"
                      title="Click to mark as unwatched"
                    >
                      <CheckCircle size={16} />
                    </button>
                  ) : (
                    <Clock size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Load more */}
        {episodesPage < episodesTotalPages && (
          <button
            onClick={loadMoreEpisodes}
            disabled={episodesLoading}
            className="mt-4 w-full py-2.5 rounded-xl border border-border text-gray-400 hover:text-white hover:border-accent/40 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {episodesLoading ? <Loader2 size={14} className="animate-spin" /> : null}
            Load more episodes
          </button>
        )}
      </div>
    </div>
  )
}
