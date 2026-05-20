import {
  getIdToken,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth } from '../../lib/firebase'

const getAllowedAdminEmails = () => (
  (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
)

const getTokenClaims = async (user) => {
  const token = await getIdToken(user, true)
  const [, payload] = token.split('.')
  if (!payload) return {}

  return JSON.parse(window.atob(payload))
}

export const isAllowedAdmin = async (user) => {
  if (!user?.email) return false

  const allowedEmails = getAllowedAdminEmails()
  const emailAllowedByEnv = allowedEmails.includes(user.email.toLowerCase())

  try {
    const claims = await getTokenClaims(user)
    if (claims.admin === true) return true
    if (claims.admin === false) return false
  } catch (error) {
    console.warn('관리자 커스텀 클레임 확인 실패:', error)
  }

  return emailAllowedByEnv
}

export const loginAdmin = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  const { user } = userCredential

  const isAdmin = await isAllowedAdmin(user)
  if (!isAdmin) {
    await signOut(auth)
    throw new Error('관리자 권한이 없는 계정입니다.')
  }

  return { firebaseUser: user, isAdmin: true }
}

export const logoutAdmin = () => signOut(auth)
