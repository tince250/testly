import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../api/client'

const AuthContext = createContext(null)
const STORAGE_KEY = 'testly.token'

// JWT payload is base64url in the middle segment: { sub: email, role, exp }.
function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return { email: payload.sub, role: payload.role }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY))

  const user = useMemo(() => (token ? decodeToken(token) : null), [token])

  // Drop an expired/invalid token so we don't render as logged-in.
  useEffect(() => {
    if (token && !user) {
      localStorage.removeItem(STORAGE_KEY)
      setToken(null)
    }
  }, [token, user])

  function persist(accessToken) {
    localStorage.setItem(STORAGE_KEY, accessToken)
    setToken(accessToken)
  }

  const value = {
    token,
    user,
    async login(email, password) {
      const { access_token } = await api.login(email, password)
      persist(access_token)
    },
    async register(payload) {
      const { access_token } = await api.register(payload)
      persist(access_token)
    },
    async logout() {
      if (token) api.logout(token).catch(() => {})
      localStorage.removeItem(STORAGE_KEY)
      setToken(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
