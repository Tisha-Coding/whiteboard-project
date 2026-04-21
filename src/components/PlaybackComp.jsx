import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Tldraw, loadSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'
import { listCheckpoints } from '../utils/whiteboardService'

const PB_LOCK_KEY = 'pb_locked_room'
const MAX_CHECKPOINTS = 200
const DEBOUNCE_MS = 250
const SPEED_OPTIONS = [1, 2, 5]

function coerceJson(maybeJson) {
  if (maybeJson == null) return null
  if (typeof maybeJson === 'string') {
    try { return JSON.parse(maybeJson) } catch { return null }
  }
  return maybeJson
}

// A small helper for hoverable buttons inside the dark player bar
function PlayerBtn({ onClick, disabled, children, active, style = {} }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999,
        border: '1px solid rgba(124,58,237,0.4)',
        background: active
          ? 'linear-gradient(120deg,#7c3aed,#9333ea)'
          : hover ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.06)',
        color: active ? '#fff' : hover ? '#c4b5fd' : '#a78bfa',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .15s ease',
        opacity: disabled ? 0.4 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

const PlaybackComp = () => {
  const { roomId } = useParams()
  const roomIdValue = (roomId || '').trim()
  const isRoomIdValid = roomIdValue.length > 0

  const mountedRoomId = useRef(roomIdValue)
  const navigate = useNavigate()

  // sessionStorage-based lock — survives remounts caused by URL bar edits
  useEffect(() => {
    const id = mountedRoomId.current
    const stored = sessionStorage.getItem(PB_LOCK_KEY)
    if (!stored) {
      sessionStorage.setItem(PB_LOCK_KEY, id)
    } else if (stored !== id) {
      sessionStorage.removeItem(PB_LOCK_KEY)
      navigate('/playback', { replace: true })
    }
  }, [navigate])

  const editorRef = useRef(null)
  const loadTimerRef = useRef(null)

  const [editorReady, setEditorReady] = useState(false)
  const [checkpoints, setCheckpoints] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [loadError, setLoadError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copyStatus, setCopyStatus] = useState(null)
  const [homeHover, setHomeHover] = useState(false)
  const [collabHover, setCollabHover] = useState(false)
  const [copyHover, setCopyHover] = useState(false)

  const currentCheckpoint = checkpoints[currentIndex]

  const formattedTime = useMemo(() => {
    if (!currentCheckpoint?.created_at) return ''
    const d = new Date(currentCheckpoint.created_at)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString()
  }, [currentCheckpoint])

  const playbackUrl = useMemo(() => {
    if (!isRoomIdValid) return ''
    return `${window.location.origin}/playback/${encodeURIComponent(roomIdValue)}`
  }, [isRoomIdValid, roomIdValue])

  const copyPlaybackLink = async () => {
    const text = playbackUrl.trim()
    if (!text) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        throw new Error('Clipboard API unavailable')
      }
      setCopyStatus({ type: 'success', message: 'Link copied!' })
    } catch (e) {
      console.error(e)
      setCopyStatus({ type: 'error', message: 'Copy failed.' })
    }
    setTimeout(() => setCopyStatus(null), 3000)
  }

  useEffect(() => {
    if (!isRoomIdValid) return
    let cancelled = false
    setIsLoading(true)
    setLoadError(null)
    ;(async () => {
      try {
        const list = await listCheckpoints(roomIdValue, MAX_CHECKPOINTS)
        if (cancelled) return
        setCheckpoints(list)
        setCurrentIndex(0)
        setIsFinished(false)
        setIsPlaying(false)
      } catch (e) {
        console.error('Playback load error:', e)
        if (!cancelled) setLoadError('Could not load playback checkpoints.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [isRoomIdValid, roomIdValue])

  useEffect(() => {
    if (!editorReady || !editorRef.current || !currentCheckpoint) return
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current)
    loadTimerRef.current = setTimeout(() => {
      const parsed = coerceJson(currentCheckpoint.json)
      if (!parsed) return
      try { loadSnapshot(editorRef.current.store, parsed) }
      catch (e) { console.error('Playback snapshot load error:', e) }
    }, DEBOUNCE_MS)
    return () => { if (loadTimerRef.current) clearTimeout(loadTimerRef.current) }
  }, [currentCheckpoint, editorReady])

  useEffect(() => {
    if (!isPlaying || checkpoints.length <= 1) return
    const intervalMs = Math.round(1000 / speed)
    const id = setInterval(() => {
      setCurrentIndex((i) => {
        const next = i + 1
        if (next >= checkpoints.length) {
          setIsPlaying(false)
          setIsFinished(true)
          return i
        }
        return next
      })
    }, intervalMs)
    return () => clearInterval(id)
  }, [isPlaying, checkpoints.length, speed])

  const handlePlayToggle = () => {
    if (checkpoints.length <= 1) return
    if (isFinished || (!isPlaying && currentIndex >= checkpoints.length - 1)) {
      setCurrentIndex(0)
      setIsFinished(false)
      setIsPlaying(true)
      return
    }
    setIsPlaying((p) => !p)
  }

  const progress = checkpoints.length > 1
    ? (currentIndex / (checkpoints.length - 1)) * 100
    : 0

  if (!isRoomIdValid) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Invalid room id.</div>
        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
          Open <code>/playback/:roomId</code> with a valid roomId.
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(145deg,#ffffff 0%,#f5f0ff 40%,#fdf4ff 70%,#ffffff 100%)' }}>

      {/* floating bg shapes */}
      <div style={{ position:'absolute', top:'8%', right:'12%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'20%', left:'6%', width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />

      {/* Top-left info card */}
      <div style={{ position: 'absolute', top: 60, left: 14, zIndex: 20, pointerEvents: 'none' }}>
        <div style={{ position:'relative', borderRadius:20, padding:2, background:'transparent' }}>
          <div style={{
            position:'absolute', inset:0, borderRadius:20, zIndex:0,
            background:'conic-gradient(from 0deg,#7c3aed,#c026d3,#9333ea,#7c3aed)',
            opacity:0.45,
          }} />
          <div style={{
            pointerEvents: 'auto',
            position: 'relative', zIndex: 1,
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 18,
            padding: '14px 18px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 18px 60px rgba(124,58,237,0.12)',
            minWidth: 290,
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:4 }}>
              <span className="g-text" style={{ fontSize:14, fontWeight:900, letterSpacing:0.2 }}>
                Playback
              </span>
              <span style={{
                fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:999,
                background:'rgba(124,58,237,0.08)', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.18)',
              }}>
                {roomIdValue || '—'}
              </span>
            </div>
            <div style={{ fontSize:12, marginTop:4, color:'#6b7280', lineHeight:1.45 }}>
              Replay the checkpoint timeline for this room. <b style={{ color:'#7c3aed' }}>Read-only.</b>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:14 }}>
              <Link
                to="/"
                onMouseEnter={() => setHomeHover(true)}
                onMouseLeave={() => setHomeHover(false)}
                style={{
                  fontSize:12, fontWeight:700, padding:'7px 14px', borderRadius:999,
                  border:'1.5px solid rgba(124,58,237,0.4)',
                  background: homeHover ? 'rgba(124,58,237,0.08)' : '#ffffff',
                  color:'#7c3aed', textDecoration:'none',
                  boxShadow: homeHover ? '0 4px 14px rgba(124,58,237,0.18)' : '0 2px 8px rgba(124,58,237,0.08)',
                  transition:'all .18s ease',
                }}
              >
                ← Home
              </Link>
              <Link
                to={`/collab/${encodeURIComponent(roomIdValue)}`}
                onMouseEnter={() => setCollabHover(true)}
                onMouseLeave={() => setCollabHover(false)}
                style={{
                  fontSize:12, fontWeight:700, padding:'7px 14px', borderRadius:999,
                  border:'1.5px solid rgba(124,58,237,0.4)',
                  background: collabHover ? 'rgba(124,58,237,0.08)' : '#ffffff',
                  color:'#7c3aed', textDecoration:'none',
                  boxShadow: collabHover ? '0 4px 14px rgba(124,58,237,0.18)' : '0 2px 8px rgba(124,58,237,0.08)',
                  transition:'all .18s ease',
                }}
              >
                ← Collab
              </Link>
              <button
                type="button"
                onClick={copyPlaybackLink}
                onMouseEnter={() => setCopyHover(true)}
                onMouseLeave={() => setCopyHover(false)}
                style={{
                  fontSize:12, fontWeight:700, padding:'7px 14px', borderRadius:999,
                  border:'1.5px solid rgba(124,58,237,0.4)',
                  background: copyHover ? 'linear-gradient(120deg,#7c3aed,#9333ea)' : '#ffffff',
                  color: copyHover ? '#ffffff' : '#7c3aed',
                  cursor:'pointer',
                  boxShadow: copyHover ? '0 4px 14px rgba(124,58,237,0.28)' : '0 2px 8px rgba(124,58,237,0.08)',
                  transition:'all .18s ease',
                }}
              >
                Copy Link
              </button>
            </div>

            {copyStatus ? (
              <div style={{
                marginTop: 8, fontSize: 11, fontWeight: 700,
                color: copyStatus.type === 'success' ? '#16a34a' : '#dc2626',
              }}>
                {copyStatus.message}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Tldraw
        components={{}}
        onMount={(editor) => {
          editorRef.current = editor
          setEditorReady(true)
          try { editor.updateInstanceState({ isReadonly: true }) }
          catch (e) { console.warn('Could not set readonly mode:', e) }
        }}
      />

      {/* ── Dark cinematic player bar ── */}
      <div style={{
        position: 'absolute', left: 16, right: 16, bottom: 16, zIndex: 12,
        background: 'rgba(10,4,26,0.90)',
        border: '1px solid rgba(124,58,237,0.35)',
        borderRadius: 20,
        padding: '14px 18px',
        pointerEvents: 'auto',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 -4px 60px rgba(124,58,237,0.18), 0 20px 60px rgba(0,0,0,0.35)',
      }}>

        {/* Glow accent line at top of bar */}
        <div style={{
          position:'absolute', top:0, left:'15%', right:'15%', height:2, borderRadius:999,
          background:'linear-gradient(90deg,transparent,rgba(124,58,237,0.7),rgba(192,38,211,0.7),transparent)',
        }} />

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, alignItems: 'start' }}>

          {/* ── Checkpoint list ── */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 14,
            maxHeight: 180,
            overflowY: 'auto',
            padding: 8,
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', letterSpacing: 1, textTransform:'uppercase', marginBottom: 6, paddingLeft: 4 }}>
              Checkpoints
            </div>
            {isLoading ? (
              <div style={{ fontSize: 12, color: '#a78bfa', opacity: 0.7, padding: 4 }}>Loading…</div>
            ) : loadError ? (
              <div style={{ fontSize: 12, color: '#f87171', padding: 4 }}>{loadError}</div>
            ) : !checkpoints.length ? (
              <div style={{ fontSize: 12, color: '#a78bfa', opacity: 0.7, padding: 4 }}>
                No checkpoints yet.
                <div style={{ marginTop: 6 }}>
                  <Link to={`/collab/${encodeURIComponent(roomIdValue)}`} style={{ color: '#c4b5fd', textDecoration: 'underline' }}>
                    Create one in Collab →
                  </Link>
                </div>
              </div>
            ) : (
              checkpoints.map((cp, idx) => {
                const label = (() => {
                  if (cp?.title) return cp.title
                  if (!cp?.created_at) return `#${idx + 1}`
                  const d = new Date(cp.created_at)
                  return Number.isNaN(d.getTime()) ? `#${idx + 1}` : `#${idx + 1} ${d.toLocaleTimeString()}`
                })()
                const isActive = idx === currentIndex
                return (
                  <button
                    key={cp.id || idx}
                    type="button"
                    onClick={() => { setIsPlaying(false); setIsFinished(false); setCurrentIndex(idx) }}
                    style={{
                      width: '100%', textAlign: 'left', marginBottom: 4, padding: '6px 10px',
                      borderRadius: 8,
                      border: isActive ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.06)',
                      background: isActive ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.03)',
                      color: isActive ? '#e9d5ff' : '#94a3b8',
                      fontSize: 12, cursor: 'pointer',
                      transition: 'all .15s ease',
                      fontWeight: isActive ? 700 : 400,
                    }}
                  >
                    {isActive && (
                      <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#a855f7', marginRight:6, verticalAlign:'middle' }} />
                    )}
                    {label}
                  </button>
                )
              })
            )}
          </div>

          {/* ── Controls + slider ── */}
          <div>
            {/* row: play + speed + info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>

              {/* Play / Pause button */}
              <button
                type="button"
                onClick={handlePlayToggle}
                disabled={checkpoints.length <= 1}
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: checkpoints.length <= 1
                    ? 'rgba(124,58,237,0.2)'
                    : 'linear-gradient(135deg,#7c3aed,#c026d3)',
                  border: 'none',
                  color: 'white',
                  fontSize: 20,
                  cursor: checkpoints.length <= 1 ? 'not-allowed' : 'pointer',
                  boxShadow: checkpoints.length > 1 ? '0 4px 24px rgba(124,58,237,0.5)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all .18s ease',
                }}
              >
                {isFinished ? '↺' : isPlaying ? '⏸' : '▶'}
              </button>

              {/* Speed selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', letterSpacing: 0.5, textTransform:'uppercase' }}>
                  Speed
                </span>
                {SPEED_OPTIONS.map((s) => (
                  <PlayerBtn key={s} onClick={() => setSpeed(s)} active={speed === s}>
                    {s}×
                  </PlayerBtn>
                ))}
              </div>

              {/* Current checkpoint info */}
              <div style={{ fontSize: 12, minWidth: 160 }}>
                {currentCheckpoint?.created_at ? (
                  <>
                    <div style={{ color: '#c4b5fd', fontWeight: 600 }}>{formattedTime}</div>
                    <div style={{ marginTop: 3, color: '#6b7280' }}>
                      {checkpoints.length
                        ? `${currentIndex + 1} / ${checkpoints.length} checkpoint${checkpoints.length !== 1 ? 's' : ''}`
                        : '0 / 0'}
                    </div>
                    {isFinished && (
                      <div style={{ marginTop: 4, color: '#a855f7', fontWeight: 700 }}>Playback finished ✓</div>
                    )}
                  </>
                ) : (
                  <div style={{ color: '#6b7280' }}>
                    {checkpoints.length > 0 ? 'Select a checkpoint.' : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar + range slider */}
            <div style={{ position: 'relative', height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', marginBottom: 6, overflow: 'visible' }}>
              {/* filled track */}
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 999,
                background: 'linear-gradient(90deg,#7c3aed,#c026d3)',
                width: `${progress}%`,
                boxShadow: '0 0 8px rgba(124,58,237,0.6)',
                transition: 'width .15s ease',
              }} />
              <input
                type="range"
                min={0}
                max={Math.max(checkpoints.length - 1, 0)}
                value={Math.min(currentIndex, Math.max(checkpoints.length - 1, 0))}
                onChange={(e) => {
                  setIsPlaying(false)
                  setIsFinished(false)
                  setCurrentIndex(Number(e.target.value))
                }}
                disabled={!checkpoints.length}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  opacity: 0, cursor: checkpoints.length ? 'pointer' : 'not-allowed',
                  margin: 0,
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4b5563', fontWeight: 700, letterSpacing: 0.3 }}>
              <span>START</span>
              <span style={{ color: '#7c3aed' }}>
                {checkpoints.length ? `${currentIndex + 1} / ${checkpoints.length}` : '—'}
              </span>
              <span>END</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default PlaybackComp
