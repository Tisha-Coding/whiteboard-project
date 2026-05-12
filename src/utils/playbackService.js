export const playbackDrawing = async (canvasRef, imageDataUrl, speed = 1) => {
  return new Promise((resolve) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      const startTime = performance.now()
      const duration = 3000 / speed

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.globalAlpha = progress
        ctx.drawImage(img, 0, 0)
        ctx.globalAlpha = 1

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }

      requestAnimationFrame(animate)
    }

    img.src = imageDataUrl
  })
}

export const extractDrawingStrokes = (imageDataUrl) => {
  return {
    imageData: imageDataUrl,
    duration: 3000
  }
}
