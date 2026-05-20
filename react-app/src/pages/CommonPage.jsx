import './CommonPage.css'
import { DEFAULT_COMMON_PAGE_SETTINGS, getCommonDetailNav } from '../admin/commonPageSettings'

const MAX_EDITIONS = 3

const renderRichText = (text) => (
  String(text || '').split(/(\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>
    }

    return part
  })
)

const parseIntroBlocks = (body) => {
  const blocks = []

  String(body || '').split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim()
    if (!trimmedLine) return

    const listMatch = trimmedLine.match(/^--\s*(.+)$/)
    if (listMatch) {
      const lastBlock = blocks[blocks.length - 1]
      if (lastBlock?.type === 'list') {
        lastBlock.items.push(listMatch[1])
        return
      }

      blocks.push({ type: 'list', items: [listMatch[1]] })
      return
    }

    blocks.push({ type: 'paragraph', text: line })
  })

  return blocks
}

function CommonPage({ settings = DEFAULT_COMMON_PAGE_SETTINGS, onNavigate, onOpenEdition }) {
  const commonLinks = getCommonDetailNav(settings).slice(0, MAX_EDITIONS)
  const introBlocks = parseIntroBlocks(settings.intro.body)

  const handleLinkClick = (event, pageId) => {
    event.preventDefault()
    if (onOpenEdition) {
      onOpenEdition(pageId)
      return
    }
    if (onNavigate) onNavigate(pageId)
  }

  const handleMoreClick = (event) => {
    event.preventDefault()
    if (onNavigate) onNavigate('common-editions')
  }

  return (
    <section className="editorial-page" aria-label="COM M ON">
      <div className="editorial-mark anim-fade-up" style={{ '--anim-delay': '120ms' }}>
        <img src={settings.intro.logoUrl} alt="COM M ON" />
        <p className="editorial-side-link">
          <a href={settings.intro.siteUrl} target="_blank" rel="noreferrer">
            {settings.intro.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
          <img src="https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/arrowtop.png" alt="" className="editorial-side-link-icon" />
        </p>
      </div>

      <div className="editorial-content">
        <div className="editorial-intro anim-fade-up" style={{ '--anim-delay': '220ms' }}>
          {introBlocks.map((block, index) => (
            block.type === 'list' ? (
              <ul className="editorial-points" key={`intro-list-${index}`}>
                {block.items.map((item, itemIndex) => (
                  <li key={`${item}-${itemIndex}`}>{renderRichText(item)}</li>
                ))}
              </ul>
            ) : (
              <p key={`${block.text}-${index}`}>{renderRichText(block.text)}</p>
            )
          ))}
        </div>

        <div className="editorial-editions anim-fade-up" style={{ '--anim-delay': '320ms' }}>
          <h2>ISSUES</h2>
          <ul>
            {commonLinks.map((link) => (
              <li key={link.pageId}>
                <a
                  className="underline"
                  href={link.path}
                  onClick={(event) => handleLinkClick(event, link.pageId)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="editorial-more-link">
            <a className="underline" href="/com-m-on/issues" onClick={handleMoreClick}>
              More...
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

export default CommonPage
