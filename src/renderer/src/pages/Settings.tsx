import { useState, useEffect } from 'react'
import { ExternalLink, KeyRound, LogIn, AlertCircle, Sliders, ListChecks } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { Preferences } from '../store/useStore'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 focus:outline-none ${
        value ? 'bg-accent' : 'bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
          value ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function ToggleRow({
  label,
  description,
  value,
  onChange
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

const AUDIO_OPTIONS = [
  { value: 'jpn', label: 'Japanese' },
  { value: 'eng', label: 'English Dub' }
]

const RESOLUTION_OPTIONS = ['1080', '720', '480', '360']

export function Settings() {
  const {
    isAuthenticated,
    authenticate,
    logout,
    malClientId,
    malClientSecret,
    preferredAudio,
    preferredResolution,
    autoUpdateMAL,
    autoAdvanceStatus,
    autoMarkComplete,
    updatePreferences
  } = useStore()

  const [clientId, setClientId] = useState(malClientId)
  const [clientSecret, setClientSecret] = useState(malClientSecret)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (malClientId) setClientId(malClientId) }, [malClientId])
  useEffect(() => { if (malClientSecret) setClientSecret(malClientSecret) }, [malClientSecret])

  const handleAuth = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Both Client ID and Client Secret are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authenticate(clientId.trim(), clientSecret.trim())
    } catch (e) {
      setError(`Authentication failed: ${String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePref = (prefs: Partial<Preferences>) => {
    updatePreferences(prefs)
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-400 text-sm mb-8">Configure your experience</p>

        {/* MAL auth card */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <KeyRound size={18} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">MyAnimeList API</h2>
              <p className="text-xs text-gray-500">OAuth 2.0 authentication</p>
            </div>
          </div>

          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm text-green-400 font-medium">Connected to MyAnimeList</span>
              </div>
              <button
                onClick={logout}
                className="w-full py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg text-xs text-gray-400 space-y-1">
                <p className="font-medium text-accent">Setup instructions:</p>
                <ol className="list-decimal list-inside space-y-1 ml-1">
                  <li>Go to myanimelist.net → Account → API</li>
                  <li>Create a new Client ID</li>
                  <li>Set redirect URI to: <code className="text-accent">http://localhost:18765/callback</code></li>
                  <li>Paste Client ID and Secret below</li>
                </ol>
              </div>

              <a
                href="#"
                onClick={(e) => { e.preventDefault(); window.open('https://myanimelist.net/apiconfig') }}
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
              >
                <ExternalLink size={12} />
                Open MAL API settings
              </a>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Client ID</label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Your MAL Client ID"
                    className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Client Secret</label>
                  <input
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Your MAL Client Secret"
                    className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleAuth}
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <LogIn size={16} />
                {loading ? 'Opening browser...' : 'Connect to MyAnimeList'}
              </button>
            </div>
          )}
        </div>

        {/* Playback preferences card */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Sliders size={18} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Playback Preferences</h2>
              <p className="text-xs text-gray-500">Default quality and audio for new episodes</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Audio Language</label>
              <div className="flex gap-2">
                {AUDIO_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handlePref({ preferredAudio: value })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      preferredAudio === value
                        ? 'bg-accent text-white'
                        : 'bg-bg-primary text-gray-400 border border-border hover:border-accent/50 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Video Quality
                <span className="ml-1 text-gray-600 font-normal">
                  — closest available is selected when preferred is unavailable
                </span>
              </label>
              <div className="flex gap-2">
                {RESOLUTION_OPTIONS.map((res) => (
                  <button
                    key={res}
                    onClick={() => handlePref({ preferredResolution: res })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                      preferredResolution === res
                        ? 'bg-accent text-white'
                        : 'bg-bg-primary text-gray-400 border border-border hover:border-accent/50 hover:text-white'
                    }`}
                  >
                    {res}p
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* MAL sync card — only when authenticated */}
        {isAuthenticated && (
          <div className="bg-bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <ListChecks size={18} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">MAL Sync</h2>
                <p className="text-xs text-gray-500">Automatic tracking when marking episodes watched</p>
              </div>
            </div>

            <div>
              <ToggleRow
                label="Update episode count"
                description="Sync your watched episode count to MAL when you mark an episode as watched."
                value={autoUpdateMAL}
                onChange={(v) => handlePref({ autoUpdateMAL: v })}
              />
              <ToggleRow
                label="Advance to Watching"
                description="Automatically change status from Plan to Watch to Watching when you watch your first episode."
                value={autoAdvanceStatus}
                onChange={(v) => handlePref({ autoAdvanceStatus: v })}
              />
              <ToggleRow
                label="Mark as Completed"
                description="Set status to Completed automatically when you watch the last episode of a series."
                value={autoMarkComplete}
                onChange={(v) => handlePref({ autoMarkComplete: v })}
              />
            </div>
          </div>
        )}

        {/* About */}
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-3">About</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            AnimePahe Client integrates your MyAnimeList library with AnimePahe streaming.
            Search for anime, track episodes, and update your list status — all in one place.
            Video playback is powered by AnimePahe's embed system.
          </p>
        </div>
      </div>
    </div>
  )
}
