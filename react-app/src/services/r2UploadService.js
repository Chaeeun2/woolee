const getWorkerUrl = () => import.meta.env.VITE_R2_WORKER_URL?.replace(/\/$/, '')
const getUploadToken = () => import.meta.env.VITE_R2_UPLOAD_TOKEN

const getAuthHeaders = () => {
  const token = getUploadToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const parseUploadResponse = async (response) => {
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(body.error || '파일 업로드에 실패했습니다.')
  }

  return body
}

export const uploadFileToR2 = async (file, directory = 'main-page') => {
  const workerUrl = getWorkerUrl()

  if (!workerUrl) {
    throw new Error('VITE_R2_WORKER_URL 환경변수가 필요합니다.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('directory', directory)

  const response = await fetch(`${workerUrl}/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  })

  return parseUploadResponse(response)
}

export const deleteFileFromR2 = async (key) => {
  const workerUrl = getWorkerUrl()

  if (!workerUrl) {
    throw new Error('VITE_R2_WORKER_URL 환경변수가 필요합니다.')
  }

  const response = await fetch(`${workerUrl}/objects/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || '파일 삭제에 실패했습니다.')
  }
}

export const getR2KeyFromUrl = (fileUrl) => {
  const workerUrl = getWorkerUrl()
  const publicBaseUrl = import.meta.env.VITE_R2_PUBLIC_BASE_URL?.replace(/\/$/, '')

  try {
    const url = new URL(fileUrl)
    const knownBaseUrl = publicBaseUrl || workerUrl
    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''))

    if (knownBaseUrl) {
      const baseUrl = new URL(knownBaseUrl)
      if (url.origin === baseUrl.origin) {
        return key
      }
    }

    if (url.hostname.endsWith('.r2.dev') && /^(common|qe|projects|conversations|main-page)\//.test(key)) {
      return key
    }

    return ''
  } catch {
    return ''
  }
}

export const deleteFileUrlFromR2 = async (fileUrl) => {
  const key = getR2KeyFromUrl(fileUrl)
  if (!key) return

  await deleteFileFromR2(key)
}
