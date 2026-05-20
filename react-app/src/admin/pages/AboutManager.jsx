import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { DEFAULT_ABOUT_PAGE_SETTINGS } from '../aboutSettings'
import { getAboutPageSettings, saveAboutPageSettings } from '../../services/aboutPageService'
import './AboutManager.css'

const getEmailFromLink = (link) => (
  String(link?.href || link?.label || '').replace(/^mailto:/, '')
)

export default function AboutManager({ onNavigateAdmin }) {
  const [settings, setSettings] = useState(DEFAULT_ABOUT_PAGE_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    let mounted = true

    const loadSettings = async () => {
      try {
        const nextSettings = await getAboutPageSettings()
        if (mounted) setSettings(nextSettings)
      } catch (error) {
        console.error('About 페이지 설정 불러오기 실패:', error)
        if (mounted) setStatusMessage('Firestore에서 About 설정을 불러오지 못했습니다.')
      }
    }

    loadSettings()

    return () => {
      mounted = false
    }
  }, [])

  const updateBody = (value) => {
    setSettings((prev) => ({
      ...prev,
      body: value,
    }))
  }

  const updateFooterLinks = (footerLinks) => {
    setSettings((prev) => ({
      ...prev,
      footerLinks,
    }))
  }

  const updateEmail = (email) => {
    const instagramLink = settings.footerLinks[1]
    updateFooterLinks([
      {
        label: email,
        href: email ? `mailto:${email}` : '',
      },
      {
        label: 'Follow on Instagram',
        href: instagramLink?.href || '',
      },
    ])
  }

  const updateInstagramUrl = (url) => {
    const email = getEmailFromLink(settings.footerLinks[0])
    updateFooterLinks([
      {
        label: email,
        href: email ? `mailto:${email}` : '',
      },
      {
        label: 'Follow on Instagram',
        href: url,
      },
    ])
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const savedSettings = await saveAboutPageSettings(settings)
      setSettings(savedSettings)
      setStatusMessage('')
    } catch (error) {
      console.error('About 페이지 설정 저장 실패:', error)
      setStatusMessage(`저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout onNavigateAdmin={onNavigateAdmin}>
      <main className="admin-page about-admin-page">
        <header className="admin-page-header">
          <div>
            <h1>ABOUT 관리</h1>
          </div>
          <div className="admin-header-actions">
            <button className="admin-button primary" type="button" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </header>

        {statusMessage && <p className="admin-status-message">{statusMessage}</p>}

        <section className="admin-layout-grid single with-bottom-padding">
          <div className="admin-panel">
            <div className="admin-section-header">
              <h2>본문</h2>
            </div>

            <div className="admin-form-row">
              <label htmlFor="aboutBody">About 텍스트<span className="admin-caption" style={{ marginLeft: '10px' }}>엔터로 줄바꿈 / *텍스트*로 강조</span></label>
              <textarea
                id="aboutBody"
                className="about-admin-body"
                value={settings.body}
                onChange={(event) => updateBody(event.target.value)}
                rows={18}
              />
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-section-header">
              <h2>하단 링크</h2>
            </div>

            <div className="about-admin-links">
              <div className="about-admin-link">
                <div className="admin-form-row">
                  <label htmlFor="about-email">메일 주소</label>
                  <input
                    id="about-email"
                    type="email"
                    value={getEmailFromLink(settings.footerLinks[0])}
                    onChange={(event) => updateEmail(event.target.value)}
                    placeholder="info@woo-lee.com"
                  />
                </div>
              </div>
              <div className="about-admin-link">
                <div className="admin-form-row">
                  <label htmlFor="about-instagram-url">인스타그램 URL</label>
                  <input
                    id="about-instagram-url"
                    type="url"
                    value={settings.footerLinks[1]?.href || ''}
                    onChange={(event) => updateInstagramUrl(event.target.value)}
                    placeholder="https://www.instagram.com/woolee_style/"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AdminLayout>
  )
}
