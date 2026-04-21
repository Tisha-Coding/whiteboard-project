import { useEffect, useRef, useState } from 'react'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { useSyncDemo } from '@tldraw/sync'
import { Link, useNavigate, useParams } from 'react-router-dom'

const RT_LOCK_KEY = 'rt_locked_room'

const RealTimeComp = () => {
  const { roomId } = useParams()
  const roomIdValue = (roomId || '').trim()
  const store = useSyncDemo({ roomId: roomIdValue })
  const [copyStatus, setCopyStatus] = useState(null)
  const [homeHover, setHomeHover] = useState(false)
  const [copyHover, setCopyHover] = useState(false)

  const mountedRoomId = useRef(roomIdValue)
  const navigate = useNavigate()

  // sessionStorage-based lock — survives remounts caused by URL bar edits
  useEffect(() => {
    const id = mountedRoomId.current
    const stored = sessionStorage.getItem(RT_LOCK_KEY)
    if (!stored) {
      sessionStorage.setItem(RT_LOCK_KEY, id)
    } else if (stored !== id) {
      sessionStorage.removeItem(RT_LOCK_KEY)
      navigate('/realtime', { replace: true })
    }
  }, [navigate])

  const copyRoomLink = async () => {
    if (!roomIdValue) return
    const url = `${window.location.origin}/realtime/${encodeURIComponent(roomIdValue)}`
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setCopyStatus({ type: 'success', message: 'Room link copied!' })
      } else {
        setCopyStatus({ type: 'error', message: 'Copy failed.' })
      }
    } catch (e) {
      console.error(e)
      setCopyStatus({ type: 'error', message: 'Copy failed.' })
    }
    setTimeout(() => setCopyStatus(null), 3000)
  }

  const handleMount = (editor) => {
    const name = sessionStorage.getItem('rt_user_name') || 'Anonymous'
    editor.user.updateUserPreferences({ name })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(145deg,#ffffff 0%,#f5f0ff 40%,#fdf4ff 70%,#ffffff 100%)' }}>

      {/* floating bg shapes */}
      <div style={{ position:'absolute', top:'8%', right:'12%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'15%', left:'6%', width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'40%', right:'5%', width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle,rgba(192,38,211,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />

      {/* overlay card */}
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
            padding: '16px 18px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 18px 60px rgba(124,58,237,0.12)',
            minWidth: 300,
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:4 }}>
              <span className="g-text" style={{ fontSize:14, fontWeight:900, letterSpacing:0.2 }}>
                Realtime Room
              </span>
              <span style={{
                fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:999,
                background:'rgba(124,58,237,0.08)', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.18)',
              }}>
                {roomIdValue || '—'}
              </span>
            </div>

            <div style={{ fontSize:12, marginTop:4, color:'#6b7280', lineHeight:1.45 }}>
              Everyone with the same room id sees the <b style={{ color:'#7c3aed' }}>same canvas</b> live.
            </div>

            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:16 }}>
              <Link
                to="/"
                onMouseEnter={() => setHomeHover(true)}
                onMouseLeave={() => setHomeHover(false)}
                style={{
                  fontSize:12, fontWeight:700, padding:'8px 16px', borderRadius:999,
                  border:'1.5px solid rgba(124,58,237,0.4)',
                  background: homeHover ? 'rgba(124,58,237,0.08)' : '#ffffff',
                  color:'#7c3aed', textDecoration:'none',
                  boxShadow: homeHover ? '0 4px 14px rgba(124,58,237,0.18)' : '0 2px 8px rgba(124,58,237,0.08)',
                  transition:'all .18s ease',
                }}
              >
                ← Home
              </Link>

              <button
                type="button"
                onClick={copyRoomLink}
                onMouseEnter={() => setCopyHover(true)}
                onMouseLeave={() => setCopyHover(false)}
                style={{
                  fontSize:12, fontWeight:700, padding:'8px 16px', borderRadius:999,
                  border:'1.5px solid rgba(124,58,237,0.4)',
                  background: copyHover ? 'linear-gradient(120deg,#7c3aed,#9333ea)' : '#ffffff',
                  color: copyHover ? '#ffffff' : '#7c3aed',
                  cursor:'pointer',
                  boxShadow: copyHover ? '0 4px 14px rgba(124,58,237,0.28)' : '0 2px 8px rgba(124,58,237,0.08)',
                  transition:'all .18s ease',
                }}
              >
                Copy Room Link
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

      <Tldraw store={store} onMount={handleMount} />
    </div>
  )
}

export default RealTimeComp
