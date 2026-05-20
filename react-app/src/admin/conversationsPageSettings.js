export const DEFAULT_CONVERSATIONS_PAGE_SETTINGS = {
  intro: {
    body: [
      '*Conversations* bring ideas into the public sphere through lectures, interviews, and dialogue.',
      'A space where cultural, creative, and technological questions are explored in exchange with audiences, institutions, and media.',
    ].join('\n'),
  },
  items: [],
}

const normalizeIntro = (intro = {}) => ({
  ...DEFAULT_CONVERSATIONS_PAGE_SETTINGS.intro,
  ...intro,
  body: String(intro.body ?? DEFAULT_CONVERSATIONS_PAGE_SETTINGS.intro.body),
})

const normalizeItem = (item = {}, fallbackItem = {}) => ({
  ...fallbackItem,
  ...item,
  id: String(item.id || fallbackItem.id || crypto.randomUUID()),
  pageId: String(item.pageId || fallbackItem.pageId || 'conversation-sample'),
  label: String(item.label || fallbackItem.label || ''),
  category: String(item.category ?? fallbackItem.category ?? ''),
  action: ['external', 'detail', 'none'].includes(item.action) ? item.action : fallbackItem.action || 'detail',
  externalUrl: String(item.externalUrl ?? item.href ?? fallbackItem.externalUrl ?? ''),
  thumbnailUrl: String(item.thumbnailUrl ?? item.image ?? fallbackItem.thumbnailUrl ?? ''),
  detailCaption: String(item.detailCaption ?? item.caption ?? fallbackItem.detailCaption ?? item.label ?? fallbackItem.label ?? ''),
  detailMedia: Array.isArray(item.detailMedia)
    ? item.detailMedia.map((url) => String(url || '')).filter(Boolean)
    : Array.isArray(item.detailImages)
      ? item.detailImages.map((url) => String(url || '')).filter(Boolean)
      : fallbackItem.detailMedia || [],
})

export const mergeConversationsPageSettings = (settings = {}) => {
  const incomingItems = Array.isArray(settings.items)
    ? settings.items
    : Array.isArray(settings.itemOrder)
      ? settings.itemOrder.map((id) => settings.items?.[id]).filter(Boolean)
      : []
  const items = incomingItems.length > 0
    ? incomingItems.map((item, index) => normalizeItem(item, DEFAULT_CONVERSATIONS_PAGE_SETTINGS.items[index]))
    : DEFAULT_CONVERSATIONS_PAGE_SETTINGS.items

  return {
    intro: normalizeIntro(settings.intro),
    items,
  }
}

export const serializeConversationsPageSettings = (settings) => {
  const mergedSettings = mergeConversationsPageSettings(settings)

  return {
    intro: mergedSettings.intro,
    itemOrder: mergedSettings.items.map((item) => item.id),
    items: Object.fromEntries(mergedSettings.items.map((item) => [item.id, item])),
  }
}

export const getConversationContentItems = (settings) => (
  mergeConversationsPageSettings(settings).items.map((item) => ({
    id: item.id,
    pageId: item.pageId,
    label: item.label,
    action: item.action,
    href: item.action === 'external' ? item.externalUrl : '#',
    image: item.thumbnailUrl,
    item: {
      category: item.category,
      label: item.label,
      href: item.action === 'external' ? item.externalUrl : '#',
      linkType: item.action === 'none' ? 'none' : item.action === 'external' ? 'external' : undefined,
      externalUrl: item.action === 'external' ? item.externalUrl : '',
      image: item.thumbnailUrl,
      detailCaption: item.detailCaption,
      detailImages: item.detailMedia,
    },
  }))
)

export const getConversationDetailItems = (settings) => ({
  'conversation-sample': {
    title: 'Conversations',
    description: null,
    items: getConversationContentItems(settings)
      .filter((entry) => entry.action === 'detail')
      .map((entry) => entry.item),
  },
})
