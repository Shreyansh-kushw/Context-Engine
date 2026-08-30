import { NextResponse } from 'next/server'

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
      totalDuration: 4000,
    })
  }

  const job = mockJobs.get(jobId)!
  const elapsed = Date.now() - job.startTime
  const ratio = Math.min(elapsed / job.totalDuration, 1)
  const progress = Math.round(ratio * 100)

  if (ratio < 1) {
    return NextResponse.json({
      job_id: jobId,
      status: 'Processing',
      progress,
      message: 'Processing documents and building searchable context engine...',
    })
  }

  return NextResponse.json({
    job_id: jobId,
    status: 'Success',
    progress: 100,
    message: 'Documents processed successfully!',
  })
}
