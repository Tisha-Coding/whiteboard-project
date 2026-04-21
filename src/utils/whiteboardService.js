import supabase from './supabase'

// -------- Latest board snapshot --------

export async function loadLatestWhiteboardSnapshot(roomId) {
  if (!roomId) return null

  const { data, error } = await supabase
    .from('whiteboard')
    .select('*')
    .eq('key', roomId)
    .limit(1)
  if (error) throw error

  const row = data?.[0]
  if (!row?.json) return null

  return typeof row.json === 'string' ? JSON.parse(row.json) : row.json
}

export async function saveLatestWhiteboardSnapshot(roomId, snapshot) {
  if (!roomId) return

  // Native upsert — atomic, eliminates the race-condition of check-then-insert
  const { error } = await supabase
    .from('whiteboard')
    .upsert({ key: roomId, json: JSON.stringify(snapshot) }, { onConflict: 'key' })

  if (error) throw error
  return { mode: 'upsert' }
}

// -------------------- Checkpoints --------------------

export async function insertCheckpoint(roomId, snapshot, title) {
  if (!roomId) return

  const { error } = await supabase.from('whiteboard_snapshots').insert([{
    room_id: roomId,
    json: snapshot,
    title: title || null,
  }])
  if (error) throw error
}

export async function listCheckpoints(roomId, max = 200) {
  if (!roomId) return []

  const { data, error } = await supabase
    .from('whiteboard_snapshots')
    .select('id,created_at,title,json')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(max)

  if (error) throw error

  return (data || []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    title: row.title,
    json: row.json,
  }))
}
