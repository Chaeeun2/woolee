export const DEFAULT_MAIN_PAGE_SETTINGS = {
  heroTitlePrimary: 'WOO',
  heroTitleItalic: 'LEE',
  heroSubtitle: 'Cultural & Creative Director',
  cards: {
    common: {
      label: 'magazine',
      title: '',
      logoUrl: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/common%20logo.png',
      video: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-common.mp4',
      poster: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-common-poster.jpg',
    },
    qe: {
      label: 'magazine',
      title: '',
      logoUrl: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/qe%20logo.png',
      video: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-qe.mp4',
      poster: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-qe-poster.jpg',
    },
    projects: {
      label: '',
      title: 'Projects',
      logoUrl: '',
      video: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-projects.mp4',
      poster: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-projects-poster.jpg',
    },
    conversation: {
      label: '',
      title: 'Conversations',
      logoUrl: '',
      video: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-conversation.mp4',
      poster: 'https://pub-698f58114a944b669e4e9ffd980dafb6.r2.dev/home-conversation-poster.jpg',
    },
  },
}

export const mergeMainPageSettings = (settings) => ({
  ...DEFAULT_MAIN_PAGE_SETTINGS,
  ...settings,
  cards: {
    common: {
      ...DEFAULT_MAIN_PAGE_SETTINGS.cards.common,
      ...(settings?.cards?.common || {}),
    },
    qe: {
      ...DEFAULT_MAIN_PAGE_SETTINGS.cards.qe,
      ...(settings?.cards?.qe || {}),
    },
    projects: {
      ...DEFAULT_MAIN_PAGE_SETTINGS.cards.projects,
      ...(settings?.cards?.projects || {}),
    },
    conversation: {
      ...DEFAULT_MAIN_PAGE_SETTINGS.cards.conversation,
      ...(settings?.cards?.conversation || {}),
    },
  },
})
