import { useState } from 'react'
import './ConversationPage.css'
import { CONVERSATION_CONTENT_ITEMS } from '../data/projectData'

const ARROW_ICON = 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/arrowtop.png'
const conversationLinks = CONVERSATION_CONTENT_ITEMS
const CURSOR_OFFSET = 18

function ConversationListPage({ onOpenContent }) {
  const [hoverPreview, setHoverPreview] = useState(null)

  const updateHoverPreview = (event, entry) => {
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

  const handleLinkClick = (event, entry) => {
    if (entry.action === 'none') {
      event.preventDefault()
      return
    }
    if (entry.action === 'external') return
    event.preventDefault()
    if (onOpenContent) onOpenContent(entry.item, entry.pageId)
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
              onClick={(event) => handleLinkClick(event, link)}
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
          className="conversation-hover-preview"
          style={{ left: `${hoverPreview.x}px`, top: `${hoverPreview.y}px` }}
          aria-hidden="true"
        >
          <img src={hoverPreview.src} alt={hoverPreview.alt} />
        </div>
      ) : null}
    </section>
  )
}

export default ConversationListPage
