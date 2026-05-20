import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import {
  DEFAULT_CONVERSATIONS_PAGE_SETTINGS,
  mergeConversationsPageSettings,
  serializeConversationsPageSettings,
} from '../admin/conversationsPageSettings'
import { db } from '../lib/firebase'

const CONVERSATIONS_PAGE_DOC_REF = doc(db, 'siteSettings', 'conversationsPage')

export const getConversationsPageSettings = async () => {
  const snapshot = await getDoc(CONVERSATIONS_PAGE_DOC_REF)

  if (!snapshot.exists()) {
    return DEFAULT_CONVERSATIONS_PAGE_SETTINGS
  }

  return mergeConversationsPageSettings(snapshot.data())
}

export const saveConversationsPageSettings = async (settings) => {
  const mergedSettings = mergeConversationsPageSettings(settings)
  const serializedSettings = serializeConversationsPageSettings(mergedSettings)

  await setDoc(CONVERSATIONS_PAGE_DOC_REF, {
    ...serializedSettings,
    updatedAt: serverTimestamp(),
  })

  window.dispatchEvent(new CustomEvent('conversationsPageSettingsUpdated'))
  return mergedSettings
}

export const resetConversationsPageSettings = async () => {
  await saveConversationsPageSettings(DEFAULT_CONVERSATIONS_PAGE_SETTINGS)
  return DEFAULT_CONVERSATIONS_PAGE_SETTINGS
}
