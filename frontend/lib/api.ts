// API client for the Context Engine backend.
//
// When NEXT_PUBLIC_API_URL is set (e.g. "http://localhost:8000"), requests go
// to that backend. Otherwise they fall back to the built-in mock route handlers
// under /api so the app is fully previewable inside v0 without a backend.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export interface UploadResponse {
  job_id: string
  message: string
}

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const res = await fetch(`${API_BASE}/upload-files`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`)
  }
  return res.json()
}

export async function askQuestion(query: string, jobId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/qna`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, job_id: jobId }),
  })

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`)
  }

  const data = await res.json()
  // Backend may return a raw string or an object with an "answer" field.
  if (typeof data === 'string') return data
  return data.answer ?? data.response ?? data.message ?? ''
}
