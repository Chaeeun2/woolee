import { useCallback, useEffect, useRef, useState } from 'react'
import './Header.css'

const menuItems = [
  { id: 'home', label: 'HOME', path: '/' },
  { id: 'common', label: 'COM M ON', path: '/com-m-on' },
  { id: 'qe', label: 'QE', path: '/qe' },
  { id: 'projects', label: 'PROJECTS', path: '/projects' },
  { id: 'conversation', label: 'CONVERSATIONS', path: '/conversation' },
  { id: 'about', label: 'ABOUT', path: '/about' },
]

function Header({
  activePage = 'home',
  onNavigate,
  onNavigatePath,
  brandLabel = 'WOO LEE',
  brandIconSrc = null,
  brandTargetPage = 'home',
  brandTargetPath = null,
  brandClassName = '',
  instagramUrl = '',
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const mobileOpenRef = useRef(false)

  const closeMenu = useCallback(() => {
    if (!mobileOpenRef.current) return
    mobileOpenRef.current = false
    setClosing(true)
    setTimeout(() => {
      setMobileOpen(false)
      setClosing(false)
    }, 280)
  }, [])

  useEffect(() => {
    queueMicrotask(closeMenu)
  }, [activePage, closeMenu])

  const handleMenuClick = (event, pageId) => {
    event.preventDefault()
    closeMenu()
    if (onNavigate) onNavigate(pageId)
  }

  const handleBrandClick = (event) => {
    event.preventDefault()
    closeMenu()
    if (brandTargetPath && onNavigatePath) {
      onNavigatePath(brandTargetPath, brandTargetPage)
      return
    }
    if (onNavigate) onNavigate(brandTargetPage)
  }

  const handleToggle = () => {
    if (mobileOpen) {
      closeMenu()
    } else {
      mobileOpenRef.current = true
      setMobileOpen(true)
    }
  }

  const isDefaultBrand = brandLabel === 'WOO LEE'

  return (
    <header className={`top-header anim-fade-down ${mobileOpen ? 'mobile-open' : ''} ${closing ? 'mobile-closing' : ''}`}>
      <a
        href={brandTargetPath || '/'}
        className={`brand-left ${brandClassName}`.trim()}
        onClick={handleBrandClick}
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
          {instagramUrl ? (
            <li className="desktop-instagram-item">
              <a
                className="instagram-link"
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5ZM12 7.25A4.75 4.75 0 1 1 7.25 12 4.75 4.75 0 0 1 12 7.25Zm0 2A2.75 2.75 0 1 0 14.75 12 2.75 2.75 0 0 0 12 9.25Zm4.95-2.7a1.15 1.15 0 1 1-1.15 1.15 1.15 1.15 0 0 1 1.15-1.15Z" />
                </svg>
              </a>
            </li>
          ) : null}
          {instagramUrl ? (
            <li className="mobile-instagram-item">
              <a
                className="mobile-instagram-link"
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5ZM12 7.25A4.75 4.75 0 1 1 7.25 12 4.75 4.75 0 0 1 12 7.25Zm0 2A2.75 2.75 0 1 0 14.75 12 2.75 2.75 0 0 0 12 9.25Zm4.95-2.7a1.15 1.15 0 1 1-1.15 1.15 1.15 1.15 0 0 1 1.15-1.15Z" />
                </svg>
              </a>
            </li>
          ) : null}
        </ul>
      </nav>
    </header>
  )
}

export default Header
