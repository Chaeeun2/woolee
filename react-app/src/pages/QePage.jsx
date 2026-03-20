import './CommonPage.css'
import { QE_DETAIL_NAV } from '../data/projectData'

const MAX_EDITIONS = 3
const qeLinks = QE_DETAIL_NAV.slice(0, MAX_EDITIONS)

function QePage({ onNavigate, onOpenEdition }) {
  const handleLinkClick = (event, pageId) => {
    event.preventDefault()
    if (onOpenEdition) {
      onOpenEdition(pageId)
      return
    }
    if (onNavigate) onNavigate(pageId)
  }

  return (
    <section className="editorial-page" aria-label="QE">
      <div className="editorial-mark anim-fade-up" style={{ '--anim-delay': '120ms' }}>
        <img src="https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/qe-logo-2.png" alt="QE" />
        <p className="editorial-side-link">
          <a href="https://qe-mag.com" target="_blank" rel="noreferrer">qe-mag.com</a>
          <img src="https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/arrowtop.png" alt="" className="editorial-side-link-icon" />
        </p>
      </div>

      <div className="editorial-content">
        <div className="editorial-intro anim-fade-up" style={{ '--anim-delay': '220ms' }}>
          <p>
            <em>QE</em> is a fashion and art platform exploring contemporary culture through AI-based modes of creation.
            <br /><br />
            Grounded in humanistic and philosophical inquiry, it approaches technology not as an answer, but as a lens — rethinking authorship, value, and expression.
          </p>
        </div>

        <div className="editorial-editions anim-fade-up" style={{ '--anim-delay': '320ms' }}>
          <h2>EDITIONS</h2>
          <ul>
            {qeLinks.map((link) => (
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
        </div>
      </div>
    </section>
  )
}

export default QePage
