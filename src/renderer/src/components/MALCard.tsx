import { Star, CheckCircle, Play, Clock, XCircle, BookmarkPlus } from 'lucide-react'
import type { MALAnimeEntry, MALStatus } from '../types'
import { MAL_STATUS_LABELS, MAL_STATUS_COLORS } from '../types'

const STATUS_ICONS: Record<MALStatus, React.FC<{ size: number }>> = {
  watching: Play,
  completed: CheckCircle,
  on_hold: Clock,
  dropped: XCircle,
  plan_to_watch: BookmarkPlus
}

interface Props {
  entry: MALAnimeEntry
  onClick: () => void
  onStatusChange: (status: MALStatus) => void
  onEpisodeUpdate: (ep: number) => void
  onRate?: () => void
}

export function MALCard({ entry, onClick, onStatusChange, onEpisodeUpdate, onRate }: Props) {
  const { node, list_status } = entry
  const progress =
    node.num_episodes > 0
      ? Math.round((list_status.num_episodes_watched / node.num_episodes) * 100)
      : 0

  const StatusIcon = STATUS_ICONS[list_status.status]
  const statusClass = MAL_STATUS_COLORS[list_status.status]

  return (
    <div className="group flex gap-3 bg-bg-card hover:bg-bg-hover rounded-xl border border-border hover:border-accent/40 transition-all p-3">
      {/* Poster */}
      <button onClick={onClick} className="flex-shrink-0">
        <img
          src={node.main_picture?.medium}
          alt={node.title}
          className="w-14 h-20 object-cover rounded-lg"
          loading="lazy"
        />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <button onClick={onClick} className="text-left">
          <h3 className="text-sm font-semibold text-white hover:text-accent transition-colors line-clamp-2 leading-tight">
            {node.alternative_titles?.en || node.title}
          </h3>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${statusClass}`}>
            <StatusIcon size={9} />
            {MAL_STATUS_LABELS[list_status.status]}
          </span>
          {node.mean && (
            <span className="text-[10px] text-yellow-400 flex items-center gap-0.5" title="Community score">
              <Star size={9} fill="currentColor" />
              {node.mean.toFixed(1)}
            </span>
          )}
          {list_status.score > 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); onRate?.() }}
              title="Your score — click to update"
              className="text-[10px] text-accent flex items-center gap-0.5 hover:text-accent-hover transition-colors"
            >
              <Star size={9} fill="currentColor" />
              {list_status.score}
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onRate?.() }}
              title="Rate this anime"
              className="text-[10px] text-gray-600 hover:text-accent flex items-center gap-0.5 transition-colors"
            >
              <Star size={9} />
              Rate
            </button>
          )}
          <span className="text-[10px] text-gray-500">{node.media_type?.toUpperCase()}</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 flex-shrink-0">
            {list_status.num_episodes_watched}/{node.num_episodes || '?'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mt-1">
          {list_status.status === 'watching' && (
            <button
              onClick={() => onEpisodeUpdate(list_status.num_episodes_watched + 1)}
              className="text-[10px] px-2 py-0.5 bg-accent/20 hover:bg-accent/40 text-accent rounded transition-colors"
            >
              +1 ep
            </button>
          )}
          <select
            value={list_status.status}
            onChange={(e) => onStatusChange(e.target.value as MALStatus)}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] bg-bg-primary border border-border rounded px-1 py-0.5 text-gray-400 cursor-pointer"
          >
            <option value="watching">Watching</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="dropped">Dropped</option>
            <option value="plan_to_watch">Plan to Watch</option>
          </select>
        </div>
      </div>
    </div>
  )
}
