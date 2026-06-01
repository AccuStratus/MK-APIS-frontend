import axios from 'axios'

function isLocalHostName(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function isLocalApiUrl(url) {
  return url.includes('127.0.0.1') || url.includes('localhost')
}

function resolveApiBaseUrl() {
  const envUrl = (import.meta.env.VITE_AIPS_API_BASE_URL || '').trim()
  const { protocol, hostname } = window.location

  // 關鍵修正：
  // 如果使用者是從別台電腦用 http://192.168.x.x:5173 連進來，
  // 就算 .env 還殘留 http://127.0.0.1:8000/api，也不要使用 127.0.0.1。
  if (!isLocalHostName(hostname)) {
    return `${protocol}//${hostname}:8000/api`
  }

  // 只有在本機 localhost 開前端時，才允許使用 .env。
  if (envUrl && envUrl !== '') {
    return envUrl.replace(/\/$/, '')
  }

  return `${protocol}//${hostname}:8000/api`
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('aips_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // 再保險一次：
  // 防止任何地方意外把 baseURL 設回 127.0.0.1。
  const { protocol, hostname } = window.location
  if (!isLocalHostName(hostname) && config.baseURL && isLocalApiUrl(config.baseURL)) {
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
