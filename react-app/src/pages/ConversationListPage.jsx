import { useEffect, useRef, useState } from 'react'
import './ConversationPage.css'
import { CONVERSATION_CONTENT_ITEMS } from '../data/projectData'

const ARROW_ICON = 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/arrowtop.png'
const conversationLinks = CONVERSATION_CONTENT_ITEMS
const CURSOR_OFFSET = 18
const MOBILE_MQ = '(max-width: 768px)'
const MOBILE_PREVIEW_BOX = 210

function useMobileLayout() {
  const [isMobileLayout, setIsMobileLayout] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const onChange = () => setIsMobileLayout(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isMobileLayout
}

function anchorPreviewPosition(anchorEl) {
  const rect = anchorEl.getBoundingClientRect()
  const gap = 8
  let left = rect.right + gap
  let top = rect.bottom + gap
  left = Math.min(left, window.innerWidth - MOBILE_PREVIEW_BOX - gap)
  left = Math.max(gap, left)
  top = Math.min(top, window.innerHeight - MOBILE_PREVIEW_BOX - gap)
  top = Math.max(gap, top)
  return { left, top }
}

function ConversationListPage({ onOpenContent }) {
  const isMobileLayout = useMobileLayout()
  const [hoverPreview, setHoverPreview] = useState(null)
  const [touchPreview, setTouchPreview] = useState(null)
  const [touchImageReady, setTouchImageReady] = useState(false)
  const mobileTapRef = useRef(null)
  const touchLoadTargetRef = useRef({ linkId: null, src: null })

  useEffect(() => {
    const urls = [...new Set(conversationLinks.map((l) => l.image).filter(Boolean))]
    const linkEls = urls.map((url) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
      return link
    })
    return () => {
      linkEls.forEach((el) => el.remove())
    }
  }, [])

  useEffect(() => {
    if (!isMobileLayout) {
      setTouchPreview(null)
      setTouchImageReady(false)
    }
  }, [isMobileLayout])

  useEffect(() => {
    const src = touchPreview?.src
    const linkId = touchPreview?.linkId
    if (!src || linkId == null) {
      setTouchImageReady(false)
      touchLoadTargetRef.current = { linkId: null, src: null }
      return
    }

    touchLoadTargetRef.current = { linkId, src }
    setTouchImageReady(false)

    const img = new Image()
    let cancelled = false

    const commitIfCurrent = () => {
      if (cancelled) return
      const t = touchLoadTargetRef.current
      if (t.linkId !== linkId || t.src !== src) return
      setTouchImageReady(true)
    }

    img.onload = commitIfCurrent
    img.onerror = () => {
      if (cancelled) return
      const t = touchLoadTargetRef.current
      if (t.linkId !== linkId || t.src !== src) return
      setTouchImageReady(false)
      setTouchPreview(null)
    }
    img.src = src

    if (img.complete && img.naturalWidth > 0) {
      commitIfCurrent()
    }

    return () => {
      cancelled = true
      img.onload = null
      img.onerror = null
    }
  }, [touchPreview?.linkId, touchPreview?.src])

  useEffect(() => {
    if (!touchPreview) return

    const closeIfOutside = (event) => {
      const activeAnchor = event.target.closest('[data-conversation-preview-anchor]')
      if (
        activeAnchor
        && activeAnchor.getAttribute('data-conversation-preview-anchor') === String(touchPreview.linkId)
      ) {
        return
      }
      setTouchPreview(null)
      setTouchImageReady(false)
    }

    document.addEventListener('pointerdown', closeIfOutside)
    return () => document.removeEventListener('pointerdown', closeIfOutside)
  }, [touchPreview])

  const updateHoverPreview = (event, entry) => {
    if (isMobileLayout) return
    if (!entry.image) {
      setHoverPreview(null)
      return
    }

    setHoverPreview({
      src: entry.image,
      alt: entry.label,
      x: event.clientX + CURSOR_OFFSET,
      y: event.clientY + CURSOR_OFFSET,
    })
  }

  const clearHoverPreview = () => {
    setHoverPreview(null)
  }

  const handlePreviewAnchorPointerDown = (event, link) => {
    if (!isMobileLayout || !link.image) return
    event.stopPropagation()
    if (touchPreview?.linkId === link.id) {
      mobileTapRef.current = 'navigate'
      return
    }
    mobileTapRef.current = 'show-preview'
    const { left, top } = anchorPreviewPosition(event.currentTarget)
    setTouchPreview({
      linkId: link.id,
      src: link.image,
      alt: link.label,
      left,
      top,
    })
  }

  const runLinkNavigation = (event, entry) => {
    if (entry.action === 'none') {
      event.preventDefault()
      return
    }
    if (entry.action === 'external') return
    event.preventDefault()
    if (onOpenContent) onOpenContent(entry.item, entry.pageId)
  }

  const handleLinkClick = (event, entry) => {
    if (isMobileLayout && entry.image) {
      if (mobileTapRef.current === 'show-preview') {
        event.preventDefault()
        mobileTapRef.current = null
        return
      }
      if (mobileTapRef.current === 'navigate') {
        mobileTapRef.current = null
        setTouchPreview(null)
        setTouchImageReady(false)
      }
    }
    runLinkNavigation(event, entry)
  }

  return (
    <section className="conversation-list-page" aria-label="Conversations" onMouseLeave={clearHoverPreview}>
      <h1 className="conversation-list-title anim-fade-up" style={{ '--anim-delay': '120ms' }}>
        Conversations
      </h1>

      <ul className="conversation-list anim-fade-up" style={{ '--anim-delay': '220ms' }}>
        {conversationLinks.map((link) => (
          <li key={link.id} className={link.action === 'none' ? 'is-static' : ''}>
            <a
              href={link.action === 'external' ? link.href : '#'}
              target={link.action === 'external' ? '_blank' : undefined}
              rel={link.action === 'external' ? 'noreferrer' : undefined}
              data-conversation-preview-anchor={link.image ? link.id : undefined}
              onClick={(event) => handleLinkClick(event, link)}
              onPointerDown={(event) => handlePreviewAnchorPointerDown(event, link)}
              onMouseEnter={(event) => updateHoverPreview(event, link)}
              onMouseMove={(event) => updateHoverPreview(event, link)}
              onMouseLeave={clearHoverPreview}
              onFocus={clearHoverPreview}
            >
              {link.label}
              {link.action !== 'none' ? (
                <img className="conversation-list-arrow" src={ARROW_ICON} alt="" />
              ) : null}
            </a>
          </li>
        ))}
      </ul>

      {hoverPreview?.src ? (
        <div
          className="conversation-hover-preview conversation-hover-preview--cursor"
          style={{ left: `${hoverPreview.x}px`, top: `${hoverPreview.y}px` }}
          aria-hidden="true"
        >
          <img src={hoverPreview.src} alt={hoverPreview.alt} />
        </div>
      ) : null}

      {touchPreview?.src && touchImageReady ? (
        <div
          className="conversation-hover-preview conversation-hover-preview--anchor"
          style={{ left: `${touchPreview.left}px`, top: `${touchPreview.top}px` }}
          aria-hidden="true"
        >
          <img src={touchPreview.src} alt={touchPreview.alt} decoding="async" />
        </div>
      ) : null}
    </section>
  )
}

export default ConversationListPage
