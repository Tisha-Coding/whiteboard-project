import { useState } from 'react'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { Link } from 'react-router-dom'

const INITIAL_KEY = 'local-whiteboard'

const TestComp = () => {
  const [persistenceKey, setPersistenceKey] = useState(INITIAL_KEY)
  const [resetHover, setResetHover] = useState(false)
  const [homeHover, setHomeHover] = useState(false)

  const handleReset = () => {
    try {
      localStorage.removeItem(persistenceKey)
      localStorage.removeItem(`${persistenceKey}-index`)
    } catch (_) {}
    setPersistenceKey(`local-${Date.now()}`)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(145deg,#ffffff 0%,#f5f0ff 40%,#fdf4ff 70%,#ffffff 100%)' }}>

      {/* floating bg shapes */}
      <div style={{ position:'absolute', top:'8%', right:'12%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'15%', left:'6%', width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'40%', right:'5%', width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle,rgba(192,38,211,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />

      {/* overlay card */}
      <div style={{ position: 'absolute', top: 60, left: 14, zIndex: 20, pointerEvents: 'none' }}>

        {/* spinning border wrapper */}
        <div style={{ position:'relative', borderRadius:20, padding:2, background:'transparent' }}>
          <div style={{
            position:'absolute', inset:0, borderRadius:20, zIndex:0,
            background:'conic-gradient(from 0deg,#7c3aed,#c026d3,#9333ea,#7c3aed)',
            opacity:0.45,
          }} />
          <div
            style={{
              pointerEvents: 'auto',
              position: 'relative', zIndex: 1,
              background: 'rgba(255,255,255,0.97)',
              borderRadius: 18,
              padding: '16px 18px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 18px 60px rgba(124,58,237,0.12)',
              minWidth: 300,
            }}
          >
            {/* header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:4 }}>
              <span className="g-text" style={{ fontSize:14, fontWeight:900, letterSpacing:0.2 }}>
                Local Whiteboard
              </span>
              <span style={{
                fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:999,
                background:'rgba(124,58,237,0.08)', color:'#7c3aed', border:'1px solid rgba(124,58,237,0.18)',
              }}>
                Autosaves locally
              </span>
            </div>

            <div style={{ fontSize:12, marginTop:4, color:'#6b7280', lineHeight:1.45 }}>
              This board saves only on <b style={{ color:'#7c3aed' }}>your</b> browser. Reset clears everything and starts fresh.
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
                onClick={handleReset}
                onMouseEnter={() => setResetHover(true)}
                onMouseLeave={() => setResetHover(false)}
                style={{
                  fontSize:12, fontWeight:700, padding:'8px 16px', borderRadius:999,
                  border:'1.5px solid rgba(124,58,237,0.4)',
                  background: resetHover ? 'linear-gradient(120deg,#7c3aed,#9333ea)' : '#ffffff',
                  color: resetHover ? '#ffffff' : '#7c3aed',
                  cursor:'pointer',
                  boxShadow: resetHover ? '0 4px 14px rgba(124,58,237,0.28)' : '0 2px 8px rgba(124,58,237,0.08)',
                  transition:'all .18s ease',
                }}
              >
                Reset Board
              </button>
            </div>
          </div>
        </div>
      </div>

      <Tldraw persistenceKey={persistenceKey} />
    </div>
  )
}

export default TestComp
