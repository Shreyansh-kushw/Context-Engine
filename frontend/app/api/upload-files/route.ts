import { NextResponse } from 'next/server'

// Mock implementation of POST /upload-files.
// Accepts multipart/form-data with a "files" key and returns a generated job id.
export async function POST(request: Request) {
  const formData = await request.formData()
  const files = formData.getAll('files')

  if (!files || files.length === 0) {
    return NextResponse.json(
      { message: 'No files were provided.' },
      { status: 400 },
    )
  }

  // Simulate extraction + contextualization latency.
  await new Promise((resolve) => setTimeout(resolve, 1600))

  const jobId = `job_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`

  return NextResponse.json({
    job_id: jobId,
    message: `Processed ${files.length} document${
      files.length === 1 ? '' : 's'
    } and built a searchable context index.`,
  })
}
