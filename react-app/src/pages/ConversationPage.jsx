import './CommonPage.css'
import { CONVERSATION_CONTENT_ITEMS } from '../data/projectData'

const ARROW_ICON = 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/arrowtop.png'
const conversationLinks = CONVERSATION_CONTENT_ITEMS.slice(0, 3)

function ConversationPage({ onOpenContent, onNavigate }) {
  const handleLinkClick = (event, entry) => {
    if (entry.action === 'none') {
      event.preventDefault()
      if (onNavigate) onNavigate('conversation-contents')
      return
    }
    if (entry.action === 'external') return
    event.preventDefault()
    if (onOpenContent) onOpenContent(entry.item, entry.pageId)
  }

  const handleMoreClick = (event) => {
    event.preventDefault()
    if (onNavigate) onNavigate('conversation-contents')
  }

  return (
    <section className="editorial-page" aria-label="Conversations">
      <div className="editorial-mark anim-fade-up" style={{ '--anim-delay': '120ms' }}>
        <h1 className="editorial-mark-title">Conversations</h1>
      </div>

      <div className="editorial-content">
        <div className="editorial-intro anim-fade-up" style={{ '--anim-delay': '220ms' }}>
          <p>
            <em>Conversations</em> bring ideas into the public sphere through lectures, interviews, and dialogue.
          </p>
          <br />
          <p>
            A space where cultural, creative, and technological questions are explored in exchange with audiences,
            institutions, and media.
          </p>
        </div>

        <div className="editorial-editions anim-fade-up" style={{ '--anim-delay': '320ms' }}>
          <h2>CONVERSATIONS</h2>
          <ul>
            {conversationLinks.map((link) => (
              <li key={link.id}>
                <a
                  className="underline"
                  href={link.action === 'external' ? link.href : '#'}
                  target={link.action === 'external' ? '_blank' : undefined}
                  rel={link.action === 'external' ? 'noreferrer' : undefined}
                  onClick={(event) => handleLinkClick(event, link)}
                >
                  {link.label}
                  {link.action !== 'none' ? (
                    <img className="editorial-side-link-icon" src={ARROW_ICON} alt="" />
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
          <p className="editorial-more-link">
            <a className="underline" href="/conversation/contents" onClick={handleMoreClick}>
              More...
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

export default ConversationPage
