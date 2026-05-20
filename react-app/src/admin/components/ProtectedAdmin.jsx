import Login from '../pages/Login'
import { useAuth } from '../contexts/useAuth'
import '../styles/admin.css'

export default function ProtectedAdmin({ children, onNavigateAdmin }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="admin-auth-loading">
        Firebase 인증 확인 중...
      </div>
    )
  }

  if (!user?.isAdmin) {
    return <Login onLoggedIn={() => onNavigateAdmin('/admin/main', true)} />
  }

  return children
}
