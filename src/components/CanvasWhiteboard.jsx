import { useRef, useEffect, useState } from 'react'

const CanvasWhiteboard = ({ onDataChange, initialData, readOnly = false }) => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(3)
  const [tool, setTool] = useState('pen')
  const contextRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const context = canvas.getContext('2d')
    context.lineCap = 'round'
    context.lineJoin = 'round'
    contextRef.current = context

    if (initialData) {
      const img = new Image()
      img.onload = () => context.drawImage(img, 0, 0)
      img.src = initialData
    }

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [initialData])

  const startDrawing = (e) => {
    if (readOnly) return
    const { offsetX, offsetY } = e.nativeEvent
    contextRef.current.beginPath()
    contextRef.current.moveTo(offsetX, offsetY)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing || readOnly) return
    const { offsetX, offsetY } = e.nativeEvent

    if (tool === 'pen') {
      contextRef.current.strokeStyle = color
      contextRef.current.lineWidth = brushSize
      contextRef.current.lineTo(offsetX, offsetY)
      contextRef.current.stroke()
    } else if (tool === 'eraser') {
      contextRef.current.clearRect(offsetX - brushSize / 2, offsetY - brushSize / 2, brushSize, brushSize)
    }
  }

  const endDrawing = () => {
    contextRef.current.closePath()
    setIsDrawing(false)
    if (onDataChange) {
      onDataChange(canvasRef.current.toDataURL())
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height)
    if (onDataChange) onDataChange(canvas.toDataURL())
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        style={{ display: 'block', cursor: readOnly ? 'default' : 'crosshair' }}
      />

      {!readOnly && (
        <div style={{
          position: 'absolute', top: 20, left: 20, zIndex: 10,
          background: 'rgba(255,255,255,0.95)', padding: 20, borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)'
        }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#333' }}>
              Color
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: 50, height: 40, border: 'none', borderRadius: 6, cursor: 'pointer' }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#333' }}>
              Brush Size: {brushSize}px
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              style={{ width: 140 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              onClick={() => setTool('pen')}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 6, border: 'none',
                background: tool === 'pen' ? '#7c3aed' : '#e5e7eb', color: tool === 'pen' ? '#fff' : '#333',
                cursor: 'pointer', fontWeight: 600, fontSize: 12
              }}
            >
              ✏️ Pen
            </button>
            <button
              onClick={() => setTool('eraser')}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 6, border: 'none',
                background: tool === 'eraser' ? '#7c3aed' : '#e5e7eb', color: tool === 'eraser' ? '#fff' : '#333',
                cursor: 'pointer', fontWeight: 600, fontSize: 12
              }}
            >
              🗑️ Erase
            </button>
          </div>

          <button
            onClick={clearCanvas}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 6, border: 'none',
              background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12
            }}
          >
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  )
}

export default CanvasWhiteboard
