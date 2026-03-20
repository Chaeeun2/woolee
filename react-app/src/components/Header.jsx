import { useState, useEffect } from 'react'
import './Header.css'

const menuItems = [
  { id: 'home', label: 'HOME', path: '/' },
  { id: 'common', label: 'COM M ON', path: '/com-m-on' },
  { id: 'qe', label: 'QE', path: '/qe' },
  { id: 'projects', label: 'PROJECTS', path: '/projects' },
  { id: 'conversation', label: 'CONVERSATION', path: '/conversation' },
  { id: 'about', label: 'ABOUT', path: '/about' },
]

function Header({
  activePage = 'home',
  onNavigate,
  brandLabel = 'WOO LEE',
  brandIconSrc = null,
  brandTargetPage = 'home',
  brandClassName = '',
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const closeMenu = () => {
    if (!mobileOpen) return
    setClosing(true)
    setTimeout(() => {
      setMobileOpen(false)
      setClosing(false)
    }, 280)
  }

  useEffect(() => {
    if (mobileOpen) closeMenu()
  }, [activePage])

  const handleMenuClick = (event, pageId) => {
    event.preventDefault()
    closeMenu()
    if (onNavigate) onNavigate(pageId)
  }

  const handleToggle = () => {
    if (mobileOpen) {
      closeMenu()
    } else {
      setMobileOpen(true)
    }
  }

  const isDefaultBrand = brandLabel === 'WOO LEE'

  return (
    <header className={`top-header anim-fade-down ${mobileOpen ? 'mobile-open' : ''} ${closing ? 'mobile-closing' : ''}`}>
      <a
        href="/"
        className={`brand-left ${brandClassName}`.trim()}
        onClick={(event) => handleMenuClick(event, brandTargetPage)}
      >
        {brandIconSrc ? (
          <img className="brand-icon" src={brandIconSrc} alt="" aria-hidden="true" />
        ) : null}
        {isDefaultBrand ? (
          <>
            <span style={{ fontWeight: 600 }}>WOO</span>{' '}
            <span className="italic" style={{ fontWeight: '400' }}>
              LEE
            </span>
          </>
        ) : (
          <span>{brandLabel}</span>
        )}
      </a>

      <button
        className={`mobile-toggle ${mobileOpen && !closing ? 'is-open' : ''}`}
        onClick={handleToggle}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        <span className="toggle-bar" />
        <span className="toggle-bar" />
      </button>

      <nav className={`mobile-nav ${mobileOpen ? 'is-visible' : ''} ${closing ? 'is-closing' : ''}`} aria-label="Main menu">
        <ul className="menu-list">
          {menuItems.map((item) => (
            <li key={item.id}>
              <a
                href={item.path}
                className={activePage === item.id ? 'is-active' : ''}
                onClick={(event) => handleMenuClick(event, item.id)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default Header
