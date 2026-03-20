import './CommonPage.css'

const projectLinks = [
  { pageId: 'projects-editorial-platforms', label: 'Editorial Platforms', path: '/projects/editorial-platforms' },
  { pageId: 'projects-cultural-programs', label: 'Cultural Programs', path: '/projects/cultural-programs' },
  { pageId: 'projects-visual-direction', label: 'Visual Direction', path: '/projects/visual-direction' },
  { pageId: 'projects-strategic-identity', label: 'Strategic Identity', path: '/projects/strategic-identity' },
]

function ProjectsPage({ onNavigate }) {
  const handleProjectClick = (event, pageId) => {
    event.preventDefault()
    if (onNavigate) onNavigate(pageId)
  }

  return (
    <section className="editorial-page" aria-label="Projects">
      <div className="editorial-mark anim-fade-up" style={{ '--anim-delay': '120ms' }}>
        <h1 className="editorial-mark-title">Projects</h1>
      </div>

      <div className="editorial-content">
        <div className="editorial-intro anim-fade-up" style={{ '--anim-delay': '220ms' }}>
          <p>
            <em>Projects</em> are structured through vision, alignment, and execution.
          </p>
          <ul className="editorial-points">
            <li>Define and structure creative and cultural direction</li>
            <li>Design execution architecture</li>
            <li>Assemble and lead specialised teams</li>
            <li>Take full responsibility for outcomes</li>
          </ul>
          <p>
            Rooted in <em>musicians</em> and <em>fashion</em> as cultural language.
          </p>
        </div>

        <div className="editorial-editions anim-fade-up" style={{ '--anim-delay': '320ms' }}>
          <h2>PROJECTS</h2>
          <ul>
            {projectLinks.map((project) => (
              <li key={project.pageId}>
                <a
                  className="underline"
                  href={project.path}
                  onClick={(event) => handleProjectClick(event, project.pageId)}
                >
                  {project.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default ProjectsPage
