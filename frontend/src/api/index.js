import axios from 'axios'

// Base URL dell'API. VITE_API_URL (dai file .env) è un override opzionale;
// in sua assenza si sceglie automaticamente in base alla modalità di build:
//   - produzione (Docker + nginx proxy): /api
//   - sviluppo (npm run dev): http://localhost:8080/api
const baseURL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8080/api')

// Origine del backend, per risolvere gli asset statici (es. avatar in /uploads).
// Da "http://localhost:8080/api" -> "http://localhost:8080"; da "/api" -> "".
export const API_ORIGIN = baseURL.replace(/\/api\/?$/, '')

export function resolveAssetUrl(path) {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  return `${API_ORIGIN}${path}`
}

const api = axios.create({ baseURL })

// Interceptor request: aggiunge il token JWT se presente.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor response: su 401 esegue il logout automatico.
let onUnauthorized = null
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized()
    }
    return Promise.reject(error)
  }
)

// Estrae un messaggio leggibile dalla risposta di errore strutturata.
export function errorMessage(error, fallback = 'Si è verificato un errore') {
  return error?.response?.data?.error || fallback
}

export const authAPI = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
}

export const challengesAPI = {
  getAll: () => api.get('/challenges').then((r) => r.data),
  getById: (id) => api.get(`/challenges/${id}`).then((r) => r.data),
  getMy: () => api.get('/challenges/my').then((r) => r.data),
  getSolved: () => api.get('/challenges/solved').then((r) => r.data),
  create: (data) => api.post('/challenges', data).then((r) => r.data),
  attempt: (id, regex) => api.post(`/challenges/${id}/attempts`, { regex }).then((r) => r.data),
  getAttempts: (id) => api.get(`/challenges/${id}/attempts`).then((r) => r.data),
}

export const leaderboardAPI = {
  get: () => api.get('/leaderboard').then((r) => r.data),
}

export const userAPI = {
  getMe: () => api.get('/users/me').then((r) => r.data),
  updateMe: (data) => api.put('/users/me', data).then((r) => r.data),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data)
  },
  getByUsername: (username) => api.get(`/users/${username}`).then((r) => r.data),
}

export default api
