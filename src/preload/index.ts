import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  },
  storage: {
    get: (key: string) => ipcRenderer.invoke('storage:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('storage:set', key, value),
    getAll: () => ipcRenderer.invoke('storage:getAll')
  },
  pahe: {
    search: (query: string) => ipcRenderer.invoke('pahe:search', query),
    episodes: (sessionId: string, page?: number) =>
      ipcRenderer.invoke('pahe:episodes', sessionId, page),
    playPage: (animeSession: string, episodeSession: string) =>
      ipcRenderer.invoke('pahe:playPage', animeSession, episodeSession)
  },
  mal: {
    startAuth: (clientId: string, clientSecret: string) =>
      ipcRenderer.invoke('mal:startAuth', clientId, clientSecret),
    refreshToken: () => ipcRenderer.invoke('mal:refreshToken'),
    logout: () => ipcRenderer.invoke('mal:logout'),
    getAnimeList: (status?: string) => ipcRenderer.invoke('mal:getAnimeList', status),
    updateStatus: (animeId: number, updates: Record<string, unknown>) =>
      ipcRenderer.invoke('mal:updateStatus', animeId, updates),
    searchAnime: (query: string) => ipcRenderer.invoke('mal:searchAnime', query),
    getAnimeDetails: (animeId: number) => ipcRenderer.invoke('mal:getAnimeDetails', animeId)
  }
})
