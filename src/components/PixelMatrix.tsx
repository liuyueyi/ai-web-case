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
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
        // 先将字符串转换为 unknown，再转换为具体的键类型
        const numericKey = value as unknown as keyof typeof defaultNumberColors
        return isPreviewMode ? (defaultNumberColors[numericKey] || activeColor) : 'white'
      }
      // 先将字符串转换为 unknown，再转换为具体的键类型
      const letterKey = value as unknown as keyof typeof backgroundLetterColors
      return backgroundLetterColors[letterKey] || activeColor
    } else {
      // 数字类型值直接作为键使用
      return isPreviewMode ? (defaultNumberColors[value] || activeColor) : 'white'
    }
  }
  const [matrixData, setMatrixData] = useState<MatrixData[][]>(() =>
    matrix.map(row => row.map(value => ({ value, color: getPixelColor(value) })))
  )
  const actualPixelSize = pixelSize * scale

  useEffect(() => {
    setMatrixData(matrix.map(row => row.map(value => ({ value, color: getPixelColor(value) }))))
  }, [matrix, isPreviewMode])
  // 渲染Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !matrixData.length) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rows = matrixData.length
    const cols = matrixData[0].length
    const gap = scale // 像素间隙

    // 设置Canvas尺寸
    canvas.width = cols * actualPixelSize + (cols - 1) * gap
    canvas.height = rows * actualPixelSize + (rows - 1) * gap

    // 清空Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制像素
    matrixData.forEach((row, rowIndex) => {
      row.forEach((pixel, colIndex) => {
        const x = colIndex * (actualPixelSize + gap)
        const y = rowIndex * (actualPixelSize + gap)

        // 绘制像素背景
        // console.log('(x,y) 对应的数字 + 颜色', pixel.value, pixel.color, isPreviewMode);
        ctx.fillStyle = pixel.color
        ctx.fillRect(x, y, actualPixelSize, actualPixelSize)

        // 绘制像素值（如果是数字）
        if (!isPreviewMode && pixel.color === 'white' && (typeof pixel.value === 'number' || (!isNaN(Number(pixel.value)) && pixel.value !== ''))) {
          ctx.fillStyle = '#333'
          ctx.font = `bold ${Math.max(actualPixelSize * 0.5, 8)}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(
            pixel.value.toString(),
            x + actualPixelSize / 2,
            y + actualPixelSize / 2
          )
        }
      })
    })
  }, [matrixData, actualPixelSize, scale])
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
  // 处理Canvas点击
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedColor || !canvasRef.current) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const gap = scale
    const totalPixelSize = actualPixelSize + gap
    
    // 计算点击的像素坐标
    const colIndex = Math.floor(x / totalPixelSize)
    const rowIndex = Math.floor(y / totalPixelSize)
    
    // 确保点击在有效范围内
    if (
      rowIndex < 0 || rowIndex >= matrixData.length ||
      colIndex < 0 || colIndex >= matrixData[0].length
    ) return

    // 创建矩阵数据的深拷贝
    const newMatrixData = JSON.parse(JSON.stringify(matrixData))

    // 获取选中颜色对应的key
    const selectedKey = colorPalette.find(([_, color]) => color === selectedColor)?.[0]
    if (!selectedKey) return

    // 获取当前像素的值
    const currentValue = matrixData[rowIndex][colIndex].value.toString()

    // 如果当前像素的值与选中颜色的key相同，则开始连锁反应
    if (currentValue === selectedKey) {
      const updateConnectedPixels = (row: number, col: number, visited: Set<string>) => {
        if (
          row < 0 || row >= newMatrixData.length ||
          col < 0 || col >= newMatrixData[0].length ||
          visited.has(`${row}-${col}`)
        ) return
        
        visited.add(`${row}-${col}`)
        
        const pixelValue = newMatrixData[row][col].value.toString()
        if (pixelValue !== selectedKey) return
        
        newMatrixData[row][col] = {
          ...newMatrixData[row][col],
          color: selectedColor
        }
        
        updateConnectedPixels(row - 1, col, visited)
        updateConnectedPixels(row + 1, col, visited)
        updateConnectedPixels(row, col - 1, visited)
        updateConnectedPixels(row, col + 1, visited)
      }
      
      updateConnectedPixels(rowIndex, colIndex, new Set<string>())
    } else {
      newMatrixData[rowIndex][colIndex] = {
        ...newMatrixData[rowIndex][colIndex],
        color: selectedColor
      }
    }
    
    setMatrixData(newMatrixData)
  }

  useEffect(() => {
    const calculateInitialScale = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.clientWidth - 40
      const containerHeight = window.innerHeight * 0.8 - 150
      
      const matrixWidth = matrix[0]?.length * pixelSize || 0
      const matrixHeight = matrix.length * pixelSize || 0
      
      const widthScale = containerWidth / matrixWidth
      const heightScale = containerHeight / matrixHeight
      
      // 选择较小的缩放比例以确保完全适应容器
      const newScale = Math.min(widthScale, heightScale, 1)
      setScale(newScale)
    }

    calculateInitialScale()
    window.addEventListener('resize', calculateInitialScale)
    
    return () => {
      window.removeEventListener('resize', calculateInitialScale)
    }
  }, [matrix, pixelSize])

  const handleExportImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 创建下载链接
    const link = document.createElement('a')
    link.download = 'pixel-matrix.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div ref={containerRef} className="pixel-matrix-container">
      <div className="controls">
        <button onClick={handleZoomIn}>放大</button>
        <span className="scale-percentage">{Math.round(scale * 100)}%</span>
        <button onClick={handleZoomOut}>缩小</button>
        <button 
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className={isPreviewMode ? 'preview-mode' : 'edit-mode'}
        >
          {isPreviewMode ? '编辑模式' : '预览模式'}
        </button>
        <button onClick={handleExportImage}>导出图片</button>
      </div>
      <div className="color-palette">
        {colorPalette.map(([key, color]) => (
          <div
            key={key}
            className={`color-item ${selectedColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorSelect(color)}
          >
            {key}
          </div>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ cursor: selectedColor ? 'pointer' : 'default' }}
      />
    </div>
  )
}
export default PixelMatrix
 