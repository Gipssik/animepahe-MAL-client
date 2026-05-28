import { useState, useEffect } from 'react'
import { Search as SearchIcon, Loader2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { AnimeCard } from '../components/AnimeCard'
import { AddToMALModal } from '../components/AddToMALModal'
import { RateModal } from '../components/RateModal'
import type { PaheSearchResult } from '../types'

export function Search() {
  const { searchQuery, setSearchQuery, searchResults, searchLoading, searchError, runSearch, openAnime, isAuthenticated } =
    useStore()
  const [input, setInput] = useState(searchQuery)
  const [addToMALAnime, setAddToMALAnime] = useState<PaheSearchResult | null>(null)
  const [ratingInfo, setRatingInfo] = useState<{ id: number; title: string } | null>(null)

  useEffect(() => {
    setInput(searchQuery)
  }, [searchQuery])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = input.trim()
    if (!q) return
    setSearchQuery(q)
    runSearch(q)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex-shrink-0">
        <h1 className="text-xl font-bold text-white mb-4">Search AnimePahe</h1>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search anime..."
              autoFocus
              className="w-full bg-bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {searchLoading ? <Loader2 size={15} className="animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {searchError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4">
            {searchError}
          </div>
        )}

        {searchResults.length > 0 && (
          <>
            <p className="text-xs text-gray-500 mb-4">
              {searchResults.length} results for &ldquo;{searchQuery}&rdquo;
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {searchResults.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  onClick={() => openAnime(anime)}
                  onAddToMAL={isAuthenticated ? () => setAddToMALAnime(anime) : undefined}
                />
              ))}
            </div>
          </>
        )}

        {!searchLoading && searchResults.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
            No results found for &ldquo;{searchQuery}&rdquo;
          </div>
        )}

        {!searchQuery && !searchLoading && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-600 text-sm gap-2">
            <SearchIcon size={32} className="opacity-30" />
            <span>Search for an anime to get started</span>
          </div>
        )}
      </div>

      {addToMALAnime && (
        <AddToMALModal
          animeTitle={addToMALAnime.title}
          onClose={() => setAddToMALAnime(null)}
          onCompleted={(id, title) => {
            setAddToMALAnime(null)
            setRatingInfo({ id, title })
          }}
        />
      )}
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
