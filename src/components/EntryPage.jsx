import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function EntryPage({ title, description, buttonLabel, buttonColor = '#0f172a', pathPrefix }) {
  const navigate = useNavigate()
  const [roomId, setRoomId] = useState('')
  const trimmed = roomId.trim()

  const handleGo = () => {
    if (!trimmed) return
    navigate(`${pathPrefix}/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'linear-gradient(135deg, #f6f7ff 0%, #eef7ff 45%, #fff5f2 100%)',
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: '100%',
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 14,
          padding: 24,
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        }}
      >
        <Link
          to="/"
          style={{ fontSize: 12, color: '#0f172a', opacity: 0.6, textDecoration: 'none' }}
        >
          ← Home
        </Link>

        <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 12 }}>{title}</div>
        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75, color: '#0f172a' }}>{description}</div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Room ID</div>
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleGo() }}
            placeholder="e.g., team-demo-1"
            autoFocus
            style={{
              width: '100%',
              padding: '11px 12px',
              marginTop: 6,
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.15)',
              background: 'white',
              outline: 'none',
              boxSizing: 'border-box',
              fontSize: 14,
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleGo}
          disabled={!trimmed}
          style={{
            marginTop: 14,
            width: '100%',
            padding: '12px',
            borderRadius: 10,
            border: 'none',
            background: trimmed ? buttonColor : 'rgba(0,0,0,0.15)',
            color: 'white',
            fontWeight: 700,
            fontSize: 14,
            cursor: trimmed ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
