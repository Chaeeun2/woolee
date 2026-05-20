export const DEFAULT_COMMON_PAGE_SETTINGS = {
  intro: {
    logoUrl: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/common-logo-2.png',
    siteUrl: 'http://common-mag.com',
    body: [
      '*COM M ON* is an editorial platform shaped by:',
      'Contemporary Vision',
      'Conceptual Imagination',
      'Courageous Provocation',
      'Rooted in *musicians* and *fashion* as cultural language.',
    ].join('\n'),
  },
  projects: [],
}

const normalizeIntro = (intro = {}) => ({
  ...DEFAULT_COMMON_PAGE_SETTINGS.intro,
  ...intro,
  body: String(intro.body ?? DEFAULT_COMMON_PAGE_SETTINGS.intro.body),
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

export const mergeCommonPageSettings = (settings = {}) => {
  const incomingProjects = Array.isArray(settings.projects)
    ? settings.projects
    : Array.isArray(settings.projectOrder)
      ? settings.projectOrder.map((id) => settings.projects?.[id]).filter(Boolean)
      : []
  const projects = incomingProjects.length > 0
    ? incomingProjects.map((project, index) => normalizeProject(project, DEFAULT_COMMON_PAGE_SETTINGS.projects[index]))
    : DEFAULT_COMMON_PAGE_SETTINGS.projects

  return {
    intro: normalizeIntro(settings.intro),
    projects,
  }
}

export const serializeCommonPageSettings = (settings) => {
  const mergedSettings = mergeCommonPageSettings(settings)

  return {
    intro: mergedSettings.intro,
    projectOrder: mergedSettings.projects.map((project) => project.id),
    projects: Object.fromEntries(mergedSettings.projects.map((project) => [project.id, project])),
  }
}

export const getCommonProjectPath = (project) => `/com-m-on/${project.id.replace(/^common-/, '')}`

export const getCommonDetailNav = (settings) => (
  mergeCommonPageSettings(settings).projects.map((project) => ({
    pageId: project.id,
    label: project.title,
    path: getCommonProjectPath(project),
  }))
)

export const getCommonDetailItems = (settings) => Object.fromEntries(
  mergeCommonPageSettings(settings).projects.map((project) => [
    project.id,
    {
      title: 'COM M ON',
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
