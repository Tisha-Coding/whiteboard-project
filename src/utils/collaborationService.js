import { supabase } from './supabase'

let channel = null

export const initializeCollaboration = (roomId, onDrawingUpdate) => {
  channel = supabase.channel(`whiteboard-${roomId}`)

  channel
    .on('broadcast', { event: 'draw' }, (payload) => {
      onDrawingUpdate(payload.payload)
    })
    .subscribe()

  return () => {
    if (channel) channel.unsubscribe()
  }
}

export const broadcastDrawing = async (roomId, drawingData) => {
  if (!channel) return

  await channel.send({
    type: 'broadcast',
    event: 'draw',
    payload: {
      imageData: drawingData,
      timestamp: new Date().toISOString(),
      userId: Math.random().toString(36).substr(2, 9)
    }
  })
}

export const shareDrawingLink = (roomId) => {
  return `${window.location.origin}/collab/${encodeURIComponent(roomId)}`
}
