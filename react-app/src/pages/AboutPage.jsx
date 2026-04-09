import './AboutPage.css'

function AboutPage() {
  return (
    <section className="about-page" aria-label="About Woo Lee">
      <div className="about-grid">
        <div className="about-column anim-fade-up" style={{ '--anim-delay': '180ms' }}>
          <p>
            <em>Woo Lee</em> designs creative paradigms across moments of cultural and
            technological transition.
          </p>
          <p>
            Beginning her career within the legacy magazine system, she closely observed how
            editorial authority once shaped cultural taste, creative standards, and the
            circulation of ideas.
          </p>
          <p>
            As digital media reshaped the cultural landscape and information-driven media began
            losing influence, she founded <em>COM M ON</em>, an editorial platform centered on human
            inspiration - musicians, creative personalities, and collectible cultural artifacts.
          </p>
        </div>

        <div className="about-column anim-fade-up" style={{ '--anim-delay': '300ms' }}>
          <p>
            With the rapid emergence of artificial intelligence in image-making and cultural
            production, she later launched <em>QuintEssence (QE)</em>, a platform exploring how
            creativity evolves in the age of AI.
          </p>
          <p>
            Grounded in humanistic and philosophical inquiry, the project examines questions of
            authorship, value, and cultural judgment in a technological era.
          </p>
          <p>
            Across these projects, <em>Woo Lee&apos;s</em> work asks a central question:
          </p>
          <p className="about-question">
            If <em>CREATION</em> is expanding into <em>CURATION</em>, who defines the standards by
            which culture is selected, framed, and remembered?
          </p>
        </div>
      </div>

      <footer className="about-footer anim-fade-up" style={{ '--anim-delay': '420ms' }}>
        <a class="underline" href="mailto:info@woo-lee.com">info@woo-lee.com</a>
        <a className="underline" href="https://www.instagram.com/woolee_style/" target="_blank" rel="noreferrer">
          Follow on Instagram
        </a>
      </footer>
    </section>
  )
}

export default AboutPage
