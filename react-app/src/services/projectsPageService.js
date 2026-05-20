import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import {
  DEFAULT_PROJECTS_PAGE_SETTINGS,
  mergeProjectsPageSettings,
  serializeProjectsPageSettings,
} from '../admin/projectsPageSettings'
import { db } from '../lib/firebase'

const PROJECTS_PAGE_DOC_REF = doc(db, 'siteSettings', 'projectsPage')

export const getProjectsPageSettings = async () => {
  const snapshot = await getDoc(PROJECTS_PAGE_DOC_REF)

  if (!snapshot.exists()) {
    return DEFAULT_PROJECTS_PAGE_SETTINGS
  }

  return mergeProjectsPageSettings(snapshot.data())
}

export const saveProjectsPageSettings = async (settings) => {
  const mergedSettings = mergeProjectsPageSettings(settings)
  const serializedSettings = serializeProjectsPageSettings(mergedSettings)

  await setDoc(PROJECTS_PAGE_DOC_REF, {
    ...serializedSettings,
    updatedAt: serverTimestamp(),
  })

  window.dispatchEvent(new CustomEvent('projectsPageSettingsUpdated'))
  return mergedSettings
}

export const resetProjectsPageSettings = async () => {
  await saveProjectsPageSettings(DEFAULT_PROJECTS_PAGE_SETTINGS)
  return DEFAULT_PROJECTS_PAGE_SETTINGS
}
