import { useState, useEffect } from 'react'
import { X, Loader2, Check, Plus } from 'lucide-react'
import type { MALAnimeNode, MALStatus } from '../types'
import { MAL_STATUS_LABELS } from '../types'
import { useStore } from '../store/useStore'

interface Props {
  animeTitle: string
  onClose: () => void
  onCompleted?: (malId: number, malTitle: string) => void
}

const STATUS_OPTIONS: MALStatus[] = ['watching', 'plan_to_watch', 'on_hold', 'dropped', 'completed']

export function AddToMALModal({ animeTitle, onClose, onCompleted }: Props) {
  const { loadMALList } = useStore()
  const [results, setResults] = useState<MALAnimeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [status, setStatus] = useState<MALStatus>('plan_to_watch')
  const [adding, setAdding] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    window.api.mal
      .searchAnime(animeTitle)
      .then((res) => {
        const items = res.data.map((d) => d.node)
        setResults(items)
        if (items.length > 0) setSelectedId(items[0].id)
        setLoading(false)
      })
      .catch((e) => {
        setError(String(e))
        setLoading(false)
      })
  }, [animeTitle])

  const handleAdd = async () => {
    if (!selectedId) return
    setAdding(true)
    setError(null)
    try {
      await window.api.mal.updateStatus(selectedId, { status })
      setSuccess(true)
      loadMALList().catch(() => {})
      if (status === 'completed' && onCompleted) {
        const selectedAnime = results.find((r) => r.id === selectedId)
        setTimeout(() => {
          onClose()
          onCompleted(selectedId, selectedAnime?.title ?? animeTitle)
        }, 800)
      } else {
        setTimeout(onClose, 1200)
      }
    } catch (e) {
      setError(String(e))
      setAdding(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-white">Add to MyAnimeList</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Searching MAL for &ldquo;{animeTitle}&rdquo;...
            </div>
          )}

          {!loading && error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center justify-center gap-2 py-8 text-green-400 text-sm">
              <Check size={16} />
              Added to your list!
            </div>
          )}

          {!loading && !success && results.length === 0 && !error && (
            <div className="py-8 text-center text-gray-500 text-sm">
              No results found on MAL for &ldquo;{animeTitle}&rdquo;
            </div>
          )}

          {!loading && !success && results.length > 0 && (
            <>
              <p className="text-xs text-gray-500 mb-3">Select the correct anime:</p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto mb-4 pr-1">
                {results.map((anime) => (
                  <button
                    key={anime.id}
                    onClick={() => setSelectedId(anime.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-colors ${
                      selectedId === anime.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-gray-600 hover:bg-bg-hover'
                    }`}
                  >
                    {anime.main_picture ? (
                      <img
                        src={anime.main_picture.medium}
                        alt={anime.title}
                        className="w-8 h-11 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-11 bg-bg-hover rounded flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">
                        {anime.alternative_titles?.en || anime.title}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {anime.media_type?.toUpperCase()}
                        {anime.start_date ? ` · ${anime.start_date.slice(0, 4)}` : ''}
                        {anime.num_episodes > 0 ? ` · ${anime.num_episodes} eps` : ''}
                        {anime.mean ? ` · ★ ${anime.mean}` : ''}
                      </p>
                    </div>
                    {selectedId === anime.id && (
                      <Check size={14} className="text-accent flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-500 mb-2">Status:</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      status === s
                        ? 'bg-accent text-white'
                        : 'bg-bg-hover text-gray-400 hover:text-white'
                    }`}
                  >
                    {MAL_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {!success && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={adding || loading || !selectedId}
              className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Add to List
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
