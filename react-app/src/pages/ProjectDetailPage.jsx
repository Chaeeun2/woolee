import { useEffect, useState } from 'react'
import './ProjectDetailPage.css'

const VIDEO_EXTS = /\.(mp4|webm|mov|ogg)(\?|$)/i
const isVideo = (src) => VIDEO_EXTS.test(src || '')

function ProjectDetailPage({
  title,
  description,
  items,
  navItems,
  activePageId,
  onNavigate,
  onOpenContent,
  sideMenuMode = 'list',
  sideLogoSrc = '',
  sideLinkLabel = '',
  sideLinkHref = '#',
  showDescription = true,
}) {
  const [mediaReady, setMediaReady] = useState({})

  useEffect(() => {
    setMediaReady({})
  }, [items])

  const markMediaReady = (key) => {
    setMediaReady((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
  }

  const handleNavClick = (event, pageId) => {
    event.preventDefault()
    if (onNavigate) onNavigate(pageId)
  }

  const handleContentKeyDown = (event, item) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (onOpenContent) onOpenContent(item)
    }
  }

  return (
    <section className="project-detail-page" aria-label={title}>
      <div className="project-detail-side anim-fade-right" style={{ '--anim-delay': '150ms' }}>
        {sideMenuMode === 'logo-link' ? (
          <div className="project-side-logo-menu">
            {sideLogoSrc ? <img src={sideLogoSrc} alt={title} /> : null}
            {sideLinkLabel ? (
              <p className="project-side-link-row">
                <a href={sideLinkHref} target="_blank" rel="noreferrer">
                  {sideLinkLabel}
                </a>
                <img className="project-side-bullet-icon" src="https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/arrowtop.png" alt="" />
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <h1>Projects</h1>
            <ul>
              {navItems.map((item) => (
                <li key={item.pageId} className={item.pageId === activePageId ? 'is-active' : ''}>
                  <a href={item.path} onClick={(event) => handleNavClick(event, item.pageId)}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="project-detail-feed">
        {items.map((item, index) => (
          (() => {
            const itemKey = `${item.label}-${item.image}`

            return (
              <article
                className="project-feed-item feed-entrance"
                style={{ '--feed-delay': `${180 + index * 70}ms` }}
                key={itemKey}
                role="button"
                tabIndex={0}
                onClick={() => onOpenContent && onOpenContent(item)}
                onKeyDown={(event) => handleContentKeyDown(event, item)}
              >
                <div className="project-feed-media">
                  {isVideo(item.image) ? (
                    <video
                      ref={(node) => {
                        if (node && node.readyState >= 2) markMediaReady(itemKey)
                      }}
                      src={item.image}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onLoadedData={() => markMediaReady(itemKey)}
                      onError={() => markMediaReady(itemKey)}
                    />
                  ) : (
                    <img
                      ref={(node) => {
                        if (node && node.complete) markMediaReady(itemKey)
                      }}
                      src={item.image}
                      alt={item.label}
                      onLoad={() => markMediaReady(itemKey)}
                      onError={() => markMediaReady(itemKey)}
                    />
                  )}
                  <p className={`project-feed-caption ${mediaReady[itemKey] ? 'is-visible' : ''}`.trim()}>
                    {item.label ?? item.thumbnailCaption ?? item.caption ?? ''}
                  </p>
                </div>
              </article>
            )
          })()
        ))}
      </div>

      {showDescription && description ? (
        <section className="project-detail-description anim-fade-right" style={{ '--anim-delay': '300ms' }}>
          <h2>{description.title}</h2>
          <p>{description.content}</p>
        </section>
      ) : null}
    </section>
  )
}

export default ProjectDetailPage
