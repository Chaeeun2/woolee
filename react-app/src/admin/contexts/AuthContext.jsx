import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { AdminAuthContext } from './AdminAuthContext'
import { isAllowedAdmin, loginAdmin, logoutAdmin } from '../services/authService'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const isAdmin = await isAllowedAdmin(firebaseUser)
      setUser(isAdmin ? { firebaseUser, isAdmin: true } : null)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    login: async (email, password) => {
      const adminUser = await loginAdmin(email, password)
      setUser(adminUser)
      return adminUser
    },
    logout: async () => {
      await logoutAdmin()
      setUser(null)
    },
  }), [user, loading])

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
