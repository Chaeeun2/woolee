import '../styles/admin.css'

const ADMIN_NAV_ITEMS = [
  { label: 'MAIN', href: '/admin/main' },
  { label: 'COM M ON', href: '/admin/common' },
  { label: 'QE', href: '/admin/qe' },
  { label: 'PROJECTS', href: '/admin/projects' },
  { label: 'CONVERSATIONS', href: '/admin/conversations' },
    { label: 'ABOUT', href: '/admin/about' },
]

export default function AdminLayout({ children, onNavigateAdmin }) {
  const currentPath = window.location.pathname
  const handleNavigate = (event, href) => {
    if (!href || href === '#') return
    event.preventDefault()
    onNavigateAdmin?.(href)
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/admin/main" onClick={(event) => handleNavigate(event, '/admin/main')}>
          WOO LEE Admin
        </a>
        <nav aria-label="관리자 메뉴">
          <ul>
            {ADMIN_NAV_ITEMS.map((item) => (
              <li
                key={item.label}
                className={[
                  currentPath === item.href ? 'active' : '',
                  item.disabled ? 'disabled' : '',
                ].filter(Boolean).join(' ')}
              >
                <a
                  href={item.href}
                  aria-disabled={item.disabled ? 'true' : undefined}
                  onClick={(event) => {
                    if (item.disabled) event.preventDefault()
                    else handleNavigate(event, item.href)
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="admin-content-wrapper">{children}</div>
    </div>
  )
}
