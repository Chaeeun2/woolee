const DEFAULT_ABOUT_BODY = [
  '*Woo Lee* designs creative paradigms across moments of cultural and technological transition.',
  'Beginning her career within the legacy magazine system, she closely observed how editorial authority once shaped cultural taste, creative standards, and the circulation of ideas.',
  'As digital media reshaped the cultural landscape and information-driven media began losing influence, she founded *COM M ON*, an editorial platform centered on human inspiration - musicians, creative personalities, and collectible cultural artifacts.',
  'With the rapid emergence of artificial intelligence in image-making and cultural production, she later launched *QuintEssence (QE)*, a platform exploring how creativity evolves in the age of AI.',
  'Grounded in humanistic and philosophical inquiry, the project examines questions of authorship, value, and cultural judgment in a technological era.',
  "Across these projects, *Woo Lee's* work asks a central question:",
  'If *CREATION* is expanding into *CURATION*, who defines the standards by which culture is selected, framed, and remembered?',
].join('\n')

export const DEFAULT_ABOUT_PAGE_SETTINGS = {
  body: DEFAULT_ABOUT_BODY,
  footerLinks: [
    {
      label: 'info@woo-lee.com',
      href: 'mailto:info@woo-lee.com',
    },
    {
      label: 'Follow on Instagram',
      href: 'https://www.instagram.com/woolee_style/',
    },
  ],
}

const getBodyFromLegacyColumns = (columns) => {
  if (!Array.isArray(columns)) return ''

  return columns
    .flatMap((column) => {
      if (Array.isArray(column)) return column
      if (Array.isArray(column?.paragraphs)) return column.paragraphs
      return []
    })
    .map((paragraph) => String(paragraph || ''))
    .filter(Boolean)
    .join('\n')
}

const normalizeBody = (settings) => {
  if (typeof settings?.body === 'string') return settings.body

  const legacyBody = getBodyFromLegacyColumns(settings?.columns)
  if (legacyBody) return legacyBody

  return DEFAULT_ABOUT_PAGE_SETTINGS.body
}

const normalizeFooterLinks = (footerLinks) => {
  if (!Array.isArray(footerLinks)) return DEFAULT_ABOUT_PAGE_SETTINGS.footerLinks

  return DEFAULT_ABOUT_PAGE_SETTINGS.footerLinks.map((fallbackLink, index) => ({
    ...fallbackLink,
    ...(footerLinks[index] || {}),
  }))
}

export const mergeAboutPageSettings = (settings) => ({
  body: normalizeBody(settings),
  footerLinks: normalizeFooterLinks(settings?.footerLinks),
})
