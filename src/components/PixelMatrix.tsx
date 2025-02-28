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
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  // 从defaultNumberColors中提取颜色值初始化调色板，保持键值对映射关系
  const colorPalette = Object.entries(defaultNumberColors)
  // 获取像素颜色的函数
  function getPixelColor(value: number | string): string {
    if (value === 0) return inactiveColor
    if (typeof value === 'string') {
      // 检查字符串是否为数字
      const isNumericString = !isNaN(Number(value))
      if (isNumericString) {
        return isPreviewMode ? (defaultNumberColors[value as keyof typeof defaultNumberColors] || activeColor) : 'white'
      }
      return backgroundLetterColors[value as keyof typeof backgroundLetterColors] || activeColor
    }
    return defaultNumberColors[value.toString() as keyof typeof defaultNumberColors] || `#${Math.abs(value).toString(16).padStart(6, '0')}`
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
  const handlePixelClick = (event: React.MouseEvent<HTMLDivElement>, rowIndex: number, colIndex: number) => {
    if (!selectedColor) return
  // 获取选中颜色对应的key
    const selectedKey = colorPalette.find(([_, color]) => color === selectedColor)?.[0]
    if (!selectedKey) return
  // 获取当前像素的值
    const currentValue = matrixData[rowIndex][colIndex].value.toString()
  // 如果当前像素的值与选中颜色的key相同，则开始连锁反应
    if (currentValue === selectedKey) {
      const updateConnectedPixels = (row: number, col: number, visited: Set<string>) => {
        // 检查边界条件和是否已访问
        if (
          row < 0 || row >= matrixData.length ||
          col < 0 || col >= matrixData[0].length ||
          visited.has(`${row}-${col}`)
        ) return
  // 标记为已访问
        visited.add(`${row}-${col}`)
  // 检查当前像素值是否匹配
        const pixelValue = matrixData[row][col].value.toString()
        if (pixelValue !== selectedKey) return
  // 更新当前像素的颜色
        const pixelElement = document.querySelector(
          `.pixel-matrix .pixel[data-row="${row}"][data-col="${col}"]`
        ) as HTMLElement
        if (pixelElement) {
          pixelElement.style.backgroundColor = selectedColor
        }
  // 递归检查上下左右相邻的像素
        updateConnectedPixels(row - 1, col, visited) // 上
        updateConnectedPixels(row + 1, col, visited) // 下
        updateConnectedPixels(row, col - 1, visited) // 左
        updateConnectedPixels(row, col + 1, visited) // 右
      }
  // 开始连锁更新
      updateConnectedPixels(rowIndex, colIndex, new Set<string>())
    } else {
      // 如果当前像素的值与选中颜色的key不同，则更新当前像素的颜色
      const pixelElement = document.querySelector(
        `.pixel-matrix .pixel[data-row="${rowIndex}"][data-col="${colIndex}"]`
      ) as HTMLElement
      if (pixelElement) {
        pixelElement.style.backgroundColor = selectedColor
      }
    }
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
        {colorPalette.map(([key, color]) => (
          <div
            key={key}
            className={`color-block ${selectedColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorSelect(color)}
          >
            <span className="color-key">{key}</span>
          </div>
        ))}
      </div>
      <div className="zoom-controls">
        <button onClick={handleZoomOut} className="zoom-button">-</button>
        <span className="zoom-level">{Math.round(scale * 100)}%</span>
        <button onClick={handleZoomIn} className="zoom-button">+</button>
        <button
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className={`preview-toggle ${isPreviewMode ? 'active' : ''}`}
          style={{
            padding: '4px 12px',
            borderRadius: '15px',
            border: 'none',
            backgroundColor: isPreviewMode ? '#4CAF50' : '#e0e0e0',
            color: isPreviewMode ? 'white' : '#666',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginLeft: '10px'
          }}
        >
          {isPreviewMode ? '预览开启' : '预览关闭'}
        </button>
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
              data-row={rowIndex}
              data-col={colIndex}
              style={{
                width: `${actualPixelSize}px`,
                height: `${actualPixelSize}px`,
                backgroundColor: pixel.color,
                cursor: selectedColor ? 'pointer' : 'default'
              }}
              onClick={(event) => handlePixelClick(event, rowIndex, colIndex)}
            >
              {(typeof pixel.value === 'number' || (!isNaN(Number(pixel.value)) && pixel.value !== '')) && (
                <span className="pixel-value" style={{ fontSize: `${Math.max(actualPixelSize * 0.88, 4)}px` }}>{pixel.value}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PixelMatrix