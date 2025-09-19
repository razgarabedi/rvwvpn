import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"

// WebSocket endpoint for real-time updates
export async function GET(request: NextRequest) {
  // Check authentication first
  const session = await getServerSession()
  if (!session) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // This would typically handle WebSocket connections
  // For now, we'll use polling with Server-Sent Events (SSE)
  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        
        // Send initial connection message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'connected',
          timestamp: new Date().toISOString()
        })}\n\n`))

        // Set up interval for real-time updates
        const interval = setInterval(async () => {
          try {
            // Fetch real-time data with authentication headers
            const response = await fetch(`${request.nextUrl.origin}/api/radius/reports/realtime?type=overview`, {
              headers: {
                'Cookie': request.headers.get('cookie') || '',
                'Authorization': request.headers.get('authorization') || '',
                'User-Agent': request.headers.get('user-agent') || ''
              }
            })
            
            if (response.ok) {
              const data = await response.json()
              
              // Send data to client
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'update',
                data: data
              })}\n\n`))
            } else {
              console.error('Real-time API error:', response.status, response.statusText)
              // Send error to client
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                error: 'Failed to fetch real-time data'
              })}\n\n`))
            }
          } catch (error) {
            console.error('Error in real-time stream:', error)
            // Send error to client
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: 'Connection error'
            })}\n\n`))
          }
        }, 5000) // Update every 5 seconds

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(interval)
          controller.close()
        })
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    }
  )
}
