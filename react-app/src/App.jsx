import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import Header from './components/Header'
import AboutPage from './pages/AboutPage'
import CommonPage from './pages/CommonPage'
import QePage from './pages/QePage'
import ProjectsPage from './pages/ProjectsPage'
import ConversationPage from './pages/ConversationPage'
import ConversationListPage from './pages/ConversationListPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ContentDetailPage from './pages/ContentDetailPage'
import EditorialContentPage from './pages/EditorialContentPage'
import MobileCheck from './admin/components/MobileCheck'
import { AuthProvider } from './admin/contexts/AuthContext'
import { MobileProvider } from './admin/contexts/MobileProvider'
import { useAuth } from './admin/contexts/useAuth'
import { useMobile } from './admin/contexts/useMobile'
import Login from './admin/pages/Login'
import AboutManager from './admin/pages/AboutManager'
import CommonManager from './admin/pages/CommonManager'
import QeManager from './admin/pages/QeManager'
import ProjectsManager from './admin/pages/ProjectsManager'
import ConversationsManager from './admin/pages/ConversationsManager'
import MainPageManager from './admin/pages/MainPageManager'
import { DEFAULT_ABOUT_PAGE_SETTINGS } from './admin/aboutSettings'
import {
  DEFAULT_COMMON_PAGE_SETTINGS,
  getCommonDetailItems,
  getCommonDetailNav,
} from './admin/commonPageSettings'
import {
  DEFAULT_QE_PAGE_SETTINGS,
  getQeDetailItems,
  getQeDetailNav,
} from './admin/qePageSettings'
import {
  DEFAULT_PROJECTS_PAGE_SETTINGS,
  getProjectsDetailItems,
  getProjectsDetailNav,
  getProjectsSideSubcategories,
} from './admin/projectsPageSettings'
import {
  DEFAULT_CONVERSATIONS_PAGE_SETTINGS,
  getConversationDetailItems,
} from './admin/conversationsPageSettings'
import { DEFAULT_MAIN_PAGE_SETTINGS } from './admin/mainPageSettings'
import { getAboutPageSettings } from './services/aboutPageService'
import { getCommonPageSettings } from './services/commonPageService'
import { getMainPageSettings } from './services/mainPageService'
import { getQePageSettings } from './services/qePageService'
import { getProjectsPageSettings } from './services/projectsPageService'
import { getConversationsPageSettings } from './services/conversationsPageService'

const EMPTY_DETAIL_ITEMS = {}
const EMPTY_DETAIL_NAV_BY_SECTION = {}
const EMPTY_DETAIL_SECTION_BY_PAGE = {}
const EMPTY_DETAIL_ROUTE_BY_PAGE = {}
const EMPTY_DETAIL_PAGE_BY_ROUTE = {}
const EMPTY_PROJECT_SIDE_SUBCATEGORIES = {}

const ROUTE_BY_PAGE = {
  home: '/',
  common: '/com-m-on',
  qe: '/qe',
  projects: '/projects',
  'common-editions': '/com-m-on/issues',
  'qe-editions': '/qe/editions',
  conversation: '/conversation',
  'conversation-contents': '/conversation/contents',
  about: '/about',
  ...EMPTY_DETAIL_ROUTE_BY_PAGE,
}

const PAGE_BY_ROUTE = {
  '/': 'home',
  '/com-m-on': 'common',
  '/qe': 'qe',
  '/projects': 'projects',
  '/com-m-on/issues': 'common-editions',
  '/qe/editions': 'qe-editions',
  '/conversation': 'conversation',
  '/conversation/contents': 'conversation-contents',
  '/comversation': 'conversation',
  '/about': 'about',
  ...EMPTY_DETAIL_PAGE_BY_ROUTE,
}

const PROJECT_CONTENT_PATH_PREFIX = '/projects/content/'
const PROJECTS_BRAND_ARROW = 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/arrow.png'
const ADMIN_DEFAULT_PATH = '/admin/main'

const normalizeAdminPath = (pathname) => (
  pathname === '/admin' || pathname === '/admin/mainpage' ? ADMIN_DEFAULT_PATH : pathname
)

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
  conversation: 'Conversations',
  projects: 'Projects',
}

const EDITION_SOURCE_BY_SECTION = {
  common: 'common-editions',
  qe: 'qe-editions',
}

const slugify = (value) => (
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
)

const getCanonicalContentSourcePageId = (pageId, sectionByPage = EMPTY_DETAIL_SECTION_BY_PAGE) => {
  const section = sectionByPage[pageId]
  return EDITION_SOURCE_BY_SECTION[section] || pageId
}

const getProjectSubcategoryPath = (pageId, subcategorySlug, routeByPage = EMPTY_DETAIL_ROUTE_BY_PAGE) => {
  const basePath = routeByPage[pageId] || ROUTE_BY_PAGE[pageId] || '/'
  return `${basePath}/${subcategorySlug}`
}

const getProjectSubcategoryMatch = (
  pathname,
  subcategoriesByPage = EMPTY_PROJECT_SIDE_SUBCATEGORIES,
  routeByPage = EMPTY_DETAIL_ROUTE_BY_PAGE,
) => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'

  for (const [pageId, subcategories] of Object.entries(subcategoriesByPage)) {
    const basePath = routeByPage[pageId]
    if (!basePath || !subcategories.length) continue

    if (normalizedPath === basePath) {
      return {
        pageId,
        subcategorySlug: subcategories[0]?.slug || null,
      }
    }

    if (normalizedPath.startsWith(`${basePath}/`)) {
      const subcategorySlug = normalizedPath.slice(basePath.length + 1)
      const matchedSubcategory = subcategories.find((subcategory) => subcategory.slug === subcategorySlug)

      return {
        pageId,
        subcategorySlug: matchedSubcategory?.slug || subcategories[0]?.slug || null,
      }
    }
  }

  return null
}

const buildContentIndex = (detailItems = EMPTY_DETAIL_ITEMS) => {
  const bySlug = new Map()
  const slugByItem = new WeakMap()

  Object.keys(detailItems).forEach((pageId) => {
    const detail = detailItems[pageId]
    const items = detail?.items || []

    items.forEach((item, index) => {
      const baseSlug = slugify(item.contentId || item.label || `item-${index + 1}`) || `item-${index + 1}`
      let slug = baseSlug

      if (bySlug.has(slug)) {
        slug = `${baseSlug}-${slugify(pageId)}-${index + 1}`
      }

      bySlug.set(slug, {
        pageId,
        item,
        slug,
      })
      slugByItem.set(item, slug)
    })
  })

  return { bySlug, slugByItem }
}

const CONTENT_INDEX = buildContentIndex()

const buildContentData = (
  item,
  sourcePageId,
  slug,
  sourcePath = null,
  detailItems = EMPTY_DETAIL_ITEMS,
  sectionByPage = EMPTY_DETAIL_SECTION_BY_PAGE,
) => {
  const sourceItems = detailItems[sourcePageId]?.items || []
  const images = item.detailImages && item.detailImages.length > 0
    ? item.detailImages
    : [item.image, ...sourceItems.map((sourceItem) => sourceItem.image)]

  return {
    slug,
    sourcePageId: getCanonicalContentSourcePageId(sourcePageId, sectionByPage),
    sourcePath,
    category: item.category || '',
    title: item.label,
    subtitle: item.detailCaption ?? item.caption ?? item.label ?? '',
    images,
    description: `${item.label} 아카이브 콘텐츠`,
  }
}

const getPageFromPath = (
  pathname,
  detailPageByRoute = EMPTY_DETAIL_PAGE_BY_ROUTE,
  subcategoriesByPage = EMPTY_PROJECT_SIDE_SUBCATEGORIES,
  routeByPage = EMPTY_DETAIL_ROUTE_BY_PAGE,
) => {
  if (pathname.startsWith(PROJECT_CONTENT_PATH_PREFIX)) return 'project-content'
  const projectSubcategoryMatch = getProjectSubcategoryMatch(pathname, subcategoriesByPage, routeByPage)
  if (projectSubcategoryMatch) return projectSubcategoryMatch.pageId
  return PAGE_BY_ROUTE[pathname] || detailPageByRoute[pathname] || 'home'
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

const getContentBySlug = (slug) => {
  if (!slug) return null
  const normalizedSlug = slug.startsWith('content-') ? slug.slice('content-'.length) : slug
  const stored = getStoredContentBySlug(slug) || getStoredContentBySlug(normalizedSlug)
  if (stored) return stored

  const entry = CONTENT_INDEX.bySlug.get(normalizedSlug)
  if (!entry) return null

  return buildContentData(entry.item, entry.pageId, entry.slug)
}

function AdminRoutes() {
  const { user, loading } = useAuth()
  const { isMobile } = useMobile()
  const [adminPath, setAdminPath] = useState(() => normalizeAdminPath(window.location.pathname))

  useEffect(() => {
    const normalizedPath = normalizeAdminPath(window.location.pathname)
    if (window.location.pathname !== normalizedPath) {
      window.history.replaceState({}, '', normalizedPath)
    }

    const handlePopState = () => {
      setAdminPath(normalizeAdminPath(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const navigateAdmin = useCallback((pathname, replace = false) => {
    if (window.location.pathname !== pathname) {
      const method = replace ? 'replaceState' : 'pushState'
      window.history[method]({}, '', pathname)
    }
    setAdminPath(pathname)
  }, [])

  if (isMobile) {
    return <MobileCheck />
  }

  if (loading) {
    return (
      <div className="admin-auth-loading">
        Firebase 인증 확인 중...
      </div>
    )
  }

  if (adminPath === '/admin/login') {
    if (user?.isAdmin) return <MainPageManager onNavigateAdmin={navigateAdmin} />

    return <Login onLoggedIn={() => navigateAdmin(ADMIN_DEFAULT_PATH, true)} />
  }

  if (!user?.isAdmin) {
    return <Login onLoggedIn={() => navigateAdmin(adminPath, true)} />
  }

  if (adminPath === '/admin/about') {
    return <AboutManager onNavigateAdmin={navigateAdmin} />
  }

  if (adminPath === '/admin/common') {
    return <CommonManager onNavigateAdmin={navigateAdmin} />
  }

  if (adminPath === '/admin/qe') {
    return <QeManager onNavigateAdmin={navigateAdmin} />
  }

  if (adminPath === '/admin/projects') {
    return <ProjectsManager onNavigateAdmin={navigateAdmin} />
  }

  if (adminPath === '/admin/conversations') {
    return <ConversationsManager onNavigateAdmin={navigateAdmin} />
  }

  return <MainPageManager onNavigateAdmin={navigateAdmin} />
}

function App() {
  const isAdminPage = window.location.pathname.startsWith('/admin')
  const [activePage, setActivePage] = useState(() => getPageFromPath(window.location.pathname))
  const [activeDetailSubcategorySlug, setActiveDetailSubcategorySlug] = useState(() => (
    getProjectSubcategoryMatch(window.location.pathname)?.subcategorySlug || null
  ))
  const [activeContent, setActiveContent] = useState(() => {
    const slug = getContentSlugFromPath(window.location.pathname)
    return getContentBySlug(slug)
  })
  const [homeVideoReady, setHomeVideoReady] = useState({
    common: false,
    qe: false,
    projects: false,
    conversation: false,
  })
  const [mainPageSettings, setMainPageSettings] = useState(DEFAULT_MAIN_PAGE_SETTINGS)
  const [aboutPageSettings, setAboutPageSettings] = useState(DEFAULT_ABOUT_PAGE_SETTINGS)
  const [commonPageSettings, setCommonPageSettings] = useState(DEFAULT_COMMON_PAGE_SETTINGS)
  const [qePageSettings, setQePageSettings] = useState(DEFAULT_QE_PAGE_SETTINGS)
  const [projectsPageSettings, setProjectsPageSettings] = useState(DEFAULT_PROJECTS_PAGE_SETTINGS)
  const [conversationsPageSettings, setConversationsPageSettings] = useState(DEFAULT_CONVERSATIONS_PAGE_SETTINGS)
  const commonDetailNav = useMemo(() => getCommonDetailNav(commonPageSettings), [commonPageSettings])
  const commonDetailItems = useMemo(() => getCommonDetailItems(commonPageSettings), [commonPageSettings])
  const qeDetailNav = useMemo(() => getQeDetailNav(qePageSettings), [qePageSettings])
  const qeDetailItems = useMemo(() => getQeDetailItems(qePageSettings), [qePageSettings])
  const projectsDetailNav = useMemo(() => getProjectsDetailNav(projectsPageSettings), [projectsPageSettings])
  const projectsDetailItems = useMemo(() => getProjectsDetailItems(projectsPageSettings), [projectsPageSettings])
  const projectsSideSubcategories = useMemo(() => getProjectsSideSubcategories(projectsPageSettings), [projectsPageSettings])
  const conversationDetailItems = useMemo(() => getConversationDetailItems(conversationsPageSettings), [conversationsPageSettings])
  const effectiveDetailItems = useMemo(() => ({
    ...EMPTY_DETAIL_ITEMS,
    ...projectsDetailItems,
    ...commonDetailItems,
    ...qeDetailItems,
    ...conversationDetailItems,
    'common-editions': {
      title: 'COM M ON',
      description: null,
      items: Object.values(commonDetailItems).flatMap((detail) => detail.items),
    },
    'qe-editions': {
      title: 'QE',
      description: null,
      items: Object.values(qeDetailItems).flatMap((detail) => detail.items),
    },
  }), [commonDetailItems, conversationDetailItems, projectsDetailItems, qeDetailItems])
  const effectiveContentIndex = useMemo(() => buildContentIndex(effectiveDetailItems), [effectiveDetailItems])
  const effectiveDetailNavBySection = useMemo(() => ({
    ...EMPTY_DETAIL_NAV_BY_SECTION,
    projects: projectsDetailNav,
    common: commonDetailNav,
    qe: qeDetailNav,
  }), [commonDetailNav, projectsDetailNav, qeDetailNav])
  const effectiveDetailRouteByPage = useMemo(() => ({
    ...EMPTY_DETAIL_ROUTE_BY_PAGE,
    ...Object.fromEntries(projectsDetailNav.map((item) => [item.pageId, item.path])),
    ...Object.fromEntries(commonDetailNav.map((item) => [item.pageId, item.path])),
    ...Object.fromEntries(qeDetailNav.map((item) => [item.pageId, item.path])),
  }), [commonDetailNav, projectsDetailNav, qeDetailNav])
  const effectiveDetailPageByRoute = useMemo(() => (
    Object.fromEntries(Object.entries(effectiveDetailRouteByPage).map(([pageId, path]) => [path, pageId]))
  ), [effectiveDetailRouteByPage])
  const effectiveDetailSectionByPage = useMemo(() => ({
    ...EMPTY_DETAIL_SECTION_BY_PAGE,
    ...Object.fromEntries(projectsDetailNav.map((item) => [item.pageId, 'projects'])),
    ...Object.fromEntries(commonDetailNav.map((item) => [item.pageId, 'common'])),
    ...Object.fromEntries(qeDetailNav.map((item) => [item.pageId, 'qe'])),
    'common-editions': 'common',
    'qe-editions': 'qe',
  }), [commonDetailNav, projectsDetailNav, qeDetailNav])
  const effectiveSectionSideConfig = useMemo(() => ({
    ...SECTION_SIDE_CONFIG,
    common: {
      sideLogoSrc: commonPageSettings.intro.logoUrl,
      sideLinkLabel: commonPageSettings.intro.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      sideLinkHref: commonPageSettings.intro.siteUrl,
    },
    qe: {
      sideLogoSrc: qePageSettings.intro.logoUrl,
      sideLinkLabel: qePageSettings.intro.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      sideLinkHref: qePageSettings.intro.siteUrl,
    },
  }), [commonPageSettings, qePageSettings])
  const isAboutPage = activePage === 'about'
  const isCommonPage = activePage === 'common'
  const isQePage = activePage === 'qe'
  const isProjectsPage = activePage === 'projects'
  const isConversationPage = activePage === 'conversation'
  const isConversationListPage = activePage === 'conversation-contents'
  const isDetailPage = Object.prototype.hasOwnProperty.call(effectiveDetailItems, activePage)
  const isProjectContentPage = activePage === 'project-content'
  const detailSection = effectiveDetailSectionByPage[activePage]
  const contentSourceSection = activeContent?.sourcePageId
    ? effectiveDetailSectionByPage[activeContent.sourcePageId]
    : null
  const headerActivePage =
    isDetailPage
      ? detailSection || 'projects'
      : isProjectContentPage
        ? contentSourceSection || 'projects'
        : isConversationListPage
          ? 'conversation'
        : activePage

  useEffect(() => {
    const handlePopState = () => {
      const nextPage = getPageFromPath(
        window.location.pathname,
        effectiveDetailPageByRoute,
        projectsSideSubcategories,
        effectiveDetailRouteByPage,
      )
      const nextSubcategorySlug = getProjectSubcategoryMatch(
        window.location.pathname,
        projectsSideSubcategories,
        effectiveDetailRouteByPage,
      )?.subcategorySlug || null
      setActivePage(nextPage)
      setActiveDetailSubcategorySlug(nextSubcategorySlug)
      if (nextPage === 'project-content') {
        const slug = getContentSlugFromPath(window.location.pathname)
        setActiveContent(getContentBySlug(slug))
      } else {
        setActiveContent(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [effectiveDetailPageByRoute, effectiveDetailRouteByPage, projectsSideSubcategories])

  useEffect(() => {
    let mounted = true

    const syncMainPageSettings = async () => {
      try {
        const nextSettings = await getMainPageSettings()
        if (mounted) setMainPageSettings(nextSettings)
      } catch (error) {
        console.error('메인페이지 설정 불러오기 실패:', error)
      }
    }

    syncMainPageSettings()
    window.addEventListener('storage', syncMainPageSettings)
    window.addEventListener('mainPageSettingsUpdated', syncMainPageSettings)
    return () => {
      mounted = false
      window.removeEventListener('storage', syncMainPageSettings)
      window.removeEventListener('mainPageSettingsUpdated', syncMainPageSettings)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const syncProjectsPageSettings = async () => {
      try {
        const nextSettings = await getProjectsPageSettings()
        if (mounted) setProjectsPageSettings(nextSettings)
      } catch (error) {
        console.error('Projects 설정 불러오기 실패:', error)
      }
    }

    syncProjectsPageSettings()
    window.addEventListener('projectsPageSettingsUpdated', syncProjectsPageSettings)
    return () => {
      mounted = false
      window.removeEventListener('projectsPageSettingsUpdated', syncProjectsPageSettings)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const syncConversationsPageSettings = async () => {
      try {
        const nextSettings = await getConversationsPageSettings()
        if (mounted) setConversationsPageSettings(nextSettings)
      } catch (error) {
        console.error('Conversations 설정 불러오기 실패:', error)
      }
    }

    syncConversationsPageSettings()
    window.addEventListener('conversationsPageSettingsUpdated', syncConversationsPageSettings)
    return () => {
      mounted = false
      window.removeEventListener('conversationsPageSettingsUpdated', syncConversationsPageSettings)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const syncCommonPageSettings = async () => {
      try {
        const nextSettings = await getCommonPageSettings()
        if (mounted) setCommonPageSettings(nextSettings)
      } catch (error) {
        console.error('COM M ON 설정 불러오기 실패:', error)
      }
    }

    syncCommonPageSettings()
    window.addEventListener('commonPageSettingsUpdated', syncCommonPageSettings)
    return () => {
      mounted = false
      window.removeEventListener('commonPageSettingsUpdated', syncCommonPageSettings)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const syncQePageSettings = async () => {
      try {
        const nextSettings = await getQePageSettings()
        if (mounted) setQePageSettings(nextSettings)
      } catch (error) {
        console.error('QE 설정 불러오기 실패:', error)
      }
    }

    syncQePageSettings()
    window.addEventListener('qePageSettingsUpdated', syncQePageSettings)
    return () => {
      mounted = false
      window.removeEventListener('qePageSettingsUpdated', syncQePageSettings)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const syncAboutPageSettings = async () => {
      try {
        const nextSettings = await getAboutPageSettings()
        if (mounted) setAboutPageSettings(nextSettings)
      } catch (error) {
        console.error('About 페이지 설정 불러오기 실패:', error)
      }
    }

    syncAboutPageSettings()
    window.addEventListener('aboutPageSettingsUpdated', syncAboutPageSettings)
    return () => {
      mounted = false
      window.removeEventListener('aboutPageSettingsUpdated', syncAboutPageSettings)
    }
  }, [])

  useEffect(() => {
    const nextPage = getPageFromPath(
      window.location.pathname,
      effectiveDetailPageByRoute,
      projectsSideSubcategories,
      effectiveDetailRouteByPage,
    )
    const nextSubcategorySlug = getProjectSubcategoryMatch(
      window.location.pathname,
      projectsSideSubcategories,
      effectiveDetailRouteByPage,
    )?.subcategorySlug || null

    if (nextPage !== activePage || nextSubcategorySlug !== activeDetailSubcategorySlug) {
      queueMicrotask(() => {
        if (nextPage !== activePage) setActivePage(nextPage)
        if (nextSubcategorySlug !== activeDetailSubcategorySlug) setActiveDetailSubcategorySlug(nextSubcategorySlug)
      })
    }
  }, [
    activeDetailSubcategorySlug,
    activePage,
    effectiveDetailPageByRoute,
    effectiveDetailRouteByPage,
    projectsSideSubcategories,
  ])

  useEffect(() => {
    if (!isDetailPage) {
      if (activeDetailSubcategorySlug !== null) {
        queueMicrotask(() => setActiveDetailSubcategorySlug(null))
      }
      return
    }

    const subcategories = projectsSideSubcategories[activePage] || []
    if (!subcategories.length) {
      if (activeDetailSubcategorySlug !== null) {
        queueMicrotask(() => setActiveDetailSubcategorySlug(null))
      }
      return
    }

    const hasValidSubcategory = subcategories.some((subcategory) => subcategory.slug === activeDetailSubcategorySlug)
    const fallbackSlug = subcategories[0]?.slug || null

    if (!hasValidSubcategory && fallbackSlug) {
      queueMicrotask(() => setActiveDetailSubcategorySlug(fallbackSlug))
      const nextPath = getProjectSubcategoryPath(activePage, fallbackSlug, effectiveDetailRouteByPage)
      if (window.location.pathname !== nextPath) {
        window.history.replaceState({}, '', nextPath)
      }
    }
  }, [activePage, activeDetailSubcategorySlug, effectiveDetailRouteByPage, isDetailPage, projectsSideSubcategories])

  const handleNavigate = (pageId) => {
    const subcategories = projectsSideSubcategories[pageId] || []
    const nextSubcategorySlug = subcategories[0]?.slug || null
    const nextPath = nextSubcategorySlug
      ? getProjectSubcategoryPath(pageId, nextSubcategorySlug, effectiveDetailRouteByPage)
      : effectiveDetailRouteByPage[pageId] || ROUTE_BY_PAGE[pageId] || '/'
    setActivePage(pageId)
    setActiveDetailSubcategorySlug(nextSubcategorySlug)
    setActiveContent(null)

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
  }

  const handleNavigatePath = (pathname, fallbackPageId = 'home') => {
    const nextPage = getPageFromPath(pathname, effectiveDetailPageByRoute, projectsSideSubcategories, effectiveDetailRouteByPage)
    const nextSubcategorySlug = getProjectSubcategoryMatch(pathname, projectsSideSubcategories, effectiveDetailRouteByPage)?.subcategorySlug || null

    setActivePage(nextPage || fallbackPageId)
    setActiveDetailSubcategorySlug(nextSubcategorySlug)
    setActiveContent(null)

    if (window.location.pathname !== pathname) {
      window.history.pushState({}, '', pathname)
    }
  }

  const handleNavigateProjectSubcategory = (pageId, subcategorySlug) => {
    const subcategories = projectsSideSubcategories[pageId] || []
    const matchedSubcategory = subcategories.find((subcategory) => subcategory.slug === subcategorySlug)
    const nextSubcategorySlug = matchedSubcategory?.slug || subcategories[0]?.slug || null
    const nextPath = nextSubcategorySlug
      ? getProjectSubcategoryPath(pageId, nextSubcategorySlug, effectiveDetailRouteByPage)
      : effectiveDetailRouteByPage[pageId] || ROUTE_BY_PAGE[pageId] || '/'

    setActivePage(pageId)
    setActiveDetailSubcategorySlug(nextSubcategorySlug)
    setActiveContent(null)

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
  }

  const handleOpenProjectContent = (item, sourcePageId) => {
    const slug = effectiveContentIndex.slugByItem.get(item) || slugify(item.label)
    const sourcePath = activeDetailSubcategorySlug
      ? getProjectSubcategoryPath(sourcePageId, activeDetailSubcategorySlug, effectiveDetailRouteByPage)
      : (effectiveDetailRouteByPage[sourcePageId] || ROUTE_BY_PAGE[sourcePageId] || null)
    const contentData = buildContentData(item, sourcePageId, slug, sourcePath, effectiveDetailItems, effectiveDetailSectionByPage)

    window.sessionStorage.setItem(`project-content:${slug}`, JSON.stringify(contentData))
    setActiveContent(contentData)
    setActivePage('project-content')
    window.history.pushState({}, '', `${PROJECT_CONTENT_PATH_PREFIX}${slug}`)
  }

  const handleOpenConversationContent = (item, sourcePageId) => {
    const slug = effectiveContentIndex.slugByItem.get(item) || slugify(item.label)
    const contentData = buildContentData(item, sourcePageId, slug, ROUTE_BY_PAGE['conversation-contents'], effectiveDetailItems, effectiveDetailSectionByPage)

    window.sessionStorage.setItem(`project-content:${slug}`, JSON.stringify(contentData))
    setActiveContent(contentData)
    setActivePage('project-content')
    window.history.pushState({}, '', `${PROJECT_CONTENT_PATH_PREFIX}${slug}`)
  }

  /** Common/QE/Conversation 목록 클릭 → ContentDetail로 바로 이동 */
  const handleOpenEditionContent = (pageId) => {
    const detailData = effectiveDetailItems[pageId]
    if (!detailData || !detailData.items || detailData.items.length === 0) return false

    const firstItem = detailData.items[0]
    const slug = effectiveContentIndex.slugByItem.get(firstItem) || slugify(firstItem.label)
    const contentData = buildContentData(firstItem, pageId, slug, null, effectiveDetailItems, effectiveDetailSectionByPage)

    window.sessionStorage.setItem(`project-content:${slug}`, JSON.stringify(contentData))
    setActiveContent(contentData)
    setActivePage('project-content')
    window.history.pushState({}, '', `${PROJECT_CONTENT_PATH_PREFIX}${slug}`)
    return true
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

  const homeCards = mainPageSettings.cards

  if (isAdminPage) {
    return (
      <MobileProvider>
        <AuthProvider>
          <AdminRoutes />
        </AuthProvider>
      </MobileProvider>
    )
  }

  return (
    <main className={`main-page ${isDetailPage || isProjectContentPage ? 'bg-white' : ''}`}>
      <Header
        activePage={headerActivePage}
        onNavigate={handleNavigate}
        onNavigatePath={handleNavigatePath}
        brandLabel={isProjectContentPage ? (SECTION_BRAND_LABELS[contentSourceSection] || 'Projects') : 'WOO LEE'}
        brandIconSrc={isProjectContentPage ? PROJECTS_BRAND_ARROW : null}
        brandTargetPage={
          isProjectContentPage ? activeContent?.sourcePageId || 'projects' : 'home'
        }
        brandTargetPath={isProjectContentPage ? activeContent?.sourcePath || null : null}
        brandClassName={isProjectContentPage ? 'brand-projects' : ''}
        instagramUrl={aboutPageSettings.footerLinks?.[1]?.href || ''}
      />

      {isAboutPage ? (
        <AboutPage settings={aboutPageSettings} />
      ) : isCommonPage ? (
        <CommonPage settings={commonPageSettings} onNavigate={handleNavigate} onOpenEdition={handleOpenEditionContent} />
      ) : isQePage ? (
        <QePage settings={qePageSettings} onNavigate={handleNavigate} onOpenEdition={handleOpenEditionContent} />
      ) : isProjectsPage ? (
        <ProjectsPage settings={projectsPageSettings} onNavigate={handleNavigate} />
      ) : isDetailPage ? (
        <ProjectDetailPage
          title={effectiveDetailItems[activePage].title}
          description={effectiveDetailItems[activePage].description}
          items={effectiveDetailItems[activePage].items}
          navItems={effectiveDetailNavBySection[detailSection] || []}
          sideSubcategories={projectsSideSubcategories[activePage] || []}
          activeSubcategorySlug={activeDetailSubcategorySlug}
          activePageId={activePage}
          onNavigate={handleNavigate}
          onNavigateSubcategory={handleNavigateProjectSubcategory}
          onOpenContent={(item) => handleOpenProjectContent(item, activePage)}
          sideMenuMode={effectiveSectionSideConfig[detailSection] ? 'logo-link' : 'list'}
          sideLogoSrc={effectiveSectionSideConfig[detailSection]?.sideLogoSrc || ''}
          sideLinkLabel={effectiveSectionSideConfig[detailSection]?.sideLinkLabel || ''}
          sideLinkHref={effectiveSectionSideConfig[detailSection]?.sideLinkHref || '#'}
          showDescription={!effectiveSectionSideConfig[detailSection]}
        />
      ) : isProjectContentPage && (
        contentSourceSection === 'common'
        || contentSourceSection === 'qe'
        || contentSourceSection === 'conversation'
      ) ? (
        <EditorialContentPage content={activeContent} onNavigate={handleNavigate} />
      ) : isProjectContentPage ? (
        <ContentDetailPage content={activeContent} onNavigate={handleNavigate} />
      ) : isConversationListPage ? (
        <ConversationListPage settings={conversationsPageSettings} onOpenContent={handleOpenConversationContent} />
      ) : isConversationPage ? (
        <ConversationPage settings={conversationsPageSettings} onOpenContent={handleOpenConversationContent} onNavigate={handleNavigate} />
      ) : (
        <>
          <section className="hero-section" aria-label="Intro">
            <h1 className="anim-fade-down" style={{ '--anim-delay': '200ms' }}>
              <span style={{ fontWeight: 600 }}>{mainPageSettings.heroTitlePrimary}</span>{' '}
              <span className="italic" style={{ fontWeight: '400' }}>
                {mainPageSettings.heroTitleItalic}
              </span>
            </h1>
            <p className="anim-fade-down" style={{ '--anim-delay': '300ms' }}>
              {mainPageSettings.heroSubtitle}
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
                src={homeCards.common.poster}
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
                poster={homeCards.common.poster}
                onLoadedData={() => markHomeVideoReady('common')}
              >
                {<source src={homeCards.common.video} type="video/mp4" />}
              </video>
              <div className="card-overlay" />
              <div className="card-content">
                {homeCards.common.logoUrl ? (
                  <img
                    className="anim-fade-up"
                    style={{ '--anim-delay': '420ms' }}
                    src={homeCards.common.logoUrl}
                    alt="COMMON"
                  />
                ) : (
                  <h2 className="anim-fade-up" style={{ '--anim-delay': '420ms' }}>
                    {homeCards.common.title || 'COM M ON'}
                  </h2>
                )}
                {homeCards.common.label && (
                  <span className="anim-fade-up" style={{ '--anim-delay': '470ms' }}>
                    {homeCards.common.label}
                  </span>
                )}
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
                src={homeCards.qe.poster}
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
                poster={homeCards.qe.poster}
                onLoadedData={() => markHomeVideoReady('qe')}
              >
                {<source src={homeCards.qe.video} type="video/mp4" />}
              </video>
              <div className="card-overlay" />
              <div className="card-content">
                {homeCards.qe.logoUrl ? (
                  <img
                    className="anim-fade-up"
                    style={{ '--anim-delay': '520ms' }}
                    src={homeCards.qe.logoUrl}
                    alt="QE"
                  />
                ) : (
                  <h2 className="anim-fade-up" style={{ '--anim-delay': '520ms' }}>
                    {homeCards.qe.title || 'QE'}
                  </h2>
                )}
                {homeCards.qe.label && (
                  <span className="anim-fade-up" style={{ '--anim-delay': '570ms' }}>
                    {homeCards.qe.label}
                  </span>
                )}
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
                src={homeCards.projects.poster}
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
                poster={homeCards.projects.poster}
                onLoadedData={() => markHomeVideoReady('projects')}
              >
                {<source src={homeCards.projects.video} type="video/mp4" />}
              </video>
              <div className="card-overlay" />
              <div className="card-content">
                <h2 className="anim-fade-up" style={{ '--anim-delay': '620ms' }}>
                  {homeCards.projects.title || 'Projects'}
                </h2>
                {homeCards.projects.label && (
                  <span className="anim-fade-up" style={{ '--anim-delay': '650ms' }}>
                    {homeCards.projects.label}
                  </span>
                )}
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
                src={homeCards.conversation.poster}
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
                poster={homeCards.conversation.poster}
                onLoadedData={() => markHomeVideoReady('conversation')}
              >
                {<source src={homeCards.conversation.video} type="video/mp4" />}
              </video>
              <div className="card-overlay" />
              <div className="card-content">
                <h2 className="anim-fade-up" style={{ '--anim-delay': '670ms' }}>
                  {homeCards.conversation.title || 'Conversations'}
                </h2>
                {homeCards.conversation.label && (
                  <span className="anim-fade-up" style={{ '--anim-delay': '700ms' }}>
                    {homeCards.conversation.label}
                  </span>
                )}
              </div>
            </article>
          </section>
        </>
      )}
    </main>
  )
}

export default App
