import { useContext } from 'react'
import { AdminMobileContext } from './AdminMobileContext'

export function useMobile() {
  const context = useContext(AdminMobileContext)
  if (!context) {
    throw new Error('useMobile은 MobileProvider 안에서 사용해야 합니다.')
  }
  return context
}
