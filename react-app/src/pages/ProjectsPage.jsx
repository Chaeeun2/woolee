import './CommonPage.css'
import { DEFAULT_PROJECTS_PAGE_SETTINGS, getProjectsDetailNav } from '../admin/projectsPageSettings'

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

function ProjectsPage({ settings = DEFAULT_PROJECTS_PAGE_SETTINGS, onNavigate }) {
  const projectLinks = getProjectsDetailNav(settings)
  const introBlocks = parseIntroBlocks(settings.intro.body)

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
