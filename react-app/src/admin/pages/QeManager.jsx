import { DEFAULT_QE_PAGE_SETTINGS } from '../qePageSettings'
import { getQePageSettings, saveQePageSettings } from '../../services/qePageService'
import CommonManager from './CommonManager'

export default function QeManager({ onNavigateAdmin }) {
  return (
    <CommonManager
      onNavigateAdmin={onNavigateAdmin}
      pageLabel="QE"
      introSectionTitle="About QE"
      projectSectionTitle="Items"
      defaultSettings={DEFAULT_QE_PAGE_SETTINGS}
      getSettings={getQePageSettings}
      saveSettings={saveQePageSettings}
      storageDirectory="qe"
      newProjectIdPrefix="qe"
    />
  )
}
