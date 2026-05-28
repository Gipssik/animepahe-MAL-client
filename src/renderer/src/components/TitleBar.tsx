import { Minus, Square, X } from 'lucide-react'

export function TitleBar() {
  return (
    <div className="titlebar-drag flex items-center justify-between h-9 bg-bg-secondary border-b border-border px-3 flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
          <span className="text-[9px] font-bold text-white">AP</span>
        </div>
        <span className="text-xs font-semibold text-gray-400 titlebar-no-drag select-none">
          AnimePahe Client
        </span>
      </div>
      <div className="titlebar-no-drag flex items-center gap-1">
        <button
          onClick={() => window.api.window.minimize()}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <Minus size={12} />
        </button>
        <button
          onClick={() => window.api.window.maximize()}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <Square size={11} />
        </button>
        <button
          onClick={() => window.api.window.close()}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/80 text-gray-400 hover:text-white transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
