import './CommonPage.css'

function ConversationPage({ onNavigate }) {
  const handleLinkClick = (event) => {
    event.preventDefault()
    if (onNavigate) onNavigate('conversation-sample')
  }

  return (
    <section className="editorial-page" aria-label="Conversation">
      <div className="editorial-mark anim-fade-up" style={{ '--anim-delay': '120ms' }}>
        <h1 className="editorial-mark-title">Conversation</h1>
      </div>

      <div className="editorial-content">
        <div className="editorial-intro anim-fade-up" style={{ '--anim-delay': '220ms' }}>
          <p>
            <em>Conversation</em> bring ideas into the public sphere — through lectures, interviews, and dialogue.
          </p>
          <br/><p>
            A space where cultural, creative, and technological questions are explored in exchange with audiences, institutions, and media.
          </p>
          <br/>
          <ul className="editorial-points">
            <li>Lectures and keynote talks</li>
            <li>Interviews and editorial conversations</li>
            <li>Public discussions and panels</li>
            <li>Articles and cultural commentary</li>
          </ul>
        </div>

        <div className="editorial-editions anim-fade-up" style={{ '--anim-delay': '320ms' }}>
          <h2>CONVERSATIONS</h2>
          <ul>
            <li>
              <a className="underline" href="/conversation/sample" onClick={handleLinkClick}>
                sample
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default ConversationPage
