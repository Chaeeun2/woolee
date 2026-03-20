import './CommonPage.css'
import { COMMON_DETAIL_NAV } from '../data/projectData'

const MAX_EDITIONS = 3
const commonLinks = COMMON_DETAIL_NAV.slice(0, MAX_EDITIONS)

function CommonPage({ onNavigate, onOpenEdition }) {
  const handleLinkClick = (event, pageId) => {
    event.preventDefault()
    if (onOpenEdition) {
      onOpenEdition(pageId)
      return
    }
    if (onNavigate) onNavigate(pageId)
  }

  return (
    <section className="editorial-page" aria-label="COM M ON">
      <div className="editorial-mark anim-fade-up" style={{ '--anim-delay': '120ms' }}>
        <img src="https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/common-logo-2.png" alt="COM M ON" />
        <p className="editorial-side-link">
          <a href="http://common-mag.com" target="_blank" rel="noreferrer">common-mag.com</a>
          <img src="https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/arrowtop.png" alt="" className="editorial-side-link-icon" />
        </p>
      </div>

      <div className="editorial-content">
        <div className="editorial-intro anim-fade-up" style={{ '--anim-delay': '220ms' }}>
          <p>
            <em>COM M ON</em> is an editorial platform shaped by:
          </p>
          <ul className="editorial-points">
            <li>Contemporary Vision</li>
            <li>Conceptual Imagination</li>
            <li>Courageous Provocation</li>
          </ul>
          <p>
            <br/>Rooted in <em>musicians</em> and <em>fashion</em> as cultural language.
          </p>
        </div>

        <div className="editorial-editions anim-fade-up" style={{ '--anim-delay': '320ms' }}>
          <h2>EDITIONS</h2>
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
        </div>
      </div>
    </section>
  )
}

export default CommonPage
