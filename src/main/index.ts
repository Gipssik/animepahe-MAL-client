import { app, BrowserWindow, ipcMain, session, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import * as http from 'http'
import * as crypto from 'crypto'
import axios from 'axios'
import { load as cheerioLoad } from 'cheerio'

// ─── Storage ────────────────────────────────────────────────────────────────

function storagePath(): string {
  return join(app.getPath('userData'), 'data.json')
}

function loadStore(): Record<string, unknown> {
  try {
    if (existsSync(storagePath())) return JSON.parse(readFileSync(storagePath(), 'utf-8'))
  } catch {}
  return {}
}

function saveStore(data: Record<string, unknown>): void {
  const dir = app.getPath('userData')
  mkdirSync(dir, { recursive: true })
  writeFileSync(storagePath(), JSON.stringify(data, null, 2))
}

let store: Record<string, unknown> = {}

// ─── AnimePahe HTTP client ────────────────────────────────────────────────────
// Uses axios with a manual cookie jar (interceptors) so that:
//   - Any cookie AnimePahe/Cloudflare sets on request N is sent on request N+1
//   - Full browser-like headers are sent on every request
//   - No Electron net.* forbidden-header restrictions apply

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

// ─── DDoS-Guard bypass ───────────────────────────────────────────────────────
// AnimePahe uses DDoS-Guard which requires a real browser to solve its
// JavaScript challenge. We open a visible BrowserWindow, let Chromium solve
// the challenge, then sync the resulting cookies into our axios client.

let warmUpDone = false
let warmUpPromise: Promise<void> | null = null
let warmUpWindow: BrowserWindow | null = null

async function syncSessionCookies(): Promise<void> {
  const cookies = await session.defaultSession.cookies.get({ url: 'https://animepahe.pw' })
  if (cookies.length) {
    sessionCookies = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  }
}

// Called before every AnimePahe request; resolves immediately after first pass
function ensureWarmedUp(): Promise<void> {
  if (warmUpDone) return Promise.resolve()
  if (warmUpPromise) return warmUpPromise

  warmUpPromise = new Promise<void>((resolve) => {
    warmUpWindow = new BrowserWindow({
      width: 960,
      height: 640,
      title: 'AnimePahe — Checking browser…',
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })

    let settled = false
    const finish = async () => {
      if (settled) return
      settled = true
      await syncSessionCookies()
      warmUpDone = true
      warmUpPromise = null
      if (warmUpWindow && !warmUpWindow.isDestroyed()) warmUpWindow.close()
      warmUpWindow = null
      resolve()
    }

    // DDoS-Guard challenge finishes → browser navigates to the real page
    warmUpWindow.webContents.on('did-finish-load', () => {
      const title = warmUpWindow?.webContents.getTitle() ?? ''
      const url   = warmUpWindow?.webContents.getURL() ?? ''
      const isDDG = title.toLowerCase().includes('ddos') ||
                    title.toLowerCase().includes('checking') ||
                    url.includes('ddos-guard')
      if (!isDDG) setTimeout(finish, 800)
    })

    // User closes the window manually → proceed anyway with whatever cookies we have
    warmUpWindow.on('closed', () => {
      warmUpWindow = null
      if (!settled) { settled = true; warmUpDone = true; warmUpPromise = null; resolve() }
    })

    setTimeout(() => finish(), 60_000) // hard cap: 60 s
    warmUpWindow.loadURL('https://animepahe.pw/')
  })

  return warmUpPromise
}

// Cookie string built from session after warm-up, refreshed on every sync
let sessionCookies = ''

const paheClient = axios.create({ timeout: 20000 })

paheClient.interceptors.request.use((config) => {
  const isPage = config.headers['X-Page-Request'] === '1'
  delete config.headers['X-Page-Request']

  config.headers = {
    ...config.headers,
    'User-Agent': UA,
    'Accept-Language': 'en-US,en;q=0.9',
    'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not=A?Brand";v="8"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    Referer: 'https://animepahe.pw/',
    ...(isPage
      ? {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Upgrade-Insecure-Requests': '1'
        }
      : { Accept: 'application/json, text/plain, */*', 'X-Requested-With': 'XMLHttpRequest' }),
    ...(sessionCookies ? { Cookie: sessionCookies } : {})
  }
  return config
})

async function paheApi(params: Record<string, string | number>): Promise<unknown> {
  await ensureWarmedUp()
  const resp = await paheClient.get('https://animepahe.pw/api', { params })
  return resp.data
}

async function pahePage(path: string): Promise<string> {
  await ensureWarmedUp()
  const resp = await paheClient.get(`https://animepahe.pw${path}`, {
    headers: { 'X-Page-Request': '1' },
    responseType: 'text'
  })
  return resp.data
}

// ─── MAL OAuth helpers ────────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  return crypto.randomBytes(40).toString('base64url').slice(0, 64)
}

let oauthServer: http.Server | null = null
let oauthWindow: BrowserWindow | null = null

function startOAuthServer(): Promise<{ code: string; state: string }> {
  return new Promise((resolve, reject) => {
    if (oauthServer) {
      oauthServer.close()
      oauthServer = null
    }
    oauthServer = http.createServer((req, res) => {
      const url = new URL(req.url!, 'http://localhost:18765')
      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code') || ''
        const state = url.searchParams.get('state') || ''
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(
          '<html><body style="background:#0d0d1a;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh"><h2>Authorization successful! You can close this window.</h2></body></html>'
        )
        oauthServer?.close()
        oauthServer = null
        oauthWindow?.close()
        oauthWindow = null
        resolve({ code, state })
      } else {
        res.writeHead(404)
        res.end()
      }
    })
    oauthServer.listen(18765, 'localhost', () => {})
    oauthServer.on('error', reject)
    setTimeout(() => reject(new Error('OAuth timeout')), 300000)
  })
}

async function exchangeToken(
  clientId: string,
  clientSecret: string,
  code: string,
  codeVerifier: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: 'http://localhost:18765/callback'
  })
  const resp = await axios.post('https://myanimelist.net/v1/oauth2/token', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
  return resp.data
}

async function refreshToken(
  clientId: string,
  clientSecret: string,
  refreshTok: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshTok
  })
  const resp = await axios.post('https://myanimelist.net/v1/oauth2/token', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
  return resp.data
}

function malClient(accessToken: string) {
  return axios.create({
    baseURL: 'https://api.myanimelist.net/v2',
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000
  })
}

// ─── Main window ─────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0d0d1a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── Session header modifications ────────────────────────────────────────────

function setupSessionHooks(): void {
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['*://kwik.cx/*', '*://*.kwik.cx/*', '*://animepahe.pw/*'] },
    (details, callback) => {
      const headers: Record<string, string[]> = {}
      for (const [k, v] of Object.entries(details.responseHeaders || {})) {
        const lower = k.toLowerCase()
        if (lower === 'x-frame-options') continue
        if (lower === 'content-security-policy') {
          const modified = (v as string[]).map((policy) =>
            policy
              .replace(/frame-ancestors[^;]*/gi, 'frame-ancestors *')
              .replace(/frame-src[^;]*/gi, 'frame-src *')
          )
          headers[k] = modified
          continue
        }
        headers[k] = v as string[]
      }
      callback({ responseHeaders: headers })
    }
  )

  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://kwik.cx/*', '*://*.kwik.cx/*'] },
    (details, callback) => {
      const headers = { ...details.requestHeaders }
      headers['Referer'] = 'https://animepahe.pw/'
      headers['Origin'] = 'https://animepahe.pw'
      callback({ requestHeaders: headers })
    }
  )
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────

function registerIpcHandlers(): void {
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize()
    else mainWindow?.maximize()
  })
  ipcMain.on('window:close', () => mainWindow?.close())

  ipcMain.handle('storage:get', (_e, key: string) => store[key] ?? null)
  ipcMain.handle('storage:set', (_e, key: string, value: unknown) => {
    store[key] = value
    saveStore(store)
  })
  ipcMain.handle('storage:getAll', () => store)

  // ─── AnimePahe ───────────────────────────────────────────────────────────

  ipcMain.handle('pahe:search', async (_e, query: string) => {
    return paheApi({ m: 'search', q: query })
  })

  ipcMain.handle('pahe:episodes', async (_e, sessionId: string, page = 1) => {
    return paheApi({ m: 'release', id: sessionId, sort: 'episode_asc', page })
  })

  ipcMain.handle('pahe:playPage', async (_e, animeSession: string, episodeSession: string) => {
    const html = await pahePage(`/play/${animeSession}/${episodeSession}`)
    const $ = cheerioLoad(html)

    const sources: Array<{
      src: string; fansub: string; resolution: string; audio: string; av1: string
    }> = []
    $('#resolutionMenu button[data-src]').each((_i, el) => {
      const btn = $(el)
      sources.push({
        src: btn.attr('data-src') || '',
        fansub: btn.attr('data-fansub') || '',
        resolution: btn.attr('data-resolution') || '',
        audio: btn.attr('data-audio') || '',
        av1: btn.attr('data-av1') || '0'
      })
    })

    const downloads: Array<{ href: string; label: string }> = []
    $('#pickDownload a[href]').each((_i, el) => {
      const a = $(el)
      downloads.push({ href: a.attr('href') || '', label: a.text().trim() })
    })

    const prevHref = $('.prequel a').attr('href') || null
    const nextHref = $('.sequel a').attr('href') || null
    const epMatch = $('title').text().match(/Ep\.\s*(\d+)/)
    const episodeNumber = epMatch ? parseInt(epMatch[1]) : null
    const malId = $('meta[name="mal"]').attr('content') || null
    const animeTitle = $('h1 a').first().text().trim() || null

    return { sources, downloads, prevHref, nextHref, episodeNumber, malId, animeTitle }
  })

  // ─── MAL Auth ────────────────────────────────────────────────────────────

  ipcMain.handle('mal:startAuth', async (_e, clientId: string, clientSecret: string) => {
    const codeVerifier = generateCodeVerifier()
    const state = crypto.randomBytes(16).toString('hex')

    const authUrl = new URL('https://myanimelist.net/v1/oauth2/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('code_challenge', codeVerifier)
    authUrl.searchParams.set('code_challenge_method', 'plain')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('redirect_uri', 'http://localhost:18765/callback')

    const serverPromise = startOAuthServer()

    oauthWindow = new BrowserWindow({
      width: 800,
      height: 700,
      parent: mainWindow!,
      modal: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })
    oauthWindow.loadURL(authUrl.toString())
    oauthWindow.on('closed', () => { oauthWindow = null })

    const { code } = await serverPromise
    const tokens = await exchangeToken(clientId, clientSecret, code, codeVerifier)

    store['mal_access_token'] = tokens.access_token
    store['mal_refresh_token'] = tokens.refresh_token
    store['mal_token_expires'] = Date.now() + tokens.expires_in * 1000
    store['mal_client_id'] = clientId
    store['mal_client_secret'] = clientSecret
    saveStore(store)

    return { success: true, accessToken: tokens.access_token }
  })

  ipcMain.handle('mal:refreshToken', async () => {
    const refreshTok = store['mal_refresh_token'] as string
    const clientId = store['mal_client_id'] as string
    const clientSecret = store['mal_client_secret'] as string
    if (!refreshTok || !clientId || !clientSecret) throw new Error('No refresh token stored')
    const tokens = await refreshToken(clientId, clientSecret, refreshTok)
    store['mal_access_token'] = tokens.access_token
    store['mal_refresh_token'] = tokens.refresh_token
    store['mal_token_expires'] = Date.now() + tokens.expires_in * 1000
    saveStore(store)
    return tokens.access_token
  })

  ipcMain.handle('mal:logout', () => {
    delete store['mal_access_token']
    delete store['mal_refresh_token']
    delete store['mal_token_expires']
    saveStore(store)
  })

  async function getValidToken(): Promise<string> {
    const token = store['mal_access_token'] as string
    const expires = store['mal_token_expires'] as number
    if (!token) throw new Error('Not authenticated')
    if (Date.now() > expires - 60000) {
      const tokens = await refreshToken(
        store['mal_client_id'] as string,
        store['mal_client_secret'] as string,
        store['mal_refresh_token'] as string
      )
      store['mal_access_token'] = tokens.access_token
      store['mal_refresh_token'] = tokens.refresh_token
      store['mal_token_expires'] = Date.now() + tokens.expires_in * 1000
      saveStore(store)
      return tokens.access_token
    }
    return token
  }

  ipcMain.handle('mal:getAnimeList', async (_e, status?: string) => {
    const token = await getValidToken()
    const client = malClient(token)
    const fields = 'list_status,num_episodes,main_picture,synopsis,mean,status,media_type,alternative_titles'
    const params: Record<string, string | number> = { limit: 1000, fields, nsfw: 1 }
    if (status) params.status = status

    const allEntries: unknown[] = []
    let url: string | null = '/users/@me/animelist'
    while (url) {
      const resp = await client.get(url, { params: url === '/users/@me/animelist' ? params : {} })
      allEntries.push(...resp.data.data)
      url = resp.data.paging?.next || null
    }
    return allEntries
  })

  ipcMain.handle('mal:updateStatus', async (_e, animeId: number, updates: Record<string, unknown>) => {
    const token = await getValidToken()
    const client = malClient(token)
    const body = new URLSearchParams()
    for (const [k, v] of Object.entries(updates)) body.set(k, String(v))
    const resp = await client.patch(`/anime/${animeId}/my_list_status`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    return resp.data
  })

  ipcMain.handle('mal:searchAnime', async (_e, query: string) => {
    const token = await getValidToken()
    const client = malClient(token)
    const resp = await client.get('/anime', {
      params: { q: query, limit: 15, fields: 'main_picture,num_episodes,status,mean,media_type,start_date,alternative_titles' }
    })
    return resp.data
  })

  ipcMain.handle('mal:getAnimeDetails', async (_e, animeId: number) => {
    const token = await getValidToken()
    const client = malClient(token)
    const fields = 'synopsis,mean,rank,status,num_episodes,main_picture,media_type,genres,my_list_status'
    const resp = await client.get(`/anime/${animeId}`, { params: { fields } })
    return resp.data
  })
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  store = loadStore()
  setupSessionHooks()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
