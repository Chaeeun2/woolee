import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/Header'
import AboutPage from './pages/AboutPage'
import CommonPage from './pages/CommonPage'
import QePage from './pages/QePage'
import ProjectsPage from './pages/ProjectsPage'
import ConversationPage from './pages/ConversationPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ContentDetailPage from './pages/ContentDetailPage'
import EditorialContentPage from './pages/EditorialContentPage'
import {
  ALL_DETAIL_ITEMS,
  DETAIL_NAV_BY_SECTION,
  DETAIL_SECTION_BY_PAGE,
  DETAIL_ROUTE_BY_PAGE,
  DETAIL_PAGE_BY_ROUTE,
} from './data/projectData'

const ROUTE_BY_PAGE = {
  home: '/',
  common: '/com-m-on',
  qe: '/qe',
  projects: '/projects',
  'common-editions': '/com-m-on/editions',
  'qe-editions': '/qe/editions',
  conversation: '/conversation',
  about: '/about',
  ...DETAIL_ROUTE_BY_PAGE,
}

const PAGE_BY_ROUTE = {
  '/': 'home',
  '/com-m-on': 'common',
  '/qe': 'qe',
  '/projects': 'projects',
  '/com-m-on/editions': 'common-editions',
  '/qe/editions': 'qe-editions',
  '/conversation': 'conversation',
  '/comversation': 'conversation',
  '/about': 'about',
  ...DETAIL_PAGE_BY_ROUTE,
}

const PROJECT_CONTENT_PATH_PREFIX = '/projects/content/'
const PROJECTS_BRAND_ARROW = 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/arrow.png'
const HOME_CARD_MEDIA = {
  common: {
    video: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-common.mp4',
    poster: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-common-poster.jpg',
  },
  qe: {
    video: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-qe.mp4',
    poster: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-qe-poster.jpg',
  },
  projects: {
    video: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-projects.mp4',
    poster: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-projects-poster.jpg',
  },
  conversation: {
    video: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-conversation.mp4',
    poster: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-conversation-poster.jpg',
  },
}

const SECTION_SIDE_CONFIG = {
  common: {
    sideLogoSrc: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/common-logo-2.png',
    sideLinkLabel: 'common-mag.com',
    sideLinkHref: 'http://common-mag.com/',
  },
  qe: {
    sideLogoSrc: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/qe-logo-2.png',
    sideLinkLabel: 'qe-mag.com',
    sideLinkHref: 'https://www.qe-mag.com/',
  },
}

const SECTION_BRAND_LABELS = {
  common: 'COM M ON',
  qe: 'QE',
  conversation: 'Conversation',
  projects: 'Projects',
}

const getPageFromPath = (pathname) => {
  if (pathname.startsWith(PROJECT_CONTENT_PATH_PREFIX)) return 'project-content'
  return PAGE_BY_ROUTE[pathname] || 'home'
}

const getContentSlugFromPath = (pathname) => {
  if (!pathname.startsWith(PROJECT_CONTENT_PATH_PREFIX)) return null
  return pathname.slice(PROJECT_CONTENT_PATH_PREFIX.length) || null
}

const getStoredContentBySlug = (slug) => {
  if (!slug) return null
  const raw = window.sessionStorage.getItem(`project-content:${slug}`)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const generateRandomSlug = () => {
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `content-${randomPart}`
}

function App() {
  const [activePage, setActivePage] = useState(() => getPageFromPath(window.location.pathname))
  const [activeContent, setActiveContent] = useState(() => {
    const slug = getContentSlugFromPath(window.location.pathname)
    return getStoredContentBySlug(slug)
  })
  const [homeVideoReady, setHomeVideoReady] = useState({
    common: false,
    qe: false,
    projects: false,
    conversation: false,
  })
  const isAboutPage = activePage === 'about'
  const isCommonPage = activePage === 'common'
  const isQePage = activePage === 'qe'
  const isProjectsPage = activePage === 'projects'
  const isConversationPage = activePage === 'conversation'
  const isDetailPage = Object.prototype.hasOwnProperty.call(ALL_DETAIL_ITEMS, activePage)
  const isProjectContentPage = activePage === 'project-content'
  const detailSection = DETAIL_SECTION_BY_PAGE[activePage]
  const contentSourceSection = activeContent?.sourcePageId
    ? DETAIL_SECTION_BY_PAGE[activeContent.sourcePageId]
    : null
  const headerActivePage =
    isDetailPage
      ? detailSection || 'projects'
      : isProjectContentPage
        ? contentSourceSection || 'projects'
        : activePage

  useEffect(() => {
    const handlePopState = () => {
      const nextPage = getPageFromPath(window.location.pathname)
      setActivePage(nextPage)
      if (nextPage === 'project-content') {
        const slug = getContentSlugFromPath(window.location.pathname)
        setActiveContent(getStoredContentBySlug(slug))
      } else {
        setActiveContent(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const handleNavigate = (pageId) => {
    const nextPath = ROUTE_BY_PAGE[pageId] || '/'
    setActivePage(pageId)
    setActiveContent(null)

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
  }

  const handleOpenProjectContent = (item, sourcePageId) => {
    const sourceItems = ALL_DETAIL_ITEMS[sourcePageId]?.items || []
    const slug = generateRandomSlug()
    const images = item.detailImages && item.detailImages.length > 0
      ? item.detailImages
      : [item.image, ...sourceItems.map((sourceItem) => sourceItem.image)]
    const contentData = {
      slug,
      sourcePageId,
      category: item.category || '',
      title: item.label,
      subtitle: item.detailCaption ?? item.caption ?? item.label ?? '',
      images,
      description: `${item.label} 아카이브 콘텐츠`,
    }

    window.sessionStorage.setItem(`project-content:${slug}`, JSON.stringify(contentData))
    setActiveContent(contentData)
    setActivePage('project-content')
    window.history.pushState({}, '', `${PROJECT_CONTENT_PATH_PREFIX}${slug}`)
  }

  const EDITION_BACK_PAGE = { common: 'common-editions', qe: 'qe-editions' }

  /** CommonPage/QePage 에디션 클릭 → ContentDetail로 바로 이동 */
  const handleOpenEditionContent = (pageId) => {
    const detailData = ALL_DETAIL_ITEMS[pageId]
    if (!detailData || !detailData.items || detailData.items.length === 0) return

    const section = DETAIL_SECTION_BY_PAGE[pageId]
    const sourceId = EDITION_BACK_PAGE[section] || pageId

    const firstItem = detailData.items[0]
    const slug = generateRandomSlug()
    const images = firstItem.detailImages && firstItem.detailImages.length > 0
      ? firstItem.detailImages
      : detailData.items.map((i) => i.image)
    const contentData = {
      slug,
      sourcePageId: sourceId,
      title: firstItem.label,
      subtitle: firstItem.detailCaption ?? firstItem.caption ?? firstItem.thumbnailCaption ?? '',
      images,
      description: `${firstItem.label} 아카이브 콘텐츠`,
    }

    window.sessionStorage.setItem(`project-content:${slug}`, JSON.stringify(contentData))
    setActiveContent(contentData)
    setActivePage('project-content')
    window.history.pushState({}, '', `${PROJECT_CONTENT_PATH_PREFIX}${slug}`)
  }

  const handleCardKeyDown = (event, pageId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleNavigate(pageId)
    }
  }

  const markHomeVideoReady = (key) => {
    setHomeVideoReady((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
  }

  return (
    <main className={`main-page ${isDetailPage || isProjectContentPage ? 'bg-white' : ''}`}>
      <Header
        activePage={headerActivePage}
        onNavigate={handleNavigate}
        brandLabel={isProjectContentPage ? (SECTION_BRAND_LABELS[contentSourceSection] || 'Projects') : 'WOO LEE'}
        brandIconSrc={isProjectContentPage ? PROJECTS_BRAND_ARROW : null}
        brandTargetPage={
          isProjectContentPage ? activeContent?.sourcePageId || 'projects' : 'home'
        }
        brandClassName={isProjectContentPage ? 'brand-projects' : ''}
      />

      {isAboutPage ? (
        <AboutPage />
      ) : isCommonPage ? (
        <CommonPage onNavigate={handleNavigate} onOpenEdition={handleOpenEditionContent} />
      ) : isQePage ? (
        <QePage onNavigate={handleNavigate} onOpenEdition={handleOpenEditionContent} />
      ) : isProjectsPage ? (
        <ProjectsPage onNavigate={handleNavigate} />
      ) : isDetailPage ? (
        <ProjectDetailPage
          title={ALL_DETAIL_ITEMS[activePage].title}
          description={ALL_DETAIL_ITEMS[activePage].description}
          items={ALL_DETAIL_ITEMS[activePage].items}
          navItems={DETAIL_NAV_BY_SECTION[detailSection] || []}
          activePageId={activePage}
          onNavigate={handleNavigate}
          onOpenContent={(item) => handleOpenProjectContent(item, activePage)}
          sideMenuMode={SECTION_SIDE_CONFIG[detailSection] ? 'logo-link' : 'list'}
          sideLogoSrc={SECTION_SIDE_CONFIG[detailSection]?.sideLogoSrc || ''}
          sideLinkLabel={SECTION_SIDE_CONFIG[detailSection]?.sideLinkLabel || ''}
          sideLinkHref={SECTION_SIDE_CONFIG[detailSection]?.sideLinkHref || '#'}
          showDescription={!SECTION_SIDE_CONFIG[detailSection]}
        />
      ) : isProjectContentPage && (contentSourceSection === 'common' || contentSourceSection === 'qe') ? (
        <EditorialContentPage content={activeContent} onNavigate={handleNavigate} />
      ) : isProjectContentPage ? (
        <ContentDetailPage content={activeContent} onNavigate={handleNavigate} />
      ) : isConversationPage ? (
        <ConversationPage onNavigate={handleNavigate} />
      ) : (
        <>
          <section className="hero-section" aria-label="Intro">
            <h1 className="anim-fade-down" style={{ '--anim-delay': '200ms' }}>
              <span style={{ fontWeight: 600 }}>WOO</span>{' '}
              <span className="italic" style={{ fontWeight: '400' }}>
                LEE
              </span>
            </h1>
            <p className="anim-fade-down" style={{ '--anim-delay': '300ms' }}>
              Cultural &amp; Creative Director
            </p>
          </section>

          <section className="feature-grid" aria-label="Featured sections">
            <article
              className="feature-card card-common"
              role="button"
              tabIndex={0}
              onClick={() => handleNavigate('common')}
              onKeyDown={(event) => handleCardKeyDown(event, 'common')}
            >
              <img
                className={`card-poster ${homeVideoReady.common ? 'is-hidden' : ''}`}
                src={HOME_CARD_MEDIA.common.poster}
                alt=""
                aria-hidden="true"
                fetchPriority="high"
              />
              <video
                className={`card-video is-empty ${homeVideoReady.common ? 'is-ready' : ''}`}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster={HOME_CARD_MEDIA.common.poster}
                onLoadedData={() => markHomeVideoReady('common')}
              >
                {<source src={HOME_CARD_MEDIA.common.video} type="video/mp4" />}
              </video>
              <div className="card-overlay" />
              <div className="card-content">
                <img
                  className="anim-fade-up"
                  style={{ '--anim-delay': '420ms' }}
                  src="https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/common%20logo.png"
                  alt="COMMON"
                />
                <span className="anim-fade-up" style={{ '--anim-delay': '470ms' }}>
                  magazine
                </span>
              </div>
            </article>

            <article
              className="feature-card card-qe"
              role="button"
              tabIndex={0}
              onClick={() => handleNavigate('qe')}
              onKeyDown={(event) => handleCardKeyDown(event, 'qe')}
            >
              <img
                className={`card-poster ${homeVideoReady.qe ? 'is-hidden' : ''}`}
                src={HOME_CARD_MEDIA.qe.poster}
                alt=""
                aria-hidden="true"
                fetchPriority="high"
              />
              <video
                className={`card-video is-empty ${homeVideoReady.qe ? 'is-ready' : ''}`}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster={HOME_CARD_MEDIA.qe.poster}
                onLoadedData={() => markHomeVideoReady('qe')}
              >
                {<source src={HOME_CARD_MEDIA.qe.video} type="video/mp4" />}
              </video>
              <div className="card-overlay" />
              <div className="card-content">
                <img
                  className="anim-fade-up"
                  style={{ '--anim-delay': '520ms' }}
                  src="https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/qe%20logo.png"
                  alt="QE"
                />
                <span className="anim-fade-up" style={{ '--anim-delay': '570ms' }}>
                  magazine
                </span>
              </div>
            </article>

            <article
              className="feature-card card-projects"
              role="button"
              tabIndex={0}
              onClick={() => handleNavigate('projects')}
              onKeyDown={(event) => handleCardKeyDown(event, 'projects')}
            >
              <img
                className={`card-poster ${homeVideoReady.projects ? 'is-hidden' : ''}`}
                src={HOME_CARD_MEDIA.projects.poster}
                alt=""
                aria-hidden="true"
                fetchPriority="high"
              />
              <video
                className={`card-video is-empty ${homeVideoReady.projects ? 'is-ready' : ''}`}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster={HOME_CARD_MEDIA.projects.poster}
                onLoadedData={() => markHomeVideoReady('projects')}
              >
                {<source src={HOME_CARD_MEDIA.projects.video} type="video/mp4" />}
              </video>
              <div className="card-overlay" />
              <div className="card-content">
                <h2 className="anim-fade-up" style={{ '--anim-delay': '620ms' }}>
                  Projects
                </h2>
              </div>
            </article>

            <article
              className="feature-card card-conversation"
              role="button"
              tabIndex={0}
              onClick={() => handleNavigate('conversation')}
              onKeyDown={(event) => handleCardKeyDown(event, 'conversation')}
            >
              <img
                className={`card-poster ${homeVideoReady.conversation ? 'is-hidden' : ''}`}
                src={HOME_CARD_MEDIA.conversation.poster}
                alt=""
                aria-hidden="true"
                fetchPriority="high"
              />
              <video
                className={`card-video is-empty ${homeVideoReady.conversation ? 'is-ready' : ''}`}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster={HOME_CARD_MEDIA.conversation.poster}
                onLoadedData={() => markHomeVideoReady('conversation')}
              >
                {<source src={HOME_CARD_MEDIA.conversation.video} type="video/mp4" />}
              </video>
              <div className="card-overlay" />
              <div className="card-content">
                <h2 className="anim-fade-up" style={{ '--anim-delay': '670ms' }}>
                  Conversation
                </h2>
              </div>
            </article>
          </section>
        </>
      )}
    </main>
  )
}

export default App
