const SECTION_WITH_TYPE_MANAGEMENT = 'projects-editorial-platforms'

const slugify = (value) => (
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
)

const DEFAULT_PROJECT_SECTIONS = [
  { id: 'projects-editorial-platforms', label: 'Editorial Platforms', path: '/projects/editorial-platforms' },
  { id: 'projects-cultural-programs', label: 'Cultural Programs', path: '/projects/cultural-programs' },
  { id: 'projects-visual-direction', label: 'Visual Direction', path: '/projects/visual-direction' },
  { id: 'projects-strategic-identity', label: 'Strategic Identity', path: '/projects/strategic-identity' },
  { id: 'projects-special-collaborations', label: 'Special Collaborations', path: '/projects/special-collaborations' },
].map((section) => ({
  ...section,
  title: section.label,
  descriptionTitle: section.label,
  descriptionContent: '',
  subcategories: [],
  typeOptions: [],
  items: [],
}))

export const DEFAULT_PROJECTS_PAGE_SETTINGS = {
  intro: {
    body: [
      '*Projects* are structured through vision, alignment, and execution.',
      '-- Define and structure creative and cultural direction',
      '-- Design execution architecture',
      '-- Assemble and lead specialised teams',
      '-- Take full responsibility for outcomes',
    ].join('\n'),
  },
  sections: DEFAULT_PROJECT_SECTIONS,
}

const normalizeIntro = (intro = {}) => ({
  ...DEFAULT_PROJECTS_PAGE_SETTINGS.intro,
  ...intro,
  body: String(intro.body ?? DEFAULT_PROJECTS_PAGE_SETTINGS.intro.body),
})

const normalizeItem = (item = {}, fallbackItem = {}, sectionId = 'projects') => ({
  ...fallbackItem,
  ...item,
  id: String(item.id || fallbackItem.id || `${sectionId}-item-${crypto.randomUUID()}`),
  category: String(item.category ?? fallbackItem.category ?? ''),
  type: String(item.type ?? fallbackItem.type ?? ''),
  label: String(item.label || fallbackItem.label || ''),
  thumbnailUrl: String(item.thumbnailUrl ?? item.image ?? fallbackItem.thumbnailUrl ?? ''),
  detailCaption: String(item.detailCaption ?? item.caption ?? fallbackItem.detailCaption ?? ''),
  detailMedia: Array.isArray(item.detailMedia)
    ? item.detailMedia.map((url) => String(url || '')).filter(Boolean)
    : Array.isArray(item.detailImages)
      ? item.detailImages.map((url) => String(url || '')).filter(Boolean)
      : fallbackItem.detailMedia || [],
})

const normalizeSubcategory = (subcategory = {}, fallbackSubcategory = {}) => ({
  ...fallbackSubcategory,
  ...subcategory,
  id: String(subcategory.id || fallbackSubcategory.id || slugify(subcategory.label) || crypto.randomUUID()),
  slug: String(subcategory.slug || fallbackSubcategory.slug || slugify(subcategory.label)),
  label: String(subcategory.label || fallbackSubcategory.label || ''),
  itemLabels: Array.isArray(subcategory.itemLabels)
    ? subcategory.itemLabels.map((label) => String(label || '')).filter(Boolean)
    : fallbackSubcategory.itemLabels || [],
})

const normalizeSection = (section = {}, fallbackSection = {}) => ({
  ...fallbackSection,
  ...section,
  id: String(section.id || fallbackSection.id || `projects-${crypto.randomUUID()}`),
  label: String(section.label || fallbackSection.label || ''),
  path: String(section.path || fallbackSection.path || `/projects/${String(section.id || fallbackSection.id || '').replace(/^projects-/, '')}`),
  title: String(section.title || fallbackSection.title || section.label || fallbackSection.label || ''),
  descriptionTitle: String(section.descriptionTitle || fallbackSection.descriptionTitle || section.title || fallbackSection.title || ''),
  descriptionContent: String(section.descriptionContent ?? fallbackSection.descriptionContent ?? ''),
  typeOptions: String(section.id || fallbackSection.id) === SECTION_WITH_TYPE_MANAGEMENT
    ? Array.isArray(section.typeOptions)
      ? section.typeOptions.map((type) => String(type || '')).filter(Boolean)
      : fallbackSection.typeOptions || section.subcategories?.map((subcategory) => String(subcategory.label || '')).filter(Boolean) || []
    : [],
  subcategories: Array.isArray(section.subcategories)
    ? section.subcategories.map((subcategory, index) => normalizeSubcategory(subcategory, fallbackSection.subcategories?.[index]))
    : fallbackSection.subcategories || [],
  items: Array.isArray(section.items)
    ? section.items.map((item, index) => normalizeItem(item, fallbackSection.items?.[index], section.id || fallbackSection.id))
    : fallbackSection.items || [],
})

export const mergeProjectsPageSettings = (settings = {}) => {
  const incomingSections = Array.isArray(settings.sections)
    ? settings.sections
    : Array.isArray(settings.sectionOrder)
      ? settings.sectionOrder.map((id) => settings.sections?.[id]).filter(Boolean)
      : []
  const sections = incomingSections.length > 0
    ? incomingSections.map((section, index) => normalizeSection(section, DEFAULT_PROJECTS_PAGE_SETTINGS.sections[index]))
    : DEFAULT_PROJECTS_PAGE_SETTINGS.sections

  return {
    intro: normalizeIntro(settings.intro),
    sections,
  }
}

export const serializeProjectsPageSettings = (settings) => {
  const mergedSettings = mergeProjectsPageSettings(settings)

  return {
    intro: mergedSettings.intro,
    sectionOrder: mergedSettings.sections.map((section) => section.id),
    sections: Object.fromEntries(mergedSettings.sections.map((section) => [section.id, section])),
  }
}

export const getProjectsDetailNav = (settings) => (
  mergeProjectsPageSettings(settings).sections.map((section) => ({
    pageId: section.id,
    label: section.label,
    path: section.path,
  }))
)

export const getProjectsDetailItems = (settings) => Object.fromEntries(
  mergeProjectsPageSettings(settings).sections.map((section) => [
    section.id,
    {
      title: section.title,
      description: section.descriptionContent
        ? { title: section.descriptionTitle, content: section.descriptionContent }
        : null,
      items: section.items.map((item) => ({
        category: item.category,
        type: item.type,
        label: item.label,
        href: '#',
        image: item.thumbnailUrl,
        detailCaption: item.detailCaption,
        detailImages: item.detailMedia,
      })),
    },
  ]),
)

export const getProjectsSideSubcategories = (settings) => Object.fromEntries(
  mergeProjectsPageSettings(settings).sections
    .filter((section) => section.id === SECTION_WITH_TYPE_MANAGEMENT && section.typeOptions.length > 0)
    .map((section) => [
      section.id,
      section.typeOptions.map((type, index) => ({
        id: slugify(type) || `type-${index + 1}`,
        slug: String(index + 1),
        label: type,
        itemLabels: section.items
          .filter((item) => item.type === type)
          .map((item) => item.label),
      })),
    ]),
)
