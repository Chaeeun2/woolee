import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { DEFAULT_MAIN_PAGE_SETTINGS } from '../mainPageSettings'
import { getMainPageSettings, saveMainPageSettings } from '../../services/mainPageService'
import { uploadFileToR2 } from '../../services/r2UploadService'
import './MainPageManager.css'

const CARD_OPTIONS = [
  { id: 'common', label: 'COM M ON', ratio: '홈 카드 1' },
  { id: 'qe', label: 'QE', ratio: '홈 카드 2' },
  { id: 'projects', label: 'Projects', ratio: '홈 카드 3' },
  { id: 'conversation', label: 'Conversations', ratio: '홈 카드 4' },
]

const MEDIA_FIELDS = [
  {
    field: 'video',
    label: '영상 파일',
    uploadLabel: '파일 업로드',
    uploadingLabel: '업로드 중...',
    accept: 'video/mp4',
    allowedTypes: ['video/mp4'],
    maxSize: 100 * 1024 * 1024,
    caption: 'MP4, 최대 100MB',
    previewType: 'video',
  },
  {
    field: 'poster',
    label: '포스터 이미지',
    sideCaption: '동영상 로드에 실패했을 경우 대체 이미지',
    uploadLabel: '파일 업로드',
    uploadingLabel: '업로드 중...',
    accept: 'image/jpeg,image/png,image/webp',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 2 * 1024 * 1024,
    caption: 'JPG, PNG, WEBP, 최대 2MB',
    previewType: 'image',
  },
  {
    field: 'logoUrl',
    label: '로고 이미지',
    uploadLabel: '파일 업로드',
    uploadingLabel: '업로드 중...',
    accept: 'image/jpeg,image/png,image/webp',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 2 * 1024 * 1024,
    caption: 'JPG, PNG, WEBP, 최대 2MB',
    previewType: 'image',
  },
]

const MEDIA_FIELD_BY_KEY = Object.fromEntries(MEDIA_FIELDS.map((mediaField) => [mediaField.field, mediaField]))

export default function MainPageManager({ onNavigateAdmin }) {
  const [settings, setSettings] = useState(DEFAULT_MAIN_PAGE_SETTINGS)
  const [activeCardId, setActiveCardId] = useState('common')
  const [statusMessage, setStatusMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState('')

  const activeCard = settings.cards[activeCardId]

  useEffect(() => {
    let mounted = true

    const loadSettings = async () => {
      try {
        const nextSettings = await getMainPageSettings()
        if (mounted) setSettings(nextSettings)
      } catch (error) {
        console.error('메인페이지 설정 불러오기 실패:', error)
        if (mounted) setStatusMessage('Firestore에서 설정을 불러오지 못했습니다. Firebase 설정과 권한을 확인해주세요.')
      }
    }

    loadSettings()

    return () => {
      mounted = false
    }
  }, [])

  const updateSettings = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateCard = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [activeCardId]: {
          ...prev.cards[activeCardId],
          [field]: value,
        },
      },
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const savedSettings = await saveMainPageSettings(settings)
      setSettings(savedSettings)
      setStatusMessage('')
    } catch (error) {
      console.error('메인페이지 설정 저장 실패:', error)
      setStatusMessage(`저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleMediaUpload = async (field, file) => {
    if (!file) return

    const uploadKey = `${activeCardId}-${field}`
    const mediaField = MEDIA_FIELD_BY_KEY[field]

    if (!mediaField.allowedTypes.includes(file.type)) {
      setStatusMessage(`${mediaField.label}은(는) ${mediaField.caption}합니다.`)
      return
    }

    if (file.size > mediaField.maxSize) {
      setStatusMessage(`${mediaField.label}은(는) ${mediaField.caption}합니다.`)
      return
    }

    try {
      setUploadingField(uploadKey)
      const result = await uploadFileToR2(file, `main-page/${activeCardId}`)

      const nextSettings = {
        ...settings,
        cards: {
          ...settings.cards,
          [activeCardId]: {
            ...settings.cards[activeCardId],
            [field]: result.url,
          },
        },
      }
      setSettings(nextSettings)

      const savedSettings = await saveMainPageSettings(nextSettings)
      setSettings(savedSettings)
      setStatusMessage('')
    } catch (error) {
      console.error('R2 업로드 실패:', error)
      setStatusMessage(`업로드 또는 Firebase 저장에 실패했습니다: ${error.message}`)
    } finally {
      setUploadingField('')
    }
  }

  return (
    <AdminLayout onNavigateAdmin={onNavigateAdmin}>
      <main className="admin-page admin-main-page">
        <header className="admin-page-header">
          <div>
            <h1>MAIN 관리</h1>
          </div>
          <div className="admin-header-actions">
            <button className="admin-button primary" type="button" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </header>

        {statusMessage && <p className="admin-status-message">{statusMessage}</p>}

        <section className="admin-layout-grid single">
          <div className="admin-panel">
            <div className="admin-section-header">
              <h2>메인 관리</h2>
            </div>
            <div className="admin-form-row">
              <label htmlFor="heroSubtitle">타이틀</label>
              <input
                id="heroSubtitle"
                value={settings.heroSubtitle}
                onChange={(event) => updateSettings('heroSubtitle', event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="admin-layout-grid single with-bottom-padding">
          <div className="admin-panel">
            <div className="admin-section-header">
              <h2>카드 관리</h2>
            </div>
            <div className="admin-card-menu" aria-label="수정할 카드 선택" style={{ marginBottom: '20px' }}>
              {CARD_OPTIONS.map((card) => (
                <button
                  key={card.id}
                  className={card.id === activeCardId ? 'active' : ''}
                  type="button"
                  onClick={() => setActiveCardId(card.id)}
                >
                  {card.label}
                </button>
              ))}
            </div>
            <div className="admin-upload-grid">
              {MEDIA_FIELDS.map((mediaField) => {
                const uploadKey = `${activeCardId}-${mediaField.field}`
                const currentUrl = activeCard[mediaField.field]

                return (
                  <div className={`admin-upload-row ${mediaField.field}`} key={mediaField.field}>
                    <div className="admin-upload-info">
                      <div>
                        <strong>
                          {mediaField.label}
                          {mediaField.sideCaption && (
                            <span className="admin-inline-caption">{mediaField.sideCaption}</span>
                          )}
                        </strong>
                        <span>{currentUrl ? '' : '업로드된 파일이 없습니다.'}</span>
                      </div>
                      {currentUrl && (
                        <div className={`admin-media-preview ${mediaField.previewType}`}>
                          {mediaField.previewType === 'video' ? (
                            <video src={currentUrl} controls muted preload="metadata" />
                          ) : (
                            <img src={currentUrl} alt={`${mediaField.label} 미리보기`} />
                          )}
                        </div>
                      )}
                      <div className="admin-upload-action">
                        <label className="admin-file-button">
                          {uploadingField === uploadKey ? mediaField.uploadingLabel : mediaField.uploadLabel}
                          <input
                            type="file"
                            accept={mediaField.accept}
                            disabled={Boolean(uploadingField)}
                            onChange={(event) => handleMediaUpload(mediaField.field, event.target.files?.[0])}
                          />
                        </label>
                        <p className="admin-caption admin-upload-caption">{mediaField.caption}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="admin-form-row">
              <label htmlFor="cardTitle">텍스트 타이틀</label>
              <input
                id="cardTitle"
                value={activeCard.title}
                placeholder="로고 대신 표시할 텍스트"
                onChange={(event) => updateCard('title', event.target.value)}
              />
            </div>
            <div className="admin-form-row">
              <label htmlFor="cardLabel">보조 라벨</label>
              <input
                id="cardLabel"
                value={activeCard.label}
                placeholder="예: magazine"
                onChange={(event) => updateCard('label', event.target.value)}
              />
            </div>
          </div>

        </section>
      </main>
    </AdminLayout>
  )
}
