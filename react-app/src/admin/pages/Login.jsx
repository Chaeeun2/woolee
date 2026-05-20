import { useState } from 'react'
import { useAuth } from '../contexts/useAuth'
import './Login.css'

export default function Login({ onLoggedIn }) {
  const { login, loading: authLoading } = useAuth()
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await login(credentials.email, credentials.password)
      onLoggedIn()
    } catch (loginError) {
      setError(loginError.message || '로그인에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-form" onSubmit={handleSubmit}>
        <h2 className="admin-page-title">WOO LEE Admin</h2>
        <p className="admin-login-guide">관리자 계정으로 로그인해주세요.</p>

        {error && <div className="admin-error-message">{error}</div>}

        <div className="admin-form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="admin-email">이메일</label>
          <input
            id="admin-email"
            type="email"
            className="admin-input"
            value={credentials.email}
            onChange={(event) => setCredentials((prev) => ({ ...prev, email: event.target.value }))}
            autoComplete="username"
            disabled={submitting || authLoading}
            required
          />
        </div>

        <div className="admin-form-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="admin-password">비밀번호</label>
          <input
            id="admin-password"
            type="password"
            className="admin-input"
            value={credentials.password}
            onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
            autoComplete="current-password"
            disabled={submitting || authLoading}
            required
          />
        </div>

        <button className="admin-button" type="submit" disabled={submitting || authLoading}>
          {submitting ? '로그인 중...' : '관리자 로그인'}
        </button>
      </form>
    </div>
  )
}
