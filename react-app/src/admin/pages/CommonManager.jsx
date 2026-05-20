import { useEffect, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import AdminLayout from '../components/AdminLayout'
import { DEFAULT_COMMON_PAGE_SETTINGS } from '../commonPageSettings'
import { getCommonPageSettings, saveCommonPageSettings } from '../../services/commonPageService'
import { deleteFileUrlFromR2, uploadFileToR2 } from '../../services/r2UploadService'
import './CommonManager.css'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const DETAIL_TYPES = [...IMAGE_TYPES, 'video/mp4']
const IMAGE_MAX_SIZE = 2 * 1024 * 1024
const VIDEO_MAX_SIZE = 100 * 1024 * 1024

const isVideoUrl = (url) => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url || '')

function SortableCommonProjectRow({ project, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition: 'none',
  }

  return (
    <div
      ref={setNodeRef}
      className={`common-project-row ${isDragging ? 'dragging' : ''}`}
      style={style}
      {...attributes}
    >
      <div className="common-project-title-cell">
        <button className="common-project-drag-handle" type="button" aria-label={`${project.title || '프로젝트'} 순서 변경`} {...listeners}>
          ⠿
        </button>
        <span className="common-project-thumb">
          {project.thumbnailUrl ? <img src={project.thumbnailUrl} alt="" /> : null}
        </span>
        <div className="common-project-title">
          <strong>{project.title || '제목 없음'}</strong>
        </div>
      </div>
      <div className="common-project-actions">
        <button className="admin-button secondary" type="button" onClick={() => onEdit(project.id)}>
          수정
        </button>
        <button className="admin-button danger" type="button" onClick={() => onDelete(project.id)}>
          삭제
        </button>
      </div>
    </div>
  )
}

function SortableDetailMediaItem({ id, url, title, index, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition: 'none',
  }

  return (
    <div ref={setNodeRef} className={`common-detail-media-item ${isDragging ? 'dragging' : ''}`} style={style}>
      <div className="common-detail-media-frame" {...attributes} {...listeners}>
        {isVideoUrl(url) ? (
          <video src={url} controls muted preload="metadata" />
        ) : (
          <img src={url} alt={`${title} 상세 ${index + 1}`} />
        )}
      </div>
      <button
        className="common-detail-media-remove"
        type="button"
        aria-label={`${title || '상세 미디어'} 삭제`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          onRemove(index)
        }}
      >
        ×
      </button>
    </div>
  )
}

export default function CommonManager({
  onNavigateAdmin,
  pageLabel = 'COM M ON',
  introSectionTitle = `About ${pageLabel}`,
  projectSectionTitle = 'Items',
  defaultSettings = DEFAULT_COMMON_PAGE_SETTINGS,
  getSettings = getCommonPageSettings,
  saveSettings = saveCommonPageSettings,
  storageDirectory = 'common',
  newProjectIdPrefix = 'common',
}) {
  const [settings, setSettings] = useState(defaultSettings)
  const [activeProjectId, setActiveProjectId] = useState(defaultSettings.projects[0]?.id || '')
  const [activeTab, setActiveTab] = useState('projects')
  const [searchTerm, setSearchTerm] = useState('')
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [projectDraft, setProjectDraft] = useState(null)
  const [projectDraftDeletedUrls, setProjectDraftDeletedUrls] = useState([])
  const [pendingDeletedMediaUrls, setPendingDeletedMediaUrls] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  const activeProject = settings.projects.find((project) => project.id === activeProjectId) || settings.projects[0]
  const editingProject = projectDraft || activeProject
  const filteredProjects = settings.projects.filter((project) => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return true

    return [project.title, project.thumbnailCaption]
      .some((value) => String(value || '').toLowerCase().includes(keyword))
  })
  const projectSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    let mounted = true

    const loadSettings = async () => {
      try {
        const nextSettings = await getSettings()
        if (!mounted) return
        setSettings(nextSettings)
        setActiveProjectId(nextSettings.projects[0]?.id || '')
      } catch (error) {
        console.error(`${pageLabel} 설정 불러오기 실패:`, error)
        if (mounted) setStatusMessage(`${pageLabel} 설정을 불러오지 못했습니다.`)
      }
    }

    loadSettings()

    return () => {
      mounted = false
    }
  }, [getSettings, pageLabel])

  const updateIntro = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      intro: {
        ...prev.intro,
        [field]: value,
      },
    }))
  }

  const updateProjectDraft = (field, value) => {
    setProjectDraft((prev) => (prev ? {
      ...prev,
      [field]: value,
    } : prev))
  }

  const updateProjectCaption = (value) => {
    setProjectDraft((prev) => (prev ? {
      ...prev,
      title: value,
      thumbnailCaption: value,
    } : prev))
  }

  const validateFile = (file, allowedTypes) => {
    if (!allowedTypes.includes(file.type)) {
      return 'JPG, PNG, WEBP 이미지 또는 MP4 영상만 업로드할 수 있습니다.'
    }

    const maxSize = file.type === 'video/mp4' ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE
    if (file.size > maxSize) {
      return file.type === 'video/mp4'
        ? '영상은 최대 100MB까지 업로드할 수 있습니다.'
        : '이미지는 최대 2MB까지 업로드할 수 있습니다.'
    }

    return ''
  }

  const uploadAndSave = async (file, directory) => {
    const result = await uploadFileToR2(file, directory)
    return result.url
  }

  const deleteMediaUrlsFromR2 = async (urls) => {
    const uniqueUrls = [...new Set(urls.filter(Boolean))]
    if (!uniqueUrls.length) return

    await Promise.all(uniqueUrls.map((url) => deleteFileUrlFromR2(url)))
  }

  const handleLogoUpload = async (file) => {
    if (!file) return
    const validationMessage = validateFile(file, IMAGE_TYPES)
    if (validationMessage) {
      setStatusMessage(validationMessage)
      return
    }

    try {
      setUploadingField('logo')
      const logoUrl = await uploadAndSave(file, `${storageDirectory}/intro`)
      const nextSettings = {
        ...settings,
        intro: { ...settings.intro, logoUrl },
      }
      const savedSettings = await saveSettings(nextSettings)
      setSettings(savedSettings)
      setStatusMessage('')
    } catch (error) {
      console.error(`${pageLabel} 로고 업로드 실패:`, error)
      setStatusMessage(`업로드에 실패했습니다: ${error.message}`)
    } finally {
      setUploadingField('')
    }
  }

  const handleThumbnailUpload = async (file) => {
    if (!file || !editingProject) return
    const validationMessage = validateFile(file, IMAGE_TYPES)
    if (validationMessage) {
      setStatusMessage(validationMessage)
      return
    }

    try {
      setUploadingField('thumbnail')
      const thumbnailUrl = await uploadAndSave(file, `${storageDirectory}/${editingProject.id}`)
      updateProjectDraft('thumbnailUrl', thumbnailUrl)
      setStatusMessage('')
    } catch (error) {
      console.error(`${pageLabel} 썸네일 업로드 실패:`, error)
      setStatusMessage(`업로드에 실패했습니다: ${error.message}`)
    } finally {
      setUploadingField('')
    }
  }

  const handleDetailMediaUpload = async (files) => {
    if (!files?.length || !editingProject) return

    const fileList = Array.from(files)
    const validationMessage = fileList.map((file) => validateFile(file, DETAIL_TYPES)).find(Boolean)
    if (validationMessage) {
      setStatusMessage(validationMessage)
      return
    }

    try {
      setUploadingField('detailMedia')
      const urls = await Promise.all(fileList.map((file) => uploadAndSave(file, `${storageDirectory}/${editingProject.id}/detail`)))
      updateProjectDraft('detailMedia', [...editingProject.detailMedia, ...urls])
      setStatusMessage('')
    } catch (error) {
      console.error(`${pageLabel} 상세 미디어 업로드 실패:`, error)
      setStatusMessage(`업로드에 실패했습니다: ${error.message}`)
    } finally {
      setUploadingField('')
    }
  }

  const removeDetailMedia = (mediaIndex) => {
    if (!editingProject) return
    const removedUrl = editingProject.detailMedia[mediaIndex]
    if (removedUrl) {
      setProjectDraftDeletedUrls((prev) => [...prev, removedUrl])
    }
    updateProjectDraft('detailMedia', editingProject.detailMedia.filter((_, index) => index !== mediaIndex))
  }

  const handleDetailMediaDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id || !editingProject) return

    const oldIndex = Number(String(active.id).replace('detail-media-', ''))
    const newIndex = Number(String(over.id).replace('detail-media-', ''))
    if (Number.isNaN(oldIndex) || Number.isNaN(newIndex)) return

    updateProjectDraft('detailMedia', arrayMove(editingProject.detailMedia, oldIndex, newIndex))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const savedSettings = await saveSettings(settings)
      setSettings(savedSettings)
      try {
        await deleteMediaUrlsFromR2(pendingDeletedMediaUrls)
      } catch (deleteError) {
        console.error(`${pageLabel} R2 파일 삭제 실패:`, deleteError)
        setStatusMessage(`저장은 완료됐지만 R2 파일 삭제에 실패했습니다: ${deleteError.message}`)
        return
      }
      setPendingDeletedMediaUrls([])
      setStatusMessage('')
    } catch (error) {
      console.error(`${pageLabel} 설정 저장 실패:`, error)
      setStatusMessage(`저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAddProject = () => {
    const nextProject = {
      id: `${newProjectIdPrefix}-${Date.now()}`,
      title: '새 프로젝트',
      thumbnailUrl: '',
      thumbnailCaption: '새 프로젝트',
      detailMedia: [],
    }

    setActiveProjectId(nextProject.id)
    setProjectDraft(nextProject)
    setIsProjectModalOpen(true)
  }

  const handleDeleteProject = (projectId) => {
    setSettings((prev) => {
      const projectToDelete = prev.projects.find((project) => project.id === projectId)
      const nextProjects = prev.projects.filter((project) => project.id !== projectId)
      if (projectId === activeProjectId) {
        setActiveProjectId(nextProjects[0]?.id || '')
        setIsProjectModalOpen(false)
        setProjectDraft(null)
        setProjectDraftDeletedUrls([])
      }

      if (projectToDelete) {
        setPendingDeletedMediaUrls((prevUrls) => [
          ...prevUrls,
          projectToDelete.thumbnailUrl,
          ...projectToDelete.detailMedia,
        ].filter(Boolean))
      }

      return {
        ...prev,
        projects: nextProjects,
      }
    })
  }

  const handleProjectDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSettings((prev) => {
      const oldIndex = prev.projects.findIndex((project) => project.id === active.id)
      const newIndex = prev.projects.findIndex((project) => project.id === over.id)

      if (oldIndex < 0 || newIndex < 0) return prev

      return {
        ...prev,
        projects: arrayMove(prev.projects, oldIndex, newIndex),
      }
    })
  }

  const openProjectModal = (projectId) => {
    const project = settings.projects.find((item) => item.id === projectId)
    if (!project) return

    setActiveProjectId(projectId)
    setProjectDraft({
      ...project,
      detailMedia: [...project.detailMedia],
    })
    setProjectDraftDeletedUrls([])
    setIsProjectModalOpen(true)
  }

  const closeProjectModal = () => {
    const shouldClose = window.confirm('저장되지 않은 내용은 유실됩니다. 닫으시겠습니까?')
    if (!shouldClose) return

    setProjectDraft(null)
    setProjectDraftDeletedUrls([])
    setIsProjectModalOpen(false)
  }

  const handleProjectModalSave = async () => {
    if (!projectDraft) return

    const hasExistingProject = settings.projects.some((project) => project.id === projectDraft.id)
    const nextSettings = {
      ...settings,
      projects: hasExistingProject
        ? settings.projects.map((project) => (project.id === projectDraft.id ? projectDraft : project))
        : [projectDraft, ...settings.projects],
    }

    try {
      setSaving(true)
      const savedSettings = await saveSettings(nextSettings)
      setSettings(savedSettings)
      let deleteFailed = false
      try {
        await deleteMediaUrlsFromR2(projectDraftDeletedUrls)
      } catch (deleteError) {
        deleteFailed = true
        console.error(`${pageLabel} 프로젝트 R2 파일 삭제 실패:`, deleteError)
        setStatusMessage(`저장은 완료됐지만 R2 파일 삭제에 실패했습니다: ${deleteError.message}`)
      }
      setActiveProjectId(projectDraft.id)
      setProjectDraft(null)
      setProjectDraftDeletedUrls([])
      setIsProjectModalOpen(false)
      if (!deleteFailed) setStatusMessage('')
    } catch (error) {
      console.error(`${pageLabel} 프로젝트 저장 실패:`, error)
      setStatusMessage(`저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout onNavigateAdmin={onNavigateAdmin}>
      <main className="admin-page common-admin-page">
        <div className="common-admin-content">
          <div className="common-admin-topbar">
            <h2 className="common-admin-page-title">{pageLabel} 관리</h2>
            <div className="admin-header-actions">
              <button className="admin-button primary" type="button" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          <div className="common-admin-tabs" aria-label={`${pageLabel} 관리 탭`}>
            <button
              className={`common-admin-tab ${activeTab === 'intro' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveTab('intro')}
            >
              {`About ${pageLabel}`}
            </button>
            <button
              className={`common-admin-tab ${activeTab === 'projects' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveTab('projects')}
            >
              Items
            </button>
          </div>

          {statusMessage && <p className="admin-status-message">{statusMessage}</p>}

          <div className="common-admin-layout">
            <section className="common-admin-main">
              {activeTab === 'intro' ? (
                <>
                  <div className="admin-section-header">
                    <h2>{introSectionTitle}</h2>
                  </div>

                  <div className="admin-form-row">
                    <label>로고</label>
                    {settings.intro.logoUrl ? (
                      <div className="common-logo-preview">
                        <img src={settings.intro.logoUrl} alt={`${pageLabel} 로고`} />
                      </div>
                    ) : null}
                    <label className="admin-file-button">
                      {uploadingField === 'logo' ? '업로드 중...' : '로고 업로드'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={Boolean(uploadingField)}
                        onChange={(event) => handleLogoUpload(event.target.files?.[0])}
                      />
                    </label>
                    <p className="admin-caption">JPG, PNG, WEBP 파일만 업로드 가능, 최대 2MB</p>
                  </div>

                  <div className="admin-form-row">
                    <label htmlFor="commonSiteUrl">URL</label>
                    <input
                      id="commonSiteUrl"
                      value={settings.intro.siteUrl}
                      onChange={(event) => updateIntro('siteUrl', event.target.value)}
                    />
                  </div>

                  <div className="admin-form-row">
                    <label htmlFor="commonIntroBody">소개글<span className="admin-caption" style={{ marginLeft: '10px' }}>엔터로 줄바꿈 / --로 리스트 / *텍스트*로 강조</span></label>
                    <textarea
                      id="commonIntroBody"
                      value={settings.intro.body}
                      onChange={(event) => updateIntro('body', event.target.value)}
                      rows={8}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="common-admin-section-header">
                    <h3>{projectSectionTitle}</h3>
                    <div className="projects-admin-header-buttons">
                      <div className="projects-admin-search-input-group">
                        <input
                          className="projects-admin-search-input"
                          value={searchTerm}
                          placeholder="프로젝트 검색..."
                          onChange={(event) => setSearchTerm(event.target.value)}
                        />
                        {searchTerm ? (
                          <button className="projects-admin-search-clear" type="button" onClick={() => setSearchTerm('')}>
                            ×
                          </button>
                        ) : null}
                      </div>
                      <button className="admin-button primary" type="button" onClick={handleAddProject}>
                        프로젝트 추가
                      </button>
                    </div>
                  </div>

                  <div className="common-project-table">
                    <div className="common-project-table-head">
                      <span>프로젝트</span>
                      <span>관리</span>
                    </div>
                    <DndContext sensors={projectSensors} collisionDetection={closestCenter} onDragEnd={handleProjectDragEnd}>
                      <SortableContext items={filteredProjects.map((project) => project.id)} strategy={verticalListSortingStrategy}>
                        <div className="common-project-table-body">
                          {filteredProjects.map((project) => (
                            <SortableCommonProjectRow
                              key={project.id}
                              project={project}
                              onEdit={openProjectModal}
                              onDelete={handleDeleteProject}
                            />
                          ))}
                          {filteredProjects.length === 0 ? (
                            <div className="admin-empty-state">
                              <p>검색 결과가 없습니다.</p>
                            </div>
                          ) : null}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>

        {isProjectModalOpen && editingProject ? (
          <div className="admin-modal-overlay" role="presentation">
            <div className="admin-modal-content common-project-modal" role="dialog" aria-modal="true" aria-label={`${editingProject.title} 수정`}>
              <div className="admin-modal-header">
                <h2>프로젝트 수정</h2>
                <div className="admin-header-actions">
                  <button className="admin-button secondary" type="button" onClick={closeProjectModal}>
                    닫기
                  </button>
                  <button className="admin-button primary" type="button" onClick={handleProjectModalSave} disabled={saving}>
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>

              <div className="admin-modal-body">
                <div className="admin-form-row">
                  <label htmlFor="commonProjectTitle">썸네일 캡션<span className="admin-caption" style={{ marginLeft: '10px' }}>엔터로 줄바꿈</span></label>
                  <textarea
                    id="commonProjectTitle"
                    value={editingProject.title}
                    onChange={(event) => updateProjectCaption(event.target.value)}
                    rows={3}
                  />
                </div>

                <div className="admin-form-row">
                  <label>썸네일</label>
                                    <label className="admin-file-button">
                    {uploadingField === 'thumbnail' ? '업로드 중...' : '썸네일 업로드'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={Boolean(uploadingField)}
                      onChange={(event) => handleThumbnailUpload(event.target.files?.[0])}
                    />
                  </label>
                  <p className="admin-caption">JPG, PNG, WEBP 파일, 최대 2MB</p>
                  {editingProject.thumbnailUrl ? (
                    <div className="common-thumbnail-preview">
                      {isVideoUrl(editingProject.thumbnailUrl) ? (
                        <video src={editingProject.thumbnailUrl} controls muted preload="metadata" />
                      ) : (
                        <img src={editingProject.thumbnailUrl} alt={`${editingProject.title} 썸네일`} />
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="admin-form-row">
                  <label>상세 미디어</label>
                  <label className="admin-file-button">
                    {uploadingField === 'detailMedia' ? '업로드 중...' : '상세 미디어 업로드'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4"
                      multiple
                      disabled={Boolean(uploadingField)}
                      onChange={(event) => handleDetailMediaUpload(event.target.files)}
                    />
                  </label>
                  <p className="admin-caption">이미지: JPG, PNG, WEBP 파일, 최대 2MB<br/>영상: MP4 파일, 최대 100MB<br/><br/>드래그 앤 드롭으로 순서 변경</p>

                  <DndContext sensors={projectSensors} collisionDetection={closestCenter} onDragEnd={handleDetailMediaDragEnd}>
                    <SortableContext
                      items={editingProject.detailMedia.map((_, index) => `detail-media-${index}`)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="common-detail-media-list">
                        {editingProject.detailMedia.map((url, index) => (
                          <SortableDetailMediaItem
                            key={`${url}-${index}`}
                            id={`detail-media-${index}`}
                            url={url}
                            title={editingProject.title}
                            index={index}
                            onRemove={removeDetailMedia}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </AdminLayout>
  )
}
