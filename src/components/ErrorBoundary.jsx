import { Component } from 'react'
import { Link } from 'react-router-dom'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'linear-gradient(135deg, #fff5f2 0%, #f6f7ff 100%)',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              background: 'white',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 14,
              padding: 24,
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Something went wrong</div>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75, color: '#0f172a' }}>
              An unexpected error occurred in this part of the app.
            </div>

            <pre
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 8,
                background: '#f8f8f8',
                border: '1px solid rgba(0,0,0,0.08)',
                fontSize: 11,
                overflowX: 'auto',
                color: '#7f1d1d',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error?.message || String(this.state.error)}
            </pre>

            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => this.setState({ error: null })}
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.15)',
                  background: 'white',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Try again
              </button>
              <Link
                to="/"
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: '1px solid black',
                  background: 'black',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
