import { Star, Tv, Film, Plus } from 'lucide-react'
import type { PaheSearchResult } from '../types'

interface Props {
  anime: PaheSearchResult
  onClick: () => void
  watched?: number
  onAddToMAL?: () => void
}

export function AnimeCard({ anime, onClick, watched, onAddToMAL }: Props) {
  const progress = watched !== undefined && anime.episodes > 0
    ? Math.round((watched / anime.episodes) * 100)
    : null

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col bg-bg-card rounded-xl overflow-hidden border border-border hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/10 cursor-pointer text-left"
    >
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: '150%' }}>
        <img
          src={anime.poster}
          alt={anime.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Type badge */}
        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-semibold text-gray-300 flex items-center gap-1">
          {anime.type === 'Movie' ? <Film size={9} /> : <Tv size={9} />}
          {anime.type}
        </span>

        {/* Score */}
        {anime.score > 0 && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-semibold text-yellow-400 flex items-center gap-1">
            <Star size={9} fill="currentColor" />
            {anime.score.toFixed(2)}
          </span>
        )}

        {/* Add to MAL */}
        {onAddToMAL && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToMAL() }}
            title="Add to MAL"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-accent hover:bg-accent-hover rounded-lg text-white"
          >
            <Plus size={11} />
          </button>
        )}

        {/* Progress bar */}
        {progress !== null && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="p-2.5 flex-1">
        <h3 className="text-xs font-semibold text-white line-clamp-2 leading-tight">
          {anime.title}
        </h3>
        <p className="text-[10px] text-gray-500 mt-1">
          {anime.year} · {anime.episodes > 0 ? `${anime.episodes} eps` : '? eps'}
          {watched !== undefined && anime.episodes > 0 && ` · ${watched}/${anime.episodes}`}
        </p>
      </div>
    </div>
  )
}
