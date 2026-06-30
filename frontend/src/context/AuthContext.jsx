import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setUnauthorizedHandler } from '../api'

export const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(readStoredUser)

  const login = useCallback((newToken, userData) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(newToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    // Evita che i dati in cache di un utente restino visibili al successivo
    // accesso (profilo, tentativi, sfide risolte) nello stesso browser.
    queryClient.clear()
  }, [queryClient])

  // Aggiorna i dati utente locali (es. dopo cambio username/avatar).
  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem('user', JSON.stringify(next))
      return next
    })
  }, [])

  // Logout automatico su 401 proveniente dall'interceptor axios.
  useEffect(() => {
    setUnauthorizedHandler(() => logout())
  }, [logout])

  const value = useMemo(
    () => ({ user, token, isAuthenticated: !!token, login, logout, updateUser }),
    [user, token, login, logout, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
