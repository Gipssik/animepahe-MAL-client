import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { Home } from './pages/Home'
import { Search } from './pages/Search'
import { AnimeDetail } from './pages/AnimeDetail'
import { Player } from './pages/Player'
import { Settings } from './pages/Settings'

export default function App() {
  const { page, initFromStorage } = useStore()

  useEffect(() => {
    initFromStorage()
  }, [])

  const showSidebar = page !== 'player'

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-primary text-white">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar />}
        <main className="flex-1 flex overflow-hidden">
          {page === 'home' && <Home />}
          {page === 'search' && <Search />}
          {page === 'anime' && <AnimeDetail />}
          {page === 'player' && <Player />}
          {page === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  )
}
