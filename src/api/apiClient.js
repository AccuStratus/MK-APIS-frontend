import axios from 'axios'

function isLocalHostName(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function isBadExternalApiUrl(url) {
  return url.includes('114.34.58.174') || url.includes('192.168.1.15') || url.includes('localhost') || url.includes('127.0.0.1')
}

function resolveApiBaseUrl() {
  const envUrl = (import.meta.env.VITE_AIPS_API_BASE_URL || '').trim().replace(/\/$/, '')
  const { protocol, hostname } = window.location

  // FIX16：本機開 127.0.0.1:5173 / localhost:5173 時，強制打本機 API。
  // 避免 Vite 舊快取或舊 .env 仍打到 114.34.58.174。
  if (isLocalHostName(hostname)) {
    return 'http://127.0.0.1:8000/api'
  }

  // LAN 連線時，優先打同一台主機的 8000。
  // 例如 http://192.168.1.50:5173 => http://192.168.1.50:8000/api
  if (!isLocalHostName(hostname)) {
    return `${protocol}//${hostname}:8000/api`
  }

  if (envUrl) {
    return envUrl
  }

  return `${protocol}//${hostname}:8000/api`
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('aips_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const { protocol, hostname } = window.location

  // FIX16：若目前是本機前端，任何 request 都不得再打 114.34.58.174 或其他舊 IP。
  if (isLocalHostName(hostname)) {
    config.baseURL = 'http://127.0.0.1:8000/api'
  } else if (config.baseURL && isBadExternalApiUrl(config.baseURL)) {
    config.baseURL = `${protocol}//${hostname}:8000/api`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const baseURL = error?.config?.baseURL || ''
    const url = error?.config?.url || ''
    const method = error?.config?.method || ''
    console.error('[AIPS API ERROR]', {
      method,
      baseURL,
      url,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message
    })
    return Promise.reject(error)
  }
)

export default apiClient
