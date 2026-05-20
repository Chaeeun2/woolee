import { useContext } from 'react'
import { AdminAuthContext } from './AdminAuthContext'

export function useAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.')
  }
  return context
}
