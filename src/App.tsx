import './App.css'
import PixelMatrix from './components/PixelMatrix'
import { sampleMatrix } from './config/matrixConfig'

function App() {
  return (
    <div className="app">
      <h1>像素矩阵渲染</h1>
      <PixelMatrix 
        matrix={sampleMatrix} 
        pixelSize={3}
        activeColor="#4CAF50"
        inactiveColor="#f5f5f5"
      />
    </div>
  )
}

export default App
