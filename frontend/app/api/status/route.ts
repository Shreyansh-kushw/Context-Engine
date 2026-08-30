import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('job_id') || searchParams.get('jobId') || 'default-job'

  // Delegate response format
  return NextResponse.json({
    job_id: jobId,
    status: 'completed',
    progress: 100,
    message: 'Indexing completed successfully.',
  })
}
