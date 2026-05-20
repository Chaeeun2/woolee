const IMAGE_MAX_FILE_SIZE = 2 * 1024 * 1024
const VIDEO_MAX_FILE_SIZE = 100 * 1024 * 1024
const IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const VIDEO_CONTENT_TYPES = ['video/mp4']
const ALLOWED_CONTENT_TYPES = [...IMAGE_CONTENT_TYPES, ...VIDEO_CONTENT_TYPES]

const jsonResponse = (body, init = {}, env, request) => (
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env, request),
      ...(init.headers || {}),
    },
  })
)

const corsHeaders = (env, request) => ({
  'Access-Control-Allow-Origin': resolveCorsOrigin(request, env),
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
})

const resolveCorsOrigin = (request, env) => {
  const allowedOrigins = String(env.ALLOWED_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  const requestOrigin = request?.headers.get('Origin')

  if (allowedOrigins.includes('*')) return '*'
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) return requestOrigin
  return allowedOrigins[0] || '*'
}

const sanitizeDirectory = (directory) => (
  String(directory || 'uploads')
    .replace(/[^a-zA-Z0-9/_-]/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '')
    .slice(0, 120) || 'uploads'
)

const getExtension = (fileName) => {
  const extension = String(fileName || '').split('.').pop()
  return extension && extension !== fileName ? `.${extension.toLowerCase()}` : ''
}

const requireUploadToken = (request, env) => {
  if (!env.UPLOAD_TOKEN) return true
  return request.headers.get('Authorization') === `Bearer ${env.UPLOAD_TOKEN}`
}

const getMaxFileSize = (contentType) => (
  VIDEO_CONTENT_TYPES.includes(contentType) ? VIDEO_MAX_FILE_SIZE : IMAGE_MAX_FILE_SIZE
)

const getMaxFileSizeLabel = (contentType) => (
  VIDEO_CONTENT_TYPES.includes(contentType) ? '100MB' : '2MB'
)

const handleUpload = async (request, env) => {
  if (!requireUploadToken(request, env)) {
    return jsonResponse({ error: '업로드 권한이 없습니다.' }, { status: 401 }, env, request)
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || typeof file === 'string') {
    return jsonResponse({ error: 'file 필드가 필요합니다.' }, { status: 400 }, env, request)
  }

  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
    return jsonResponse({ error: `${file.type || 'unknown'} 형식은 업로드할 수 없습니다.` }, { status: 415 }, env, request)
  }

  if (file.size > getMaxFileSize(file.type)) {
    return jsonResponse({ error: `파일은 최대 ${getMaxFileSizeLabel(file.type)}까지 업로드할 수 있습니다.` }, { status: 413 }, env, request)
  }

  const directory = sanitizeDirectory(formData.get('directory'))
  const key = `${directory}/${crypto.randomUUID()}${getExtension(file.name)}`

  await env.WOOLEE_BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  })

  return jsonResponse({
    key,
    url: `${env.PUBLIC_R2_BASE_URL.replace(/\/$/, '')}/${key}`,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  }, { status: 201 }, env, request)
}

const handleDelete = async (request, env) => {
  if (!requireUploadToken(request, env)) {
    return jsonResponse({ error: '삭제 권한이 없습니다.' }, { status: 401 }, env, request)
  }

  const url = new URL(request.url)
  const key = decodeURIComponent(url.pathname.replace(/^\/objects\//, ''))

  if (!key) {
    return jsonResponse({ error: '삭제할 object key가 필요합니다.' }, { status: 400 }, env, request)
  }

  await env.WOOLEE_BUCKET.delete(key)
  return jsonResponse({ ok: true }, {}, env, request)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env, request) })
    }

    if (request.method === 'POST' && url.pathname === '/upload') {
      return handleUpload(request, env)
    }

    if (request.method === 'DELETE' && url.pathname.startsWith('/objects/')) {
      return handleDelete(request, env)
    }

    return jsonResponse({
      ok: true,
      routes: ['POST /upload', 'DELETE /objects/:key'],
    }, {}, env, request)
  },
}
