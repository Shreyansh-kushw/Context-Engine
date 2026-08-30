// API client for the Context Engine backend.
//
// When NEXT_PUBLIC_API_URL is set (e.g. "http://localhost:8000"), requests go
// to that backend. Otherwise they fall back to the built-in mock route handlers
// under /api so the app is fully previewable inside v0 without a backend.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export interface UploadResponse {
  job_id: string
  message: string
  status?: string
}

export type JobStatusType =
  | 'pending'
  | 'processing'
  | 'in_progress'
  | 'completed'
  | 'done'
  | 'ready'
  | 'success'
  | 'failed'
  | 'error'

export interface JobStatusResponse {
  status: JobStatusType | string
  message?: string
  progress?: number // 0 to 100
  step?: string
  total_chunks?: number
  detail?: string
  error?: string
}

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const res = await fetch(`${API_BASE}/upload-files`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    let errorMsg = `Upload failed (${res.status})`
    try {
      const errData = await res.json()
      if (errData.detail) errorMsg = errData.detail
      else if (errData.message) errorMsg = errData.message
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorMsg)
  }
  return res.json()
}

/**
 * Polls the backend status endpoint for a given jobId.
 * Handles different backend status routes (/status/{jobId}, /status?job_id=..., /job-status/{jobId})
 * and handles both raw string returns ("Processing", "Success", "Failed") and JSON object responses.
 */
export async function checkJobStatus(jobId: string): Promise<JobStatusResponse> {
  const encodedId = encodeURIComponent(jobId)
  
  // Try primary endpoint pattern: GET /status/{job_id}
  let res = await fetch(`${API_BASE}/status/${encodedId}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  })

  // Fallback pattern 1: GET /job-status/{job_id} if 404
  if (res.status === 404) {
    res = await fetch(`${API_BASE}/job-status/${encodedId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })
  }

  // Fallback pattern 2: GET /status?job_id={job_id} if still 404
  if (res.status === 404) {
    res = await fetch(`${API_BASE}/status?job_id=${encodedId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })
  }

  if (!res.ok) {
    let errorMsg = `Status check failed (${res.status})`
    try {
      const errData = await res.json()
      if (typeof errData === 'string') {
        errorMsg = errData
      } else if (errData.detail) {
        errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail)
      } else if (errData.message) {
        errorMsg = errData.message
      }
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorMsg)
  }

  const data = await res.json()

  // 1. Backend returns a raw string (e.g. "Processing", "Success", "Failed")
  if (typeof data === 'string') {
    const lower = data.toLowerCase().trim()
    if (lower === 'success' || lower === 'completed' || lower === 'done' || lower === 'ready') {
      return { status: 'completed', message: 'Indexing complete' }
    }
    if (lower === 'failed' || lower === 'error') {
      return { status: 'failed', error: 'Backend reported processing failure' }
    }
    return { status: 'processing', message: 'Processing document...' }
  }

  // 2. Backend returns null or empty
  if (!data) {
    return { status: 'processing', message: 'Waiting for task to register...' }
  }

  // 3. Backend returns an object (e.g. { "status": "Success" } or { "status": "Processing" })
  let rawStatus = (data.status || data.state || '').toString().toLowerCase().trim()

  if (!rawStatus) {
    if (data.completed === true || data.is_completed === true || data.ready === true || data.success === true) {
      rawStatus = 'completed'
    } else if (data.failed === true || data.error) {
      rawStatus = 'failed'
    } else {
      rawStatus = 'processing'
    }
  } else if (rawStatus === 'success' || rawStatus === 'done' || rawStatus === 'ready') {
    rawStatus = 'completed'
  } else if (rawStatus === 'error') {
    rawStatus = 'failed'
  }

  return {
    status: rawStatus,
    message: data.message || data.detail || (rawStatus === 'completed' ? 'Indexing complete' : 'Processing document...'),
    progress: typeof data.progress === 'number' ? data.progress : undefined,
    step: data.step,
    total_chunks: data.total_chunks ?? data.chunks_count,
    detail: typeof data.detail === 'string' ? data.detail : undefined,
    error: typeof data.error === 'string' ? data.error : (rawStatus === 'failed' ? (data.detail || 'Processing failed') : undefined),
  }
}

export async function askQuestion(query: string, jobId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/qna`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, job_id: jobId }),
  })

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`
    try {
      const errData = await res.json()
      if (errData.detail) errorMsg = errData.detail
      else if (errData.message) errorMsg = errData.message
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorMsg)
  }

  const data = await res.json()
  // Backend may return a raw string or an object with an "answer" field.
  if (typeof data === 'string') return data
  return data.answer ?? data.response ?? data.message ?? ''
}
