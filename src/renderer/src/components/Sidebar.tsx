import { Home, Search, Settings, LogOut, User } from 'lucide-react'
import { useStore, type Page } from '../store/useStore'

const NAV: Array<{ id: Page; icon: React.FC<{ size: number }>; label: string }> = [
  { id: 'home', icon: Home, label: 'My List' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'settings', icon: Settings, label: 'Settings' }
]

export function Sidebar() {
  const { page, setPage, isAuthenticated, logout } = useStore()

  return (
    <aside className="w-16 flex flex-col items-center py-3 bg-bg-secondary border-r border-border gap-1 flex-shrink-0">
      {NAV.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setPage(id)}
          title={label}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
            page === id
              ? 'bg-accent text-white'
              : 'text-gray-500 hover:text-gray-200 hover:bg-bg-hover'
          }`}
        >
          <Icon size={18} />
        </button>
      ))}
      <div className="flex-1" />
      {isAuthenticated && (
        <button
          onClick={logout}
          title="Logout from MAL"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut size={18} />
        </button>
      )}
      {!isAuthenticated && (
        <button
          onClick={() => setPage('settings')}
          title="Login"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-200 hover:bg-bg-hover transition-colors"
        >
          <User size={18} />
        </button>
      )}
    </aside>
  )
}
