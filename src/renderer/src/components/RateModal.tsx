import { useState } from 'react'
import { X, Star, Loader2 } from 'lucide-react'
import { useStore } from '../store/useStore'

interface Props {
  animeId: number
  animeTitle: string
  onClose: () => void
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Appalling',
  2: 'Horrible',
  3: 'Very Bad',
  4: 'Bad',
  5: 'Average',
  6: 'Fine',
  7: 'Good',
  8: 'Very Good',
  9: 'Great',
  10: 'Masterpiece'
}

export function RateModal({ animeId, animeTitle, onClose }: Props) {
  const { updateMALStatus } = useStore()
  const [selected, setSelected] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const display = hovered ?? selected

  const handleSubmit = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await updateMALStatus(animeId, { score: selected })
    } finally {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border rounded-2xl w-full max-w-sm mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-white">Rate anime</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm text-white font-medium line-clamp-1 mb-0.5">{animeTitle}</p>
          <p className="text-xs text-gray-500 mb-5">How would you rate it?</p>

          <div className="flex gap-1 justify-between mb-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => setSelected(selected === n ? null : n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(null)}
                className={`flex-1 py-2 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  display !== null && n <= display
                    ? 'bg-yellow-400 text-black'
                    : 'bg-bg-hover text-gray-500 hover:bg-yellow-400/20 hover:text-yellow-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <p className="text-center text-xs h-4 text-yellow-400">
            {display ? `${display}/10 — ${SCORE_LABELS[display]}` : ''}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || saving}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Star size={13} fill="currentColor" />
            )}
            {selected ? `Rate ${selected}/10` : 'Rate'}
          </button>
        </div>
      </div>
    </div>
  )
}
