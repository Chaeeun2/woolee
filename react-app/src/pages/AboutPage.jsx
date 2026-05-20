import './AboutPage.css'
import { DEFAULT_ABOUT_PAGE_SETTINGS } from '../admin/aboutSettings'

const renderRichText = (text) => (
  String(text || '').split(/(\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>
    }

    return part
  })
)

const getAboutParagraphColumns = (body) => {
  const paragraphs = String(body || '')
    .split(/\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  const splitIndex = paragraphs.length <= 1 ? paragraphs.length : Math.floor(paragraphs.length / 2)

  return [
    paragraphs.slice(0, splitIndex),
    paragraphs.slice(splitIndex),
  ]
}

function AboutPage({ settings = DEFAULT_ABOUT_PAGE_SETTINGS }) {
  const paragraphColumns = getAboutParagraphColumns(settings.body)

  return (
    <section className="about-page" aria-label="About Woo Lee">
      <div className="about-grid">
        {paragraphColumns.map((column, columnIndex) => (
          <div
            className="about-column anim-fade-up"
            key={`about-column-${columnIndex}`}
            style={{ '--anim-delay': columnIndex === 0 ? '180ms' : '300ms' }}
          >
            {column.map((paragraph, paragraphIndex) => (
              <p
                className={columnIndex === 1 && paragraphIndex === column.length - 1 ? 'about-question' : ''}
                key={`about-paragraph-${columnIndex}-${paragraphIndex}`}
              >
                {renderRichText(paragraph)}
              </p>
            ))}
          </div>
        ))}
      </div>

      <footer className="about-footer anim-fade-up" style={{ '--anim-delay': '420ms' }}>
        {settings.footerLinks.map((link) => (
          <a
            className="underline"
            href={link.href}
            key={`${link.label}-${link.href}`}
            target={link.href?.startsWith('http') ? '_blank' : undefined}
            rel={link.href?.startsWith('http') ? 'noreferrer' : undefined}
          >
            {link.label}
          </a>
        ))}
      </footer>
    </section>
  )
}

export default AboutPage
