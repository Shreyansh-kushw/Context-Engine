import { NextResponse } from 'next/server'

// In-memory store for simulated mock jobs during preview/mock mode
interface MockJobProgress {
  startTime: number
  totalDuration: number
}

const mockJobs = new Map<string, MockJobProgress>()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params

  if (!mockJobs.has(jobId)) {
    mockJobs.set(jobId, {
      startTime: Date.now(),
      totalDuration: 4500, // 4.5s total simulation
    })
  }

  const job = mockJobs.get(jobId)!
  const elapsed = Date.now() - job.startTime
  const ratio = Math.min(elapsed / job.totalDuration, 1)
  const progress = Math.round(ratio * 100)

  if (ratio < 0.25) {
    return NextResponse.json({
      job_id: jobId,
      status: 'processing',
      step: 'parsing',
      progress,
      message: 'Extracting text, tables & layout with Docling OCR...',
    })
  } else if (ratio < 0.6) {
    return NextResponse.json({
      job_id: jobId,
      status: 'processing',
      step: 'chunking',
      progress,
      message: 'Segmenting document into contextual chunks...',
    })
  } else if (ratio < 0.9) {
    return NextResponse.json({
      job_id: jobId,
      status: 'processing',
      step: 'embedding',
      progress,
      message: 'Computing 768-dim embeddings & storing in pgvector database...',
    })
  } else if (ratio < 1) {
    return NextResponse.json({
      job_id: jobId,
      status: 'processing',
      step: 'finalizing',
      progress: 98,
      message: 'Finalizing context index...',
    })
  }

  // Finished!
  return NextResponse.json({
    job_id: jobId,
    status: 'completed',
    step: 'completed',
    progress: 100,
    message: 'Document indexing complete and ready to query!',
    total_chunks: 24,
  })
}
