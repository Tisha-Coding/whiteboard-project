import { useRef, useEffect, useState } from 'react'

const CanvasWhiteboard = ({ onDataChange, initialData, readOnly = false }) => {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(3)
  const [tool, setTool] = useState('pen')
  const [textInput, setTextInput] = useState('')
  const [history, setHistory] = useState([])
  const [historyStep, setHistoryStep] = useState(-1)
  const [filter, setFilter] = useState('none')
  const contextRef = useRef(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const tempCanvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const tempCanvas = document.createElement('canvas')
    tempCanvasRef.current = tempCanvas

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height

    const context = canvas.getContext('2d')
    contextRef.current = context

    applyFilter(context, filter)

    if (initialData) {
      const img = new Image()
      img.onload = () => context.drawImage(img, 0, 0)
      img.src = initialData
    }

    saveToHistory()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      redrawCanvas()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const applyFilter = (ctx, filterType) => {
    if (filterType === 'grayscale') ctx.filter = 'grayscale(100%)'
    else if (filterType === 'sepia') ctx.filter = 'sepia(100%)'
    else if (filterType === 'blur') ctx.filter = 'blur(2px)'
    else if (filterType === 'brightness') ctx.filter = 'brightness(1.2)'
    else ctx.filter = 'none'
  }

  const saveToHistory = () => {
    const canvas = canvasRef.current
    const newHistory = history.slice(0, historyStep + 1)
    newHistory.push(canvas.toDataURL())
    setHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }

  const redrawCanvas = () => {
    if (historyStep >= 0 && history[historyStep]) {
      const img = new Image()
      img.onload = () => {
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        contextRef.current.drawImage(img, 0, 0)
      }
      img.src = history[historyStep]
    }
  }

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1)
      const img = new Image()
      img.onload = () => {
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        contextRef.current.drawImage(img, 0, 0)
      }
      img.src = history[historyStep - 1]
    }
  }

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1)
      const img = new Image()
      img.onload = () => {
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        contextRef.current.drawImage(img, 0, 0)
      }
      img.src = history[historyStep + 1]
    }
  }

  const startDrawing = (e) => {
    if (readOnly) return
    const pos = getMousePos(e)
    startPosRef.current = pos
    setIsDrawing(true)

    if (tool === 'pen' || tool === 'eraser') {
      contextRef.current.beginPath()
      contextRef.current.moveTo(pos.x, pos.y)
    }
  }

  const getMousePos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const getTouchPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  }

  const draw = (e) => {
    if (!isDrawing || readOnly) return
    const pos = 'touches' in e ? getTouchPos(e) : getMousePos(e)

    if (tool === 'pen') {
      contextRef.current.strokeStyle = color
      contextRef.current.lineWidth = brushSize
      contextRef.current.lineTo(pos.x, pos.y)
      contextRef.current.stroke()
    } else if (tool === 'eraser') {
      contextRef.current.clearRect(pos.x - brushSize / 2, pos.y - brushSize / 2, brushSize, brushSize)
    } else if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
      redrawCanvas()
      drawShape(startPosRef.current, pos, tool)
    }
  }

  const drawShape = (start, end, shapeType) => {
    const ctx = contextRef.current
    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.fillStyle = `${color}20`

    if (shapeType === 'line') {
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    } else if (shapeType === 'rectangle') {
      const width = end.x - start.x
      const height = end.y - start.y
      ctx.fillRect(start.x, start.y, width, height)
      ctx.strokeRect(start.x, start.y, width, height)
    } else if (shapeType === 'circle') {
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
      ctx.beginPath()
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    }
  }

  const endDrawing = () => {
    contextRef.current.closePath()
    setIsDrawing(false)
    saveToHistory()
    if (onDataChange) {
      onDataChange(canvasRef.current.toDataURL())
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height)
    saveToHistory()
    if (onDataChange) onDataChange(canvas.toDataURL())
  }

  const downloadDrawing = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `whiteboard-${Date.now()}.png`
    link.click()
  }

  const addText = (e) => {
    if (!textInput.trim()) return
    const canvas = canvasRef.current
    const ctx = contextRef.current
    const pos = getMousePos(e)

    ctx.font = `${brushSize * 4}px Arial`
    ctx.fillStyle = color
    ctx.fillText(textInput, pos.x, pos.y)
    setTextInput('')
    saveToHistory()
    if (onDataChange) onDataChange(canvas.toDataURL())
  }

  const applyCanvasFilter = (filterType) => {
    setFilter(filterType)
    applyFilter(contextRef.current, filterType)
    redrawCanvas()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
        style={{ display: 'block', cursor: readOnly ? 'default' : 'crosshair', touchAction: 'none' }}
      />

      {!readOnly && (
        <>
          {/* Toolbar */}
          <div style={{
            position: 'absolute', top: 20, left: 20, zIndex: 100,
            background: 'rgba(255,255,255,0.98)', padding: 20, borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)', backdropFilter: 'blur(10px)',
            maxHeight: '90vh', overflowY: 'auto', minWidth: 200
          }}>
            {/* Tools */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 8, color: '#666', textTransform: 'uppercase' }}>
                Tool
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {['pen', 'eraser', 'line', 'rectangle', 'circle', 'text'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTool(t)}
                    style={{
                      padding: '8px 10px', borderRadius: 6, border: 'none',
                      background: tool === t ? '#7c3aed' : '#e5e7eb',
                      color: tool === t ? '#fff' : '#333', cursor: 'pointer',
                      fontWeight: 600, fontSize: 11
                    }}
                  >
                    {t === 'pen' && '✏️'}
                    {t === 'eraser' && '🗑️'}
                    {t === 'line' && '📏'}
                    {t === 'rectangle' && '▭'}
                    {t === 'circle' && '○'}
                    {t === 'text' && '𝐀'}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 8, color: '#666', textTransform: 'uppercase' }}>
                Color
              </label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: '100%', height: 40, border: 'none', borderRadius: 6, cursor: 'pointer' }}
              />
            </div>

            {/* Brush Size */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 8, color: '#666', textTransform: 'uppercase' }}>
                Size: {brushSize}px
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Text Input */}
            {tool === 'text' && (
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type text..."
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6,
                    border: '1px solid #ddd', fontSize: 12, marginBottom: 8
                  }}
                />
                <button
                  onClick={addText}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 6, border: 'none',
                    background: '#7c3aed', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 11
                  }}
                >
                  Add Text
                </button>
              </div>
            )}

            {/* Filters */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 8, color: '#666', textTransform: 'uppercase' }}>
                Effects
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {['none', 'grayscale', 'sepia', 'blur', 'brightness'].map(f => (
                  <button
                    key={f}
                    onClick={() => applyCanvasFilter(f)}
                    style={{
                      padding: '8px 10px', borderRadius: 6, border: 'none',
                      background: filter === f ? '#7c3aed' : '#e5e7eb',
                      color: filter === f ? '#fff' : '#333', cursor: 'pointer',
                      fontWeight: 600, fontSize: 10
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* History */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              <button
                onClick={undo}
                disabled={historyStep <= 0}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: 6, border: 'none',
                  background: historyStep <= 0 ? '#ddd' : '#7c3aed',
                  color: '#fff', cursor: historyStep <= 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: 11
                }}
              >
                ↶ Undo
              </button>
              <button
                onClick={redo}
                disabled={historyStep >= history.length - 1}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: 6, border: 'none',
                  background: historyStep >= history.length - 1 ? '#ddd' : '#7c3aed',
                  color: '#fff', cursor: historyStep >= history.length - 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: 11
                }}
              >
                ↷ Redo
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                onClick={downloadDrawing}
                style={{
                  padding: '10px 12px', borderRadius: 6, border: 'none',
                  background: '#10b981', color: '#fff', cursor: 'pointer',
                  fontWeight: 600, fontSize: 11
                }}
              >
                💾 Save
              </button>
              <button
                onClick={clearCanvas}
                style={{
                  padding: '10px 12px', borderRadius: 6, border: 'none',
                  background: '#ef4444', color: '#fff', cursor: 'pointer',
                  fontWeight: 600, fontSize: 11
                }}
              >
                🧹 Clear
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CanvasWhiteboard
