import { NextResponse } from 'next/server'

// Mock implementation of POST /qna.
// Accepts { query, job_id } and returns a markdown-formatted answer string.
export async function POST(request: Request) {
  let body: { query?: string; job_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body.' }, { status: 400 })
  }

  const { query, job_id } = body

  if (!query || !job_id) {
    return NextResponse.json(
      { message: 'Both "query" and "job_id" are required.' },
      { status: 400 },
    )
  }

  // Simulate retrieval + generation latency.
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const answer = buildMockAnswer(query)
  return NextResponse.json({
    answer,
    sources: [
      { filename: 'project-specification.pdf' },
      { filename: 'overview-notes.txt' },
    ],
  })
}

function buildMockAnswer(query: string): string {
  const q = query.toLowerCase()

  if (q.includes('summar') || q.includes('takeaway')) {
    return [
      "Here's a concise summary of the key takeaways from your documents:",
      '',
      '1. **Primary objective** — the material centers on establishing a clear, measurable goal and the strategy to reach it.',
      '2. **Supporting evidence** — several data points reinforce the core argument, with the strongest signal appearing in the second section.',
      '3. **Recommended next steps** — the sources converge on a short list of prioritized actions.',
      '',
      '> Note: This is a mock response for preview. Connect a backend via `NEXT_PUBLIC_API_URL` to get answers grounded in your real documents.',
    ].join('\n')
  }

  if (q.includes('action item') || q.includes('todo') || q.includes('to-do')) {
    return [
      'Based on the retrieved context, here are the **action items** I found:',
      '',
      '- [ ] Finalize the scope document and circulate for review',
      '- [ ] Validate the assumptions listed in section 3',
      '- [ ] Schedule a follow-up to confirm ownership of each deliverable',
      '',
      'Let me know if you want these grouped by owner or due date.',
    ].join('\n')
  }

  if (q.includes('finding') || q.includes('main')) {
    return [
      'The main findings across the provided documents are:',
      '',
      '```text',
      'Finding A → strong positive correlation in the observed sample',
      'Finding B → a notable outlier worth further investigation',
      'Finding C → results are consistent with the stated hypothesis',
      '```',
      '',
      'Each finding is drawn from the most relevant chunks retrieved for your query.',
    ].join('\n')
  }

  return [
    `I searched the indexed context for **"${query.trim()}"** and here is what I found:`,
    '',
    'The relevant passages suggest a clear answer, supported by multiple sections of your uploaded material. In a live deployment, this response would cite the exact chunks used to ground the answer.',
    '',
    '_This is a simulated answer generated for preview purposes._',
  ].join('\n')
}
