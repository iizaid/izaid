const LOCAL_API_BASE_URL = 'http://localhost:3000'
const PRODUCTION_API_BASE_URL = 'https://izaid.onrender.com'

const trimTrailingSlash = (value) => value.replace(/\/+$/, '')

const resolveApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim()
  if (configuredUrl) return trimTrailingSlash(configuredUrl)

  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  return isLocalHost ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL
}

export const API_BASE_URL = resolveApiBaseUrl()

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export const getStoredToken = () => localStorage.getItem('token')

export const clearStoredSession = () => {
  localStorage.removeItem('token')
}

export const authHeaders = () => {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
