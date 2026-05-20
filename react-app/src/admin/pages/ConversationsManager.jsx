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
import { DEFAULT_CONVERSATIONS_PAGE_SETTINGS } from '../conversationsPageSettings'
import { getConversationsPageSettings, saveConversationsPageSettings } from '../../services/conversationsPageService'
import { deleteFileUrlFromR2, uploadFileToR2 } from '../../services/r2UploadService'
import './CommonManager.css'
import './ProjectsManager.css'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const DETAIL_TYPES = [...IMAGE_TYPES, 'video/mp4']
const IMAGE_MAX_SIZE = 2 * 1024 * 1024
const VIDEO_MAX_SIZE = 100 * 1024 * 1024
const ACTION_LABELS = {
  external: '외부 링크',
  detail: '상세페이지',
  none: '없음',
}
const isVideoUrl = (url) => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url || '')

function SortableConversationRow({ item, onEdit, onDelete }) {
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

export default function ConversationsManager({ onNavigateAdmin }) {
  const [settings, setSettings] = useState(DEFAULT_CONVERSATIONS_PAGE_SETTINGS)
  const [itemDraft, setItemDraft] = useState(null)
  const [deletedDraftUrls, setDeletedDraftUrls] = useState([])
  const [pendingDeletedUrls, setPendingDeletedUrls] = useState([])
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('items')
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const filteredItems = settings.items.filter((item) => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return true

    return [item.label, item.category, item.action, item.externalUrl, item.detailCaption]
      .some((value) => String(value || '').toLowerCase().includes(keyword))
  })

  useEffect(() => {
    let mounted = true

    const loadSettings = async () => {
      try {
        const nextSettings = await getConversationsPageSettings()
        if (mounted) setSettings(nextSettings)
      } catch (error) {
        console.error('Conversations 설정 불러오기 실패:', error)
        if (mounted) setStatusMessage('Conversations 설정을 불러오지 못했습니다.')
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
      const savedSettings = await saveConversationsPageSettings(settings)
      setSettings(savedSettings)
      try {
        await deleteUrlsFromR2(pendingDeletedUrls)
      } catch (deleteError) {
        console.error('Conversations R2 파일 삭제 실패:', deleteError)
        setStatusMessage(`저장은 완료됐지만 R2 파일 삭제에 실패했습니다: ${deleteError.message}`)
        return
      }
      setPendingDeletedUrls([])
      setStatusMessage('')
    } catch (error) {
      console.error('Conversations 설정 저장 실패:', error)
      setStatusMessage(`저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleItemDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = settings.items.findIndex((item) => item.id === active.id)
    const newIndex = settings.items.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    setSettings((prev) => ({
      ...prev,
      items: arrayMove(prev.items, oldIndex, newIndex),
    }))
  }

  const openItemModal = (itemId) => {
    const item = settings.items.find((entry) => entry.id === itemId)
    if (!item) return
    setItemDraft({ ...item, detailMedia: [...item.detailMedia] })
    setDeletedDraftUrls([])
    setIsItemModalOpen(true)
  }

  const addItem = () => {
    setItemDraft({
      id: `conversation-${Date.now()}`,
      pageId: 'conversation-sample',
      label: '새 Conversation',
      category: '',
      action: 'none',
      externalUrl: '',
      thumbnailUrl: '',
      detailCaption: '새 Conversation',
      detailMedia: [],
    })
    setDeletedDraftUrls([])
    setIsItemModalOpen(true)
  }

  const deleteItem = (itemId) => {
    const item = settings.items.find((entry) => entry.id === itemId)
    if (!item) return

    setSettings((prev) => ({
      ...prev,
      items: prev.items.filter((entry) => entry.id !== itemId),
    }))
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
    if (!itemDraft) return

    const hasExistingItem = settings.items.some((item) => item.id === itemDraft.id)
    const nextItems = hasExistingItem
      ? settings.items.map((item) => (item.id === itemDraft.id ? itemDraft : item))
      : [itemDraft, ...settings.items]
    const nextSettings = { ...settings, items: nextItems }

    try {
      setSaving(true)
      const savedSettings = await saveConversationsPageSettings(nextSettings)
      setSettings(savedSettings)
      let deleteFailed = false
      try {
        await deleteUrlsFromR2(deletedDraftUrls)
      } catch (deleteError) {
        deleteFailed = true
        console.error('Conversations 아이템 R2 파일 삭제 실패:', deleteError)
        setStatusMessage(`저장은 완료됐지만 R2 파일 삭제에 실패했습니다: ${deleteError.message}`)
      }
      setItemDraft(null)
      setDeletedDraftUrls([])
      setIsItemModalOpen(false)
      if (!deleteFailed) setStatusMessage('')
    } catch (error) {
      console.error('Conversations 아이템 저장 실패:', error)
      setStatusMessage(`저장에 실패했습니다: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const updateItemDraft = (field, value) => {
    setItemDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleThumbnailUpload = async (file) => {
    if (!file || !itemDraft) return
    const validationMessage = validateFile(file, IMAGE_TYPES)
    if (validationMessage) {
      setStatusMessage(validationMessage)
      return
    }

    try {
      setUploadingField('thumbnail')
      const thumbnailUrl = await uploadAndSave(file, `conversations/${itemDraft.id}`)
      updateItemDraft('thumbnailUrl', thumbnailUrl)
      setStatusMessage('')
    } catch (error) {
      console.error('Conversations 썸네일 업로드 실패:', error)
      setStatusMessage(`업로드에 실패했습니다: ${error.message}`)
    } finally {
      setUploadingField('')
    }
  }

  const removeThumbnail = () => {
    if (!itemDraft?.thumbnailUrl) return
    setDeletedDraftUrls((prev) => [...prev, itemDraft.thumbnailUrl])
    updateItemDraft('thumbnailUrl', '')
  }

  const handleDetailMediaUpload = async (files) => {
    if (!files?.length || !itemDraft) return
    const fileList = Array.from(files)
    const validationMessage = fileList.map((file) => validateFile(file, DETAIL_TYPES)).find(Boolean)
    if (validationMessage) {
      setStatusMessage(validationMessage)
      return
    }

    try {
      setUploadingField('detailMedia')
      const urls = await Promise.all(fileList.map((file) => uploadAndSave(file, `conversations/${itemDraft.id}/detail`)))
      updateItemDraft('detailMedia', [...itemDraft.detailMedia, ...urls])
      setStatusMessage('')
    } catch (error) {
      console.error('Conversations 상세 미디어 업로드 실패:', error)
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

  return (
    <AdminLayout onNavigateAdmin={onNavigateAdmin}>
      <main className="admin-page common-admin-page">
        <div className="common-admin-content">
          <div className="common-admin-topbar">
            <h2 className="common-admin-page-title">CONVERSATIONS 관리</h2>
            <div className="admin-header-actions">
              <button className="admin-button primary" type="button" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          <div className="common-admin-tabs" aria-label="CONVERSATIONS 관리 탭">
            <button className={`common-admin-tab ${activeTab === 'intro' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('intro')}>
              About Conversations
            </button>
            <button className={`common-admin-tab ${activeTab === 'items' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('items')}>
              Items
            </button>
          </div>

          {statusMessage && <p className="admin-status-message">{statusMessage}</p>}

          <div className="common-admin-layout">
            <section className="common-admin-main">
              {activeTab === 'intro' ? (
                <>
                  <div className="admin-section-header">
                    <h2>About Conversations</h2>
                  </div>
                  <div className="admin-form-row">
                    <label htmlFor="conversationsIntroBody">소개글<span className="admin-caption" style={{ marginLeft: '10px' }}>엔터로 줄바꿈 / --로 리스트 / *텍스트*로 강조</span></label>
                    <textarea id="conversationsIntroBody" value={settings.intro.body} onChange={(event) => updateIntro(event.target.value)} rows={8} />
                  </div>
                </>
              ) : (
                <>
                  <div className="common-admin-section-header">
                    <h3>Items</h3>
                    <div className="projects-admin-header-buttons">
                      <div className="projects-admin-search-input-group">
                        <input className="projects-admin-search-input" value={searchTerm} placeholder="Conversation 검색..." onChange={(event) => setSearchTerm(event.target.value)} />
                        {searchTerm ? (
                          <button className="projects-admin-search-clear" type="button" onClick={() => setSearchTerm('')}>×</button>
                        ) : null}
                      </div>
                      <button className="admin-button primary" type="button" onClick={addItem}>
                        항목 추가
                      </button>
                    </div>
                  </div>

                  <div className="common-project-table">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
                      <SortableContext items={filteredItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                        <div className="common-project-table-body">
                          {filteredItems.map((item) => (
                            <SortableConversationRow key={item.id} item={item} onEdit={openItemModal} onDelete={deleteItem} />
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
              )}
            </section>
          </div>
        </div>

        {isItemModalOpen && itemDraft ? (
          <div className="admin-modal-overlay" role="presentation">
            <div className="admin-modal-content common-project-modal" role="dialog" aria-modal="true" aria-label={`${itemDraft.label} 수정`}>
              <div className="admin-modal-header">
                <h2>Conversation 수정</h2>
                <div className="admin-header-actions">
                  <button className="admin-button secondary" type="button" onClick={closeItemModal}>닫기</button>
                  <button className="admin-button primary" type="button" onClick={saveItemModal} disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
                </div>
              </div>

              <div className="admin-modal-body">
                <div className="projects-admin-modal-grid">
<div className="admin-form-row">
                  <label htmlFor="conversationTitle">클릭 시 이동</label>
                                      <div className="conversations-action-options">
                      {Object.entries(ACTION_LABELS).map(([action, label]) => (
                        <label className={`conversations-action-option ${itemDraft.action === action ? 'is-active' : ''}`} key={action}>
                          <input
                            type="radio"
                            name="conversationAction"
                            value={action}
                            checked={itemDraft.action === action}
                            onChange={(event) => updateItemDraft('action', event.target.value)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
</div>

                  <div className="admin-form-row">
                    <label htmlFor="conversationTitle">타이틀<span className="admin-caption" style={{ marginLeft: '10px' }}>엔터로 줄바꿈</span></label>
                    <textarea id="conversationTitle" value={itemDraft.label} onChange={(event) => updateItemDraft('label', event.target.value)} rows={3} />
                  </div>
                  {itemDraft.action === 'external' ? (
                    <div className="admin-form-row">
                      <label htmlFor="conversationExternalUrl">외부 링크 URL</label>
                      <input id="conversationExternalUrl" type="url" value={itemDraft.externalUrl} onChange={(event) => updateItemDraft('externalUrl', event.target.value)} />
                    </div>
                  ) : null}
                  <div className="admin-form-row conversations-thumbnail-row">
                    <label>썸네일</label>
                                        <div className="admin-header-actions">
                      <label className="admin-file-button">
                        {uploadingField === 'thumbnail' ? '업로드 중...' : '썸네일 업로드'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(uploadingField)} onChange={(event) => handleThumbnailUpload(event.target.files?.[0])} />
                      </label>
                      {itemDraft.thumbnailUrl ? (
                        <button className="admin-button secondary" style={{ backgroundColor: '#fff', border: '1px solid #eaeaea' }} type="button" onClick={removeThumbnail}>썸네일 삭제</button>
                      ) : null}
                    </div>
                    <p className="admin-caption">JPG, PNG, WEBP 파일 업로드 가능, 최대 2MB</p>
                    {itemDraft.thumbnailUrl ? (
                      <div className="common-thumbnail-preview">
                        <img src={itemDraft.thumbnailUrl} alt={`${itemDraft.label} 썸네일`} />
                      </div>
                    ) : (
                      <p className="admin-caption">썸네일 없이 적용됩니다.</p>
                    )}
                  </div>
                </div>

                {itemDraft.action === 'detail' ? (
                  <div className="admin-form-row">
                    <label>상세이미지/영상</label>
                    <label className="admin-file-button">
                      {uploadingField === 'detailMedia' ? '업로드 중...' : '상세 미디어 업로드'}
                      <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" multiple disabled={Boolean(uploadingField)} onChange={(event) => handleDetailMediaUpload(event.target.files)} />
                    </label>
                    <p className="admin-caption">이미지: JPG, PNG, WEBP 파일, 최대 2MB<br/>영상: MP4 파일, 최대 100MB<br/><br/>드래그 앤 드롭으로 순서 변경</p>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMediaDragEnd}>
                      <SortableContext items={itemDraft.detailMedia.map((_, index) => `detail-media-${index}`)} strategy={rectSortingStrategy}>
                        <div className="common-detail-media-list">
                          {itemDraft.detailMedia.map((url, index) => (
                            <SortableMediaItem key={`${url}-${index}`} id={`detail-media-${index}`} url={url} title={itemDraft.label} index={index} onRemove={removeDetailMedia} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </AdminLayout>
  )
}
