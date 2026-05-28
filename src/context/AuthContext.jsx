import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiUrl, clearStoredSession, getStoredToken } from '../lib/api'

export const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionError, setSessionError] = useState(null)

  const clearSession = useCallback(() => {
    clearStoredSession()
    setUser(null)
    setSessionError(null)
  }, [])

  const refreshSession = useCallback(async () => {
    setSessionError(null)
    const token = getStoredToken()
    if (!token) {
      setUser(null)
      return { authenticated: false }
    }

    let res
    try {
      res = await fetch(apiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (error) {
      const message = 'تعذر التحقق من الجلسة حالياً. تأكد من الاتصال أو حاول مرة أخرى.'
      setSessionError(message)
      throw error
    }

    if (res.status === 401 || res.status === 403 || res.status === 404) {
      clearSession()
      return { authenticated: false }
    }

    if (!res.ok) {
      const message = 'تعذر التحقق من الجلسة حالياً. تأكد من الاتصال أو حاول مرة أخرى.'
      setSessionError(message)
      throw new Error(message)
    }

    const data = await res.json()
    if (data?.user) {
      setUser(data.user)
      return { authenticated: true, user: data.user }
    }

    clearSession()
    return { authenticated: false }
  }, [clearSession])

  useEffect(() => {
    refreshSession()
      .catch(err => {
        console.error('Auth verification failed:', err)
        setSessionError('تعذر التحقق من الجلسة حالياً. تأكد من الاتصال أو حاول مرة أخرى.')
      })
      .finally(() => setLoading(false))
  }, [refreshSession])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        setSessionError(null)
        return { success: true }
      }

      return { success: false, error: data.error || 'فشل تسجيل الدخول' }
    } catch {
      return { success: false, error: 'حدث خطأ في الاتصال بالخادم. تأكد من اتصال الإنترنت.' }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (name, email, password, phone, location, bio) => {
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, location, bio })
      })
      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        setSessionError(null)
        return { success: true }
      }

      return { success: false, error: data.error || 'فشل إنشاء الحساب' }
    } catch {
      return { success: false, error: 'حدث خطأ في الاتصال بالخادم. تأكد من اتصال الإنترنت.' }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  const updateProfile = useCallback(async (formData) => {
    try {
      const token = getStoredToken()
      if (!token) {
        clearSession()
        return { success: false, error: 'الرجاء تسجيل الدخول أولاً' }
      }

      const res = await fetch(apiUrl('/api/user/profile'), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        setSessionError(null)
        return { success: true }
      }

      if (res.status === 401 || res.status === 403 || res.status === 404) {
        clearSession()
      }

      return { success: false, error: data.error || 'حدث خطأ أثناء التحديث' }
    } catch {
      return { success: false, error: 'حدث خطأ في الاتصال بالخادم' }
    }
  }, [clearSession])

  const getAvatarUrl = useCallback(() => {
    if (!user?.avatarUrl) return null
    if (user.avatarUrl.startsWith('data:')) return user.avatarUrl
    return `${apiUrl(user.avatarUrl)}?t=${user.updatedAt || ''}`
  }, [user])

  const contextValue = useMemo(() => ({
    user,
    loading,
    sessionError,
    login,
    register,
    logout,
    updateProfile,
    refreshSession,
    getAvatarUrl
  }), [user, loading, sessionError, login, register, logout, updateProfile, refreshSession, getAvatarUrl])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
