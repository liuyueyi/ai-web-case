import { FC, useState, useEffect, useRef } from 'react'
import '../styles/PixelMatrix.css'
import { defaultNumberColors } from '../config/colorConfig'
import { backgroundLetterColors } from '../config/borderColorsConfig'

interface PixelMatrixProps {
  matrix: (number | string)[][]
  pixelSize?: number
  activeColor?: string
  inactiveColor?: string
}

interface MatrixData {
  value: number | string
  color: string
}

const PixelMatrix: FC<PixelMatrixProps> = ({
  matrix,
  pixelSize = 20,
  activeColor = '#000000',
  inactiveColor = '#ffffff'
}) => {
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedColor, setSelectedColor] = useState('')
  // 从defaultNumberColors中提取颜色值初始化调色板
  const colorPalette = Array.from(new Set(Object.values(defaultNumberColors)))

  // 获取像素颜色的函数
  function getPixelColor(value: number | string) {
    if (value === 0) return inactiveColor
    if (typeof value === 'string') {
      // 检查字符串是否为数字
      const isNumericString = !isNaN(Number(value))
      if (isNumericString) {
        return defaultNumberColors[value] || inactiveColor
      }
      return backgroundLetterColors[value] || activeColor
    } else {
      return defaultNumberColors[value] || inactiveColor
    }
  }

  const [matrixData, setMatrixData] = useState<MatrixData[][]>(() =>
    matrix.map(row => row.map(value => ({ value, color: getPixelColor(value) })))
  )
  const actualPixelSize = pixelSize * scale

  useEffect(() => {
    setMatrixData(matrix.map(row => row.map(value => ({ value, color: getPixelColor(value) }))))
  }, [matrix, getPixelColor])

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5))
  }

  // 处理颜色选择
  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
  }

  // 处理像素点击
  const handlePixelClick = (rowIndex: number, colIndex: number) => {
    if (!selectedColor) return

    setMatrixData(prev => {
      const newMatrix = [...prev]
      newMatrix[rowIndex][colIndex] = {
        ...newMatrix[rowIndex][colIndex],
        color: selectedColor
      }
      return newMatrix
    })
  }

  useEffect(() => {
    const calculateInitialScale = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.clientWidth - 40 // 减去padding
      const containerHeight = window.innerHeight * 0.8 - 150 // 减去其他元素的高度和边距
      
      const matrixWidth = matrix[0]?.length * pixelSize || 0
      const matrixHeight = matrix.length * pixelSize || 0

      if (matrixWidth === 0 || matrixHeight === 0) return

      const scaleX = containerWidth / matrixWidth
      const scaleY = containerHeight / matrixHeight
      const initialScale = Math.min(Math.min(scaleX, scaleY), 3) // 限制最大缩放比例为3
      
      setScale(Math.max(initialScale, 0.5)) // 限制最小缩放比例为0.5
    }

    calculateInitialScale()
    window.addEventListener('resize', calculateInitialScale)

    return () => window.removeEventListener('resize', calculateInitialScale)
  }, [matrix, pixelSize])

  return (
    <div className="pixel-matrix-container" ref={containerRef}>
      <div className="color-palette">
        {colorPalette.map((color, index) => (
          <div
            key={index}
            className={`color-block ${selectedColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorSelect(color)}
          />
        ))}
      </div>
      <div className="zoom-controls">
        <button onClick={handleZoomOut} className="zoom-button">-</button>
        <span className="zoom-level">{Math.round(scale * 100)}%</span>
        <button onClick={handleZoomIn} className="zoom-button">+</button>
      </div>
      <div 
        className="pixel-matrix"
        style={{
          gridTemplateColumns: `repeat(${matrix[0]?.length || 0}, ${actualPixelSize}px)`,
          gap: `${scale}px`
        }}
      >
        {matrixData.map((row, rowIndex) =>
          row.map((pixel, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="pixel"
              style={{
                width: `${actualPixelSize}px`,
                height: `${actualPixelSize}px`,
                backgroundColor: pixel.color,
                cursor: selectedColor ? 'pointer' : 'default'
              }}
              onClick={() => handlePixelClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default PixelMatrix