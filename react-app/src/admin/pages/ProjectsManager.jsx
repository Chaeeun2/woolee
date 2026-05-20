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
import { DEFAULT_PROJECTS_PAGE_SETTINGS } from '../projectsPageSettings'
import { getProjectsPageSettings, saveProjectsPageSettings } from '../../services/projectsPageService'
import { deleteFileUrlFromR2, uploadFileToR2 } from '../../services/r2UploadService'
import './CommonManager.css'
import './ProjectsManager.css'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const DETAIL_TYPES = [...IMAGE_TYPES, 'video/mp4']
const IMAGE_MAX_SIZE = 2 * 1024 * 1024
const VIDEO_MAX_SIZE = 100 * 1024 * 1024
const SECTION_WITH_TYPE_MANAGEMENT = 'projects-editorial-platforms'
const isVideoUrl = (url) => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url || '')

function SortableProjectItemRow({ item, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: item.id })
  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition: 'none',
  }

  return (
    <div ref={setNodeRef} className={`common-project-row ${isDragging ? 'dragging' : ''}`} style={style} {...attributes}>
      <div className="common-project-title-cell">
        <button className="common-project-drag-handle" type="button" aria-label={`${item.label} 순서 변경`} {...listeners}>
          ⠿
        </button>
        <span className="common-project-thumb">
          {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" /> : null}
        </span>
        <div className="projects-admin-item-meta">
          <strong>{item.label || '제목 없음'}</strong>
        </div>
      </div>
      <div className="common-project-actions">
        <button className="admin-button secondary" type="button" onClick={() => onEdit(item.id)}>
          수정
        </button>
        <button className="admin-button danger" type="button" onClick={() => onDelete(item.id)}>
          삭제
        </button>
      </div>
    </div>
  )
}

function SortableMediaItem({ id, url, title, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id })
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

function SortableTypeItem({ type, isEditing, editingValue, onEdit, onDelete, onEditingChange, onEditingSubmit, onEditingCancel }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: type })
  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition: 'none',
  }

  return (
    <div ref={setNodeRef} className={`projects-admin-type-item ${isDragging ? 'dragging' : ''}`} style={style} {...attributes}>
      <button className="projects-admin-type-drag-handle" type="button" aria-label={`${type} 순서 변경`} {...listeners}>
        ⠿
      </button>
      {isEditing ? (
        <input
          className="projects-admin-type-input"
          value={editingValue}
          autoFocus
          onChange={(event) => onEditingChange(event.target.value)}
          onBlur={onEditingSubmit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onEditingSubmit()
            if (event.key === 'Escape') onEditingCancel()
          }}
        />
      ) : (
        <>
          <span className="projects-admin-type-name">{type}</span>
          <div className="projects-admin-type-actions">
            <button className="admin-button secondary" type="button" onClick={() => onEdit(type)}>
              수정
            </button>
            <button className="admin-button danger" type="button" onClick={() => onDelete(type)}>
              삭제
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function ProjectsManager({ onNavigateAdmin }) {
  const [settings, setSettings] = useState(DEFAULT_PROJECTS_PAGE_SETTINGS)
  const [activeSectionId, setActiveSectionId] = useState(DEFAULT_PROJECTS_PAGE_SETTINGS.sections[0]?.id || '')
  const [itemDraft, setItemDraft] = useState(null)
  const [deletedDraftUrls, setDeletedDraftUrls] = useState([])
  const [pendingDeletedUrls, setPendingDeletedUrls] = useState([])
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false)
  const [typeDraftOptions, setTypeDraftOptions] = useState([])
  const [newType, setNewType] = useState('')
  const [editingType, setEditingType] = useState(null)
  const [editingTypeValue, setEditingTypeValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  const activeSection = settings.sections.find((section) => section.id === activeSectionId) || settings.sections[0]
  const hasTypeManagement = activeSection?.id === SECTION_WITH_TYPE_MANAGEMENT
  const currentTypeOptions = activeSection?.typeOptions || []
  const visibleTypeOptions = isTypeModalOpen ? typeDraftOptions : currentTypeOptions
  const filteredItems = (activeSection?.items || []).filter((item) => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return true

    return [item.label, item.category, item.type, item.detailCaption]
      .some((value) => String(value || '').toLowerCase().includes(keyword))
  })
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    let mounted = true

    const loadSettings = async () => {
      try {
        const nextSettings = await getProjectsPageSettings()
        if (!mounted) return
        setSettings(nextSettings)
        setActiveSectionId(nextSettings.sections[0]?.id || '')
      } catch (error) {
        console.error('Projects 설정 불러오기 실패:', error)
        if (mounted) setStatusMessage('Projects 설정을 불러오지 못했습니다.')
      }
    }

    loadSettings()

    return () => {
      mounted = false
    }
  }, [])

  const updateIntro = (body) => {
    setSettings((prev) => ({
      ...prev,
      intro: { ...prev.intro, body },
    }))
  }

  const updateActiveSection = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (
        section.id === activeSectionId ? { ...section, [field]: value } : section
      )),
    }))
  }

  const updateSectionById = (sectionId, field, value) => {
    setSettings((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => (
        section.id === sectionId ? { ...section, [field]: value } : section
      )),
    }))
  }

  const updateActiveSectionItems = (items) => {
    updateActiveSection('items', items)
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

  const deleteUrlsFromR2 = async (urls) => {
    const uniqueUrls = [...new Set(urls.filter(Boolean))]
    if (!uniqueUrls.length) return
    await Promise.all(uniqueUrls.map((url) => deleteFileUrlFromR2(url)))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const savedSettings = await saveProjectsPageSettings(settings)
      setSettings(savedSettings)
      try {
        await deleteUrlsFromR2(pendingDeletedUrls)
      } catch (deleteError) {
        console.error('Projects R2 파일 삭제 실패:', deleteError)
        setStatusMessage(`저장은 완료됐지만 R2 파일 삭제에 실패했습니다: ${deleteError.message}`)
        return
      }
      setPendingDeletedUrls([])
      setStatusMessage('')
    } catch (error) {
      console.error('Projects 설정 저장 실패:', error)
      setStatusMessage(`저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleItemDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id || !activeSection) return

    const oldIndex = activeSection.items.findIndex((item) => item.id === active.id)
    const newIndex = activeSection.items.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    updateActiveSectionItems(arrayMove(activeSection.items, oldIndex, newIndex))
  }

  const openItemModal = (itemId) => {
    const item = activeSection?.items.find((entry) => entry.id === itemId)
    if (!item) return
    setItemDraft({ ...item, detailMedia: [...item.detailMedia] })
    setDeletedDraftUrls([])
    setIsItemModalOpen(true)
  }

  const addItem = () => {
    const nextItem = {
      id: `projects-item-${Date.now()}`,
      category: '',
      type: hasTypeManagement ? currentTypeOptions[0] || '' : '',
      label: '새 프로젝트',
      thumbnailUrl: '',
      detailCaption: '새 프로젝트',
      detailMedia: [],
    }
    setItemDraft(nextItem)
    setDeletedDraftUrls([])
    setIsItemModalOpen(true)
  }

  const deleteItem = (itemId) => {
    if (!activeSection) return
    const item = activeSection.items.find((entry) => entry.id === itemId)
    if (!item) return

    updateActiveSectionItems(activeSection.items.filter((entry) => entry.id !== itemId))
    setPendingDeletedUrls((prev) => [...prev, item.thumbnailUrl, ...item.detailMedia].filter(Boolean))
  }

  const closeItemModal = () => {
    const shouldClose = window.confirm('저장되지 않은 내용은 유실됩니다. 닫으시겠습니까?')
    if (!shouldClose) return
    setItemDraft(null)
    setDeletedDraftUrls([])
    setIsItemModalOpen(false)
  }

  const saveItemModal = async () => {
    if (!itemDraft || !activeSection) return

    const hasExistingItem = activeSection.items.some((item) => item.id === itemDraft.id)
    const nextItems = hasExistingItem
      ? activeSection.items.map((item) => (item.id === itemDraft.id ? itemDraft : item))
      : [itemDraft, ...activeSection.items]
    const nextSettings = {
      ...settings,
      sections: settings.sections.map((section) => (
        section.id === activeSection.id ? { ...section, items: nextItems } : section
      )),
    }

    try {
      setSaving(true)
      const savedSettings = await saveProjectsPageSettings(nextSettings)
      setSettings(savedSettings)
      let deleteFailed = false
      try {
        await deleteUrlsFromR2(deletedDraftUrls)
      } catch (deleteError) {
        deleteFailed = true
        console.error('Projects 아이템 R2 파일 삭제 실패:', deleteError)
        setStatusMessage(`저장은 완료됐지만 R2 파일 삭제에 실패했습니다: ${deleteError.message}`)
      }
      setItemDraft(null)
      setDeletedDraftUrls([])
      setIsItemModalOpen(false)
      if (!deleteFailed) setStatusMessage('')
    } catch (error) {
      console.error('Projects 아이템 저장 실패:', error)
      setStatusMessage(`저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const updateItemDraft = (field, value) => {
    setItemDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleThumbnailUpload = async (file) => {
    if (!file || !itemDraft || !activeSection) return
    const validationMessage = validateFile(file, IMAGE_TYPES)
    if (validationMessage) {
      setStatusMessage(validationMessage)
      return
    }

    try {
      setUploadingField('thumbnail')
      const thumbnailUrl = await uploadAndSave(file, `projects/${activeSection.id}/${itemDraft.id}`)
      updateItemDraft('thumbnailUrl', thumbnailUrl)
      setStatusMessage('')
    } catch (error) {
      console.error('Projects 썸네일 업로드 실패:', error)
      setStatusMessage(`업로드에 실패했습니다: ${error.message}`)
    } finally {
      setUploadingField('')
    }
  }

  const handleDetailMediaUpload = async (files) => {
    if (!files?.length || !itemDraft || !activeSection) return
    const fileList = Array.from(files)
    const validationMessage = fileList.map((file) => validateFile(file, DETAIL_TYPES)).find(Boolean)
    if (validationMessage) {
      setStatusMessage(validationMessage)
      return
    }

    try {
      setUploadingField('detailMedia')
      const urls = await Promise.all(fileList.map((file) => uploadAndSave(file, `projects/${activeSection.id}/${itemDraft.id}/detail`)))
      updateItemDraft('detailMedia', [...itemDraft.detailMedia, ...urls])
      setStatusMessage('')
    } catch (error) {
      console.error('Projects 상세 미디어 업로드 실패:', error)
      setStatusMessage(`업로드에 실패했습니다: ${error.message}`)
    } finally {
      setUploadingField('')
    }
  }

  const removeDetailMedia = (mediaIndex) => {
    if (!itemDraft) return
    const removedUrl = itemDraft.detailMedia[mediaIndex]
    if (removedUrl) setDeletedDraftUrls((prev) => [...prev, removedUrl])
    updateItemDraft('detailMedia', itemDraft.detailMedia.filter((_, index) => index !== mediaIndex))
  }

  const handleMediaDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id || !itemDraft) return
    const oldIndex = Number(String(active.id).replace('detail-media-', ''))
    const newIndex = Number(String(over.id).replace('detail-media-', ''))
    if (Number.isNaN(oldIndex) || Number.isNaN(newIndex)) return
    updateItemDraft('detailMedia', arrayMove(itemDraft.detailMedia, oldIndex, newIndex))
  }

  const updateTypeOptions = (typeOptions) => {
    setTypeDraftOptions(typeOptions)
  }

  const openTypeModal = () => {
    setTypeDraftOptions(currentTypeOptions)
    setNewType('')
    setEditingType(null)
    setEditingTypeValue('')
    setIsTypeModalOpen(true)
  }

  const closeTypeModal = () => {
    const shouldClose = window.confirm('저장되지 않은 내용은 유실됩니다. 닫으시겠습니까?')
    if (!shouldClose) return

    setTypeDraftOptions([])
    setNewType('')
    setEditingType(null)
    setEditingTypeValue('')
    setIsTypeModalOpen(false)
  }

  const saveTypeModal = async () => {
    if (!activeSection) return

    const validTypeSet = new Set(typeDraftOptions)
    const nextSections = settings.sections.map((section) => (
      section.id === activeSection.id
        ? {
            ...section,
            typeOptions: typeDraftOptions,
            items: section.items.map((item) => (
              item.type && !validTypeSet.has(item.type) ? { ...item, type: '' } : item
            )),
          }
        : section
    ))
    const nextSettings = {
      ...settings,
      sections: nextSections,
    }

    try {
      setSaving(true)
      const savedSettings = await saveProjectsPageSettings(nextSettings)
      setSettings(savedSettings)
      setTypeDraftOptions([])
      setNewType('')
      setEditingType(null)
      setEditingTypeValue('')
      setIsTypeModalOpen(false)
      setStatusMessage('')
    } catch (error) {
      console.error('Projects Type 저장 실패:', error)
      setStatusMessage(`저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const addType = () => {
    const nextType = newType.trim()
    if (!nextType || typeDraftOptions.includes(nextType)) {
      alert('이미 존재하는 타입이거나 빈 값입니다.')
      return
    }

    updateTypeOptions([nextType, ...typeDraftOptions])
    setNewType('')
  }

  const submitTypeEdit = () => {
    if (!editingType) return
    const nextType = editingTypeValue.trim()

    if (!nextType || nextType === editingType) {
      setEditingType(null)
      setEditingTypeValue('')
      return
    }

    if (typeDraftOptions.includes(nextType)) {
      alert('이미 존재하는 타입입니다.')
      return
    }

    updateTypeOptions(typeDraftOptions.map((type) => (type === editingType ? nextType : type)))
    setEditingType(null)
    setEditingTypeValue('')
  }

  const deleteType = (typeToDelete) => {
    const isInUse = activeSection.items.some((item) => item.type === typeToDelete)
    if (isInUse) {
      alert(`"${typeToDelete}"은 현재 사용 중인 프로젝트가 있어 삭제할 수 없습니다.`)
      return
    }

    updateTypeOptions(typeDraftOptions.filter((type) => type !== typeToDelete))
  }

  const handleTypeDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = typeDraftOptions.findIndex((type) => type === active.id)
    const newIndex = typeDraftOptions.findIndex((type) => type === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    updateTypeOptions(arrayMove(typeDraftOptions, oldIndex, newIndex))
  }

  return (
    <AdminLayout onNavigateAdmin={onNavigateAdmin}>
      <main className="admin-page common-admin-page">
        <div className="common-admin-content">
          <div className="common-admin-topbar">
            <h2 className="common-admin-page-title">Projects 관리</h2>
            <div className="admin-header-actions">
              <button className="admin-button primary" type="button" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          <div className="common-admin-tabs" aria-label="Projects 관리 탭">
            <button
              className={`common-admin-tab ${activeSectionId === 'intro' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveSectionId('intro')}
            >
              About Projects
            </button>
            {settings.sections.map((section) => (
              <button
                className={`common-admin-tab ${activeSectionId === section.id ? 'active' : ''}`}
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>

          {statusMessage && <p className="admin-status-message">{statusMessage}</p>}

          {activeSectionId === 'intro' ? (
            <div className="common-admin-layout projects-admin-intro-layout">
              <section className="common-admin-main">
                  <div className="admin-section-header">
                    <h2>About Projects</h2>
                  </div>
                  <div className="admin-form-row">
                    <label htmlFor="projectsIntroBody">소개글<span className="admin-caption" style={{ marginLeft: '10px' }}>엔터로 줄바꿈 / --로 리스트 / *텍스트*로 강조</span></label>
                    <textarea
                      id="projectsIntroBody"
                      value={settings.intro.body}
                      onChange={(event) => updateIntro(event.target.value)}
                      rows={8}
                    />
                  </div>
              </section>

              <section className="common-admin-main">
                  <div className="admin-section-header">
                    <h2>카테고리별 설명</h2>
                  </div>
                  <div className="projects-admin-description-list">
                    {settings.sections.map((section) => (
                      <div className="admin-form-row" key={section.id}>
                        <label htmlFor={`${section.id}-description`}>{section.label}</label>
                        <textarea
                          id={`${section.id}-description`}
                          value={section.descriptionContent}
                          onChange={(event) => updateSectionById(section.id, 'descriptionContent', event.target.value)}
                          rows={4}
                        />
                      </div>
                    ))}
                  </div>
              </section>
            </div>
          ) : (
          <div className="common-admin-layout">
            <section className="common-admin-main">
              {activeSection ? (
                <>
                  <div className="common-admin-section-header">
                    <h3>{activeSection.label}</h3>
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
                      {hasTypeManagement ? (
                        <button className="admin-button secondary" type="button" onClick={openTypeModal}>
                          Type 관리
                        </button>
                      ) : null}
                      <button className="admin-button primary" type="button" onClick={addItem}>
                        프로젝트 추가
                      </button>
                    </div>
                  </div>

                  <div className="common-project-table">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
                      <SortableContext items={filteredItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                        <div className="common-project-table-body">
                          {filteredItems.map((item) => (
                            <SortableProjectItemRow
                              key={item.id}
                              item={item}
                              onEdit={openItemModal}
                              onDelete={deleteItem}
                            />
                          ))}
                          {filteredItems.length === 0 ? (
                            <div className="admin-empty-state">
                              <p>검색 결과가 없습니다.</p>
                            </div>
                          ) : null}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </>
              ) : null}
            </section>
          </div>
          )}
        </div>

        {isItemModalOpen && itemDraft ? (
          <div className="admin-modal-overlay" role="presentation">
            <div className="admin-modal-content common-project-modal" role="dialog" aria-modal="true" aria-label={`${itemDraft.label} 수정`}>
              <div className="admin-modal-header">
                <h2>프로젝트 수정</h2>
                <div className="admin-header-actions">
                  <button className="admin-button secondary" type="button" onClick={closeItemModal}>
                    닫기
                  </button>
                  <button className="admin-button primary" type="button" onClick={saveItemModal} disabled={saving}>
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>

              <div className="admin-modal-body">
                <div className="projects-admin-modal-grid">
                  <div className="projects-admin-field-group">
                                        {hasTypeManagement ? (
                      <div className="admin-form-row">
                        <label htmlFor="projectItemType">카테고리</label>
                        <select id="projectItemType" value={itemDraft.type} onChange={(event) => updateItemDraft('type', event.target.value)}>
                          <option value="">타입 선택</option>
                          {currentTypeOptions.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <div className="admin-form-row">
                      <label htmlFor="projectItemLabel">썸네일 캡션<span className="admin-caption" style={{ marginLeft: '10px' }}>엔터로 줄바꿈</span></label>
                      <textarea id="projectItemLabel" value={itemDraft.label} onChange={(event) => updateItemDraft('label', event.target.value)} rows={3} />
                    </div>
                  </div>

                  <div className="projects-admin-field-group">
                    <div className="admin-form-row">
                      <label htmlFor="projectItemCategory">포지션<span className="admin-caption" style={{ marginLeft: '10px' }}>상세페이지 좌측 상단 텍스트</span></label>
                      <input id="projectItemCategory" value={itemDraft.category} onChange={(event) => updateItemDraft('category', event.target.value)} />
                    </div>
                    <div className="admin-form-row">
                      <label htmlFor="projectItemDetailCaption">상세페이지 캡션<span className="admin-caption" style={{ marginLeft: '10px' }}>상세페이지 우측 상단 텍스트 / 엔터로 줄바꿈</span></label>
                      <textarea id="projectItemDetailCaption" value={itemDraft.detailCaption} onChange={(event) => updateItemDraft('detailCaption', event.target.value)} rows={4} />
                    </div>
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
                    {itemDraft.thumbnailUrl ? (
                      <div className="common-thumbnail-preview">
                        {isVideoUrl(itemDraft.thumbnailUrl) ? (
                          <video src={itemDraft.thumbnailUrl} controls muted preload="metadata" />
                        ) : (
                          <img src={itemDraft.thumbnailUrl} alt={`${itemDraft.label} 썸네일`} />
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="admin-form-row">
                  <label>상세이미지/영상</label>
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

                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMediaDragEnd}>
                    <SortableContext items={itemDraft.detailMedia.map((_, index) => `detail-media-${index}`)} strategy={rectSortingStrategy}>
                      <div className="common-detail-media-list">
                        {itemDraft.detailMedia.map((url, index) => (
                          <SortableMediaItem
                            key={`${url}-${index}`}
                            id={`detail-media-${index}`}
                            url={url}
                            title={itemDraft.label}
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

        {isTypeModalOpen && activeSection && hasTypeManagement ? (
          <div className="admin-modal-overlay" role="presentation">
            <div className="admin-modal-content projects-admin-type-modal" role="dialog" aria-modal="true" aria-label={`${activeSection.label} Type 관리`} onClick={(event) => event.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>{activeSection.label} 카테고리 관리</h2>
                <div className="admin-header-actions">
                  <button className="admin-button secondary" type="button" onClick={closeTypeModal}>
                    닫기
                  </button>
                  <button className="admin-button primary" type="button" onClick={saveTypeModal} disabled={saving}>
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-row">
                  <label htmlFor="newProjectType">새 카테고리 추가</label>
                  <div className="projects-admin-type-add">
                    <input
                      id="newProjectType"
                      value={newType}
                      placeholder="새 카테고리명을 입력하세요"
                      onChange={(event) => setNewType(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') addType()
                      }}
                    />
                    <button className="admin-button primary" type="button" onClick={addType}>
                      추가
                    </button>
                  </div>
                </div>

                <div className="admin-form-row">
                  <label>카테고리 목록</label>
                  {visibleTypeOptions.length === 0 ? (
                    <p className="admin-caption">등록된 카테고리가 없습니다.</p>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTypeDragEnd}>
                      <SortableContext items={visibleTypeOptions} strategy={verticalListSortingStrategy}>
                        <div className="projects-admin-type-list">
                          {visibleTypeOptions.map((type) => (
                            <SortableTypeItem
                              key={type}
                              type={type}
                              isEditing={editingType === type}
                              editingValue={editingTypeValue}
                              onEdit={(nextEditingType) => {
                                setEditingType(nextEditingType)
                                setEditingTypeValue(nextEditingType)
                              }}
                              onDelete={deleteType}
                              onEditingChange={setEditingTypeValue}
                              onEditingSubmit={submitTypeEdit}
                              onEditingCancel={() => {
                                setEditingType(null)
                                setEditingTypeValue('')
                              }}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </AdminLayout>
  )
}
