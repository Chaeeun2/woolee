import './CommonPage.css'
import { DEFAULT_CONVERSATIONS_PAGE_SETTINGS, getConversationContentItems } from '../admin/conversationsPageSettings'

const ARROW_ICON = 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/arrowtop.png'

const renderRichText = (text) => (
  String(text || '').split(/(\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>
    }

    return part
  })
)

const parseIntroBlocks = (body) => (
  String(body || '').split(/\r?\n/).filter(Boolean).map((line) => ({ type: 'paragraph', text: line }))
)

function ConversationPage({ settings = DEFAULT_CONVERSATIONS_PAGE_SETTINGS, onOpenContent, onNavigate }) {
  const conversationLinks = getConversationContentItems(settings).slice(0, 3)
  const introBlocks = parseIntroBlocks(settings.intro.body)

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
          {introBlocks.map((block, index) => (
            <p key={`${block.text}-${index}`}>{renderRichText(block.text)}</p>
          ))}
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
