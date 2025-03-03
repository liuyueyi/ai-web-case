import { FC, useState, useEffect, useRef } from 'react'
import '../styles/PixelMatrix.css'
import { defaultNumberColors } from '../config/colorConfig'
import { backgroundLetterColors } from '../config/borderColorsConfig'
import FileUploader from './FileUploader'

interface CustomConfig {
  numColorMap: Record<string, string>;
  borderColorMap: Record<string, string>;
}

interface PixelMatrixProps {
  matrix: (number | string)[][]
  pixelSize?: number
  activeColor?: string
  inactiveColor?: string
  onMatrixUpdate?: (matrix: (number | string)[][]) => void;
}

interface MatrixData {
  value: number | string
  color: string
}

interface FileHistory {
  id: string;
  name: string;
  config: {
    numColorMap: Record<string, string>;
    borderColorMap: Record<string, string>;
    matrix: (number | string)[][];
  };
  timestamp: number;
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
  const [showNumbers, setShowNumbers] = useState(false)
  const [hasSelectedColor, setHasSelectedColor] = useState(false)
  const [customConfig, setCustomConfig] = useState<CustomConfig | null>(null)
  const [fileHistory, setFileHistory] = useState<FileHistory[]>(() => {
    const savedHistory = localStorage.getItem('pixelMatrixHistory')
    return savedHistory ? JSON.parse(savedHistory) : []
  })
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string | null>(null)
  // 从defaultNumberColors中提取颜色值初始化调色板，保持键值对映射关系
  const colorPalette = customConfig ? Object.entries(customConfig.numColorMap) : Object.entries(defaultNumberColors)
  
  // 获取像素颜色的函数
  function getPixelColor(value: number | string): string {
    if (value === 0) return inactiveColor
    if (typeof value === 'string') {
      // 检查字符串是否为数字
      const isNumericString = !isNaN(Number(value))
      if (isNumericString) {
        // 如果是数字字符串，在编辑模式下使用白色
        if (!isPreviewMode) return 'white'
        // 在预览模式下使用配置的颜色
        const numericValue = value.toString()
        const colorMap = customConfig ? customConfig.numColorMap : defaultNumberColors
        return (colorMap as Record<string, string>)[numericValue] || activeColor
      }
      // 如果是字母，使用边框颜色配置
      const letterKey = value
      const borderMap = customConfig ? customConfig.borderColorMap : backgroundLetterColors
      return (borderMap as Record<string, string>)[letterKey] || activeColor
    } else {
      // 如果是数字类型，在编辑模式下使用白色
      if (!isPreviewMode) return 'white'
      // 在预览模式下使用配置的颜色
      const numericValue = value.toString()
      const colorMap = customConfig ? customConfig.numColorMap : defaultNumberColors
      return (colorMap as Record<string, string>)[numericValue] || activeColor
    }
  }
  const [matrixData, setMatrixData] = useState<MatrixData[][]>(() =>
    matrix.map(row => row.map(value => ({ value, color: getPixelColor(value) })))
  )
  const [currentMatrix, setCurrentMatrix] = useState(matrix)
  const actualPixelSize = pixelSize * scale

  useEffect(() => {
    setMatrixData(currentMatrix.map(row => row.map(value => ({ value, color: getPixelColor(value) }))))
  }, [currentMatrix, isPreviewMode, customConfig])
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
        ctx.fillStyle = pixel.color
        ctx.fillRect(x, y, actualPixelSize, actualPixelSize)

        // 绘制像素值（如果是数字且显示开关打开）
        if (!isPreviewMode && showNumbers && pixel.color === 'white' && (typeof pixel.value === 'number' || (!isNaN(Number(pixel.value)) && pixel.value !== ''))) {
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
  }, [matrixData, actualPixelSize, scale, showNumbers])
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3))
  }
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.2))
  }
  
  // 处理颜色选择
  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    if (!hasSelectedColor) {
      setShowNumbers(true)
      setHasSelectedColor(true)
    }
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

  const handleHistorySelect = (item: FileHistory) => {
    setSelectedHistoryId(item.id)
    setCustomConfig({
      numColorMap: item.config.numColorMap,
      borderColorMap: item.config.borderColorMap
    })
    setCurrentMatrix(item.config.matrix)
  }

  const handleNameEdit = (id: string, newName: string) => {
    const updatedHistory = fileHistory.map(item =>
      item.id === id ? { ...item, name: newName } : item
    )
    setFileHistory(updatedHistory)
    setEditingName(null)
    localStorage.setItem('pixelMatrixHistory', JSON.stringify(updatedHistory))
  }

  const [isDrawing, setIsDrawing] = useState(false)

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    handleCanvasClick(event)
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !selectedColor || !canvasRef.current) return
    handleCanvasClick(event)
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleConfigLoad = (config: { numColorMap: Record<string, string>; borderColorMap: Record<string, string>; matrix: (number | string)[][] }) => {
    setCustomConfig({
      numColorMap: config.numColorMap,
      borderColorMap: config.borderColorMap
    })
    setCurrentMatrix(config.matrix)

    // 生成唯一ID
    const newHistoryId = Date.now().toString()

    // 创建新的历史记录
    const newHistoryItem: FileHistory = {
      id: newHistoryId,
      name: `配置 ${fileHistory.length + 1}`,
      config: config,
      timestamp: Date.now()
    }

    // 更新历史记录
    const updatedHistory = [...fileHistory, newHistoryItem]
    setFileHistory(updatedHistory)
    setSelectedHistoryId(newHistoryId)

    // 保存到localStorage
    localStorage.setItem('pixelMatrixHistory', JSON.stringify(updatedHistory))
  }
  return (
    <div ref={containerRef} className="pixel-matrix-container">
      <div className="main-content">
        <FileUploader onConfigLoad={handleConfigLoad} />
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
          <button onClick={() => setShowNumbers(!showNumbers)}>
            {showNumbers ? '隐藏数字' : '显示数字'}
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
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: selectedColor ? 'pointer' : 'default' }}
        />
      </div>
      <div className="history-panel">
        <h3>文件历史</h3>
        <div className="history-list">
          {fileHistory.map((item) => (
            <div
              key={item.id}
              className={`history-item ${selectedHistoryId === item.id ? 'selected' : ''}`}
              onClick={() => handleHistorySelect(item)}
            >
              {editingName === item.id ? (
                <input
                  type="text"
                  defaultValue={item.name}
                  onBlur={(e) => handleNameEdit(item.id, e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleNameEdit(item.id, e.currentTarget.value)
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <div className="history-item-content">
                  <span>{item.name}</span>
                  <button
                    className="edit-name-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingName(item.id)
                    }}
                  >
                    ✎
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default PixelMatrix
 