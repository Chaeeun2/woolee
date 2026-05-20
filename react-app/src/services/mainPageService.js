import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { DEFAULT_MAIN_PAGE_SETTINGS, mergeMainPageSettings } from '../admin/mainPageSettings'
import { db } from '../lib/firebase'

const MAIN_PAGE_DOC_REF = doc(db, 'siteSettings', 'mainPage')

export const getMainPageSettings = async () => {
  const snapshot = await getDoc(MAIN_PAGE_DOC_REF)

  if (!snapshot.exists()) {
    return DEFAULT_MAIN_PAGE_SETTINGS
  }

  return mergeMainPageSettings(snapshot.data())
}

export const saveMainPageSettings = async (settings) => {
  const mergedSettings = mergeMainPageSettings(settings)

  await setDoc(MAIN_PAGE_DOC_REF, {
    ...mergedSettings,
    updatedAt: serverTimestamp(),
  }, { merge: true })

  window.dispatchEvent(new CustomEvent('mainPageSettingsUpdated'))
  return mergedSettings
}

export const resetMainPageSettings = async () => {
  await saveMainPageSettings(DEFAULT_MAIN_PAGE_SETTINGS)
  return DEFAULT_MAIN_PAGE_SETTINGS
}
