export const DEFAULT_QE_PAGE_SETTINGS = {
  intro: {
    logoUrl: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/qe-logo-2.png',
    siteUrl: 'https://qe-mag.com',
    body: [
      '*QE* is a fashion and art platform exploring contemporary culture through AI-based modes of creation.',
      'Grounded in humanistic and philosophical inquiry, it approaches technology not as an answer, but as a lens — rethinking authorship, value, and expression.',
    ].join('\n'),
  },
  projects: [],
}

const normalizeIntro = (intro = {}) => ({
  ...DEFAULT_QE_PAGE_SETTINGS.intro,
  ...intro,
  body: String(intro.body ?? DEFAULT_QE_PAGE_SETTINGS.intro.body),
})

const normalizeProject = (project = {}, fallbackProject = {}) => ({
  ...fallbackProject,
  ...project,
  id: String(project.id || fallbackProject.id || crypto.randomUUID()),
  title: String(project.title || fallbackProject.title || ''),
  thumbnailUrl: String(project.thumbnailUrl ?? project.image ?? fallbackProject.thumbnailUrl ?? ''),
  thumbnailCaption: String(project.thumbnailCaption ?? project.detailCaption ?? project.caption ?? fallbackProject.thumbnailCaption ?? ''),
  detailMedia: Array.isArray(project.detailMedia)
    ? project.detailMedia.map((url) => String(url || '')).filter(Boolean)
    : Array.isArray(project.detailImages)
      ? project.detailImages.map((url) => String(url || '')).filter(Boolean)
      : fallbackProject.detailMedia || [],
})

export const mergeQePageSettings = (settings = {}) => {
  const incomingProjects = Array.isArray(settings.projects)
    ? settings.projects
    : Array.isArray(settings.projectOrder)
      ? settings.projectOrder.map((id) => settings.projects?.[id]).filter(Boolean)
      : []
  const projects = incomingProjects.length > 0
    ? incomingProjects.map((project, index) => normalizeProject(project, DEFAULT_QE_PAGE_SETTINGS.projects[index]))
    : DEFAULT_QE_PAGE_SETTINGS.projects

  return {
    intro: normalizeIntro(settings.intro),
    projects,
  }
}

export const serializeQePageSettings = (settings) => {
  const mergedSettings = mergeQePageSettings(settings)

  return {
    intro: mergedSettings.intro,
    projectOrder: mergedSettings.projects.map((project) => project.id),
    projects: Object.fromEntries(mergedSettings.projects.map((project) => [project.id, project])),
  }
}

export const getQeProjectPath = (project) => `/qe/${project.id.replace(/^qe-/, '')}`

export const getQeDetailNav = (settings) => (
  mergeQePageSettings(settings).projects.map((project) => ({
    pageId: project.id,
    label: project.title,
    path: getQeProjectPath(project),
  }))
)

export const getQeDetailItems = (settings) => Object.fromEntries(
  mergeQePageSettings(settings).projects.map((project) => [
    project.id,
    {
      title: 'QE',
      description: null,
      items: [
        {
          label: project.title,
          href: '#',
          image: project.thumbnailUrl,
          caption: project.thumbnailCaption,
          detailCaption: project.thumbnailCaption || project.title,
          detailImages: project.detailMedia,
        },
      ],
    },
  ]),
)
