import { deleteField, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { DEFAULT_ABOUT_PAGE_SETTINGS, mergeAboutPageSettings } from '../admin/aboutSettings'
import { db } from '../lib/firebase'

const ABOUT_PAGE_DOC_REF = doc(db, 'siteSettings', 'aboutPage')

export const getAboutPageSettings = async () => {
  const snapshot = await getDoc(ABOUT_PAGE_DOC_REF)

  if (!snapshot.exists()) {
    return DEFAULT_ABOUT_PAGE_SETTINGS
  }

  return mergeAboutPageSettings(snapshot.data())
}

export const saveAboutPageSettings = async (settings) => {
  const mergedSettings = mergeAboutPageSettings(settings)

  await setDoc(ABOUT_PAGE_DOC_REF, {
    ...mergedSettings,
    columns: deleteField(),
    updatedAt: serverTimestamp(),
  }, { merge: true })

  window.dispatchEvent(new CustomEvent('aboutPageSettingsUpdated'))
  return mergedSettings
}

export const resetAboutPageSettings = async () => {
  await saveAboutPageSettings(DEFAULT_ABOUT_PAGE_SETTINGS)
  return DEFAULT_ABOUT_PAGE_SETTINGS
}
