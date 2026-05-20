import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import {
  DEFAULT_QE_PAGE_SETTINGS,
  mergeQePageSettings,
  serializeQePageSettings,
} from '../admin/qePageSettings'
import { db } from '../lib/firebase'

const QE_PAGE_DOC_REF = doc(db, 'siteSettings', 'qePage')

export const getQePageSettings = async () => {
  const snapshot = await getDoc(QE_PAGE_DOC_REF)

  if (!snapshot.exists()) {
    return DEFAULT_QE_PAGE_SETTINGS
  }

  return mergeQePageSettings(snapshot.data())
}

export const saveQePageSettings = async (settings) => {
  const mergedSettings = mergeQePageSettings(settings)
  const serializedSettings = serializeQePageSettings(mergedSettings)

  await setDoc(QE_PAGE_DOC_REF, {
    ...serializedSettings,
    updatedAt: serverTimestamp(),
  })

  window.dispatchEvent(new CustomEvent('qePageSettingsUpdated'))
  return mergedSettings
}

export const resetQePageSettings = async () => {
  await saveQePageSettings(DEFAULT_QE_PAGE_SETTINGS)
  return DEFAULT_QE_PAGE_SETTINGS
}
