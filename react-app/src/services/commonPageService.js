import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import {
  DEFAULT_COMMON_PAGE_SETTINGS,
  mergeCommonPageSettings,
  serializeCommonPageSettings,
} from '../admin/commonPageSettings'
import { db } from '../lib/firebase'

const COMMON_PAGE_DOC_REF = doc(db, 'siteSettings', 'commonPage')

export const getCommonPageSettings = async () => {
  const snapshot = await getDoc(COMMON_PAGE_DOC_REF)

  if (!snapshot.exists()) {
    return DEFAULT_COMMON_PAGE_SETTINGS
  }

  return mergeCommonPageSettings(snapshot.data())
}

export const saveCommonPageSettings = async (settings) => {
  const mergedSettings = mergeCommonPageSettings(settings)
  const serializedSettings = serializeCommonPageSettings(mergedSettings)

  await setDoc(COMMON_PAGE_DOC_REF, {
    ...serializedSettings,
    updatedAt: serverTimestamp(),
  })

  window.dispatchEvent(new CustomEvent('commonPageSettingsUpdated'))
  return mergedSettings
}

export const resetCommonPageSettings = async () => {
  await saveCommonPageSettings(DEFAULT_COMMON_PAGE_SETTINGS)
  return DEFAULT_COMMON_PAGE_SETTINGS
}
