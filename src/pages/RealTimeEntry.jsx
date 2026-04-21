import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const RealTimeEntry = () => {
  const navigate = useNavigate()
  const [roomId, setRoomId] = useState('')
  const [userName, setUserName] = useState('')
  const [btnHover, setBtnHover] = useState(false)
  const trimmed = roomId.trim()

  useEffect(() => { sessionStorage.removeItem('rt_locked_room') }, [])

  const handleGo = () => {
    if (!trimmed) return
    const name = userName.trim() || 'Anonymous'
    sessionStorage.setItem('rt_user_name', name)
    navigate(`/realtime/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
      background: 'linear-gradient(145deg,#ffffff 0%,#f5f0ff 40%,#fdf4ff 70%,#ffffff 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* floating bg shapes */}
      <div style={{ position:'absolute', top:'8%', right:'12%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'15%', left:'6%', width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'40%', right:'5%', width:130, height:130, borderRadius:'50%', background:'radial-gradient(circle,rgba(192,38,211,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />

      <div style={{ position: 'relative', width: 440, maxWidth: '100%' }}>
        {/* conic gradient border card */}
        <div style={{ position:'relative', borderRadius:24, padding:2 }}>
          <div style={{
            position:'absolute', inset:0, borderRadius:24, zIndex:0,
            background:'conic-gradient(from 0deg,#7c3aed,#c026d3,#9333ea,#7c3aed)',
            opacity:0.45,
          }} />
          <div style={{
            position:'relative', zIndex:1,
            background:'rgba(255,255,255,0.97)',
            borderRadius:22,
            padding:'28px 28px',
            backdropFilter:'blur(16px)',
            boxShadow:'0 18px 60px rgba(124,58,237,0.12)',
          }}>
            <Link to="/" style={{ fontSize:12, color:'#7c3aed', opacity:0.75, textDecoration:'none', fontWeight:700, letterSpacing:0.1 }}>
              ← Home
            </Link>

            <div style={{ marginTop:16, fontSize:22, fontWeight:900 }}>
              <span className="g-text">Realtime Collaboration</span>
            </div>
            <div style={{ marginTop:6, fontSize:13, color:'#6b7280', lineHeight:1.55 }}>
              Everyone with the same room id sees the{' '}
              <b style={{ color:'#7c3aed' }}>same canvas</b> live.
            </div>

            <div style={{ marginTop:22 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#7c3aed', marginBottom:6, letterSpacing:0.2 }}>
                Your Name
              </div>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGo() }}
                placeholder="e.g., Jaideep"
                autoFocus
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'
                  e.target.style.borderColor = 'rgba(124,58,237,0.6)'
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none'
                  e.target.style.borderColor = 'rgba(124,58,237,0.35)'
                }}
                style={{
                  width:'100%', padding:'12px 14px', borderRadius:12,
                  border:'1.5px solid rgba(124,58,237,0.35)',
                  background:'rgba(124,58,237,0.03)',
                  outline:'none', boxSizing:'border-box', fontSize:14,
                  color:'#1e1b4b', transition:'box-shadow .18s ease, border-color .18s ease',
                }}
              />
            </div>

            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#7c3aed', marginBottom:6, letterSpacing:0.2 }}>
                Room ID
              </div>
              <input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGo() }}
                placeholder="e.g., team-demo-1"
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'
                  e.target.style.borderColor = 'rgba(124,58,237,0.6)'
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none'
                  e.target.style.borderColor = 'rgba(124,58,237,0.35)'
                }}
                style={{
                  width:'100%', padding:'12px 14px', borderRadius:12,
                  border:'1.5px solid rgba(124,58,237,0.35)',
                  background:'rgba(124,58,237,0.03)',
                  outline:'none', boxSizing:'border-box', fontSize:14,
                  color:'#1e1b4b', transition:'box-shadow .18s ease, border-color .18s ease',
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleGo}
              disabled={!trimmed}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                marginTop:16, width:'100%', padding:'13px',
                borderRadius:12, border:'none',
                background: !trimmed
                  ? 'rgba(124,58,237,0.18)'
                  : btnHover
                    ? 'linear-gradient(120deg,#6d28d9,#7c3aed)'
                    : 'linear-gradient(120deg,#7c3aed,#9333ea)',
                color: !trimmed ? 'rgba(124,58,237,0.5)' : 'white',
                fontWeight:700, fontSize:14,
                cursor: trimmed ? 'pointer' : 'not-allowed',
                boxShadow: trimmed
                  ? (btnHover ? '0 6px 24px rgba(124,58,237,0.4)' : '0 4px 14px rgba(124,58,237,0.25)')
                  : 'none',
                transition:'all .18s ease',
              }}
            >
              Join Realtime Room →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealTimeEntry
