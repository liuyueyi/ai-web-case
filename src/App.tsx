import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import PixelMatrix from './components/PixelMatrix'
import PuzzleGame from './components/PuzzleGame'
import { sampleMatrix } from './config/matrixConfig'

function App() {
  return (
    <Router basename="/ai-web-case">
      <div className="app">
        <nav style={{ marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '20px' }}>像素矩阵</Link>
          <Link to="/puzzle">拼图游戏</Link>
        </nav>
        <Routes>
          <Route path='/' element={
            <>
              <h1>在线像素块填色游戏</h1>
              <PixelMatrix 
                matrix={sampleMatrix} 
                pixelSize={10}
                activeColor="#4CAF50"
                inactiveColor="#f5f5f5"
              />
            </>
          } />
          <Route path="/puzzle" element={<PuzzleGame />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
