import { ShieldAlert, X } from 'lucide-react'
import { useStore } from '../store/useStore'

export function PaheSetupModal() {
  const { page, paheConfigured, paheSetupNeeded, setPage, dismissPaheSetup } = useStore()

  // Show whenever a pahe action was blocked, except while the user is already on
  // Settings fixing it.
  if (!paheSetupNeeded || paheConfigured || page === 'settings') return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-bg-card border border-orange-500/40 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={dismissPaheSetup}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={20} className="text-orange-400" />
          </div>
          <h2 className="text-base font-semibold text-white">AnimePahe access needed</h2>
        </div>

        <p className="text-sm text-gray-400 leading-relaxed mb-5">
          AnimePahe is protected by Cloudflare, so the app needs a clearance cookie before it can
          search or play episodes. It takes a minute to set up in Settings — you only do it once.
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => setPage('settings')}
            className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors"
          >
            Open Settings
          </button>
          <button
            onClick={dismissPaheSetup}
            className="py-2.5 px-4 rounded-lg border border-border text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}
