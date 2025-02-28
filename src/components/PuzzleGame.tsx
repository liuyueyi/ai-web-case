import { useState, useEffect } from 'react';
import '../styles/PuzzleGame.css';

interface Tile {
  id: number;
  currentPos: number;
  correctPos: number;
  imageUrl: string;
}

interface GameConfig {
  size: number;
  imageUrl: string;
}

const DIFFICULTY_LEVELS = {
  easy: { size: 3, label: '简单 (3x3)' },
  medium: { size: 4, label: '中等 (4x4)' },
  hard: { size: 5, label: '困难 (5x5)' },
};

const SAMPLE_IMAGES = [
  { url: 'https://picsum.photos/300/300', label: '随机图片' },
  { url: 'https://source.unsplash.com/300x300/?nature', label: '自然风景' },
  { url: 'https://source.unsplash.com/300x300/?animal', label: '可爱动物' },
];

const PuzzleGame: React.FC = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [config, setConfig] = useState<GameConfig>({
    size: DIFFICULTY_LEVELS.easy.size,
    imageUrl: SAMPLE_IMAGES[0].url,
  });

  // 音效
  const playMoveSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1NOTQrHxEOBwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQYULEtxo9L///v39fXz8/Pz9PT19vf4+fr7/Pz9/f39/f39/fz8+/r5+Pb18/Lw7+7t7ezs7e3u7/Hy9PX3+fr7/P3+/v7+/v79/Pv6+ff29PPx8O/u7e3t7e7v8PHy9PX3+Pn6+/z9/f39/f39/Pv6+fj29fPy8O/u7e3t7e7v8PHy9PX3+Pn6+/z8/f39/f38/Pv6+fj29fPy8PDv7u3t7e3u7/Dx8vT19vf4+fr7/Pz9/f39/f38+/r5+Pf18/Lx7+/u7e3t7u/w8fL09fb3+Pn6+/z8/f39/f39/Pv6+fj39vTz8fDv7u3t7e3u7/Dx8/T19vf4+fr7/Pz9/f39/f38+/r5+Pf29PPx8O/u7e3t7e7v8PHy9PX29/j5+vv8/P39/f39/fz7+vn49/b08/Lw7+7t7e3t7u/w8fP09vf4+fr7/Pz9/f39/f38/Pv6+fj39fTy8fDv7u3t7e3u7/Dy8/T19/j5+vv8/P39/f39/fz7+vn49/b08/Lx7+7t7e3t7u/x8vP09vf4+fr7/Pz9/f39/f38+/r5+Pf29PTy8fDv7u3t7e7v8PHy9PX29/j5+vv8/P39/f39/fz7+vr5+Pf19PPx8O/u7e3t7e7v8PHy9PX29/j5+vv8/P39/f39/f38+/r5+Pf29PPy8PDv7u3t7e7v8PHz9PX29/j5+vv8/P39/f39/fz8+/r5+Pf29PTy8fDv7u3t7e7v8PHz9PX29/j5+vv7/Pz9/f39/f38/Pv6+fj39vTz8vHw7+7t7e3u7/Dx8vP09fb3+Pn6+/v8/P39/f39/f38+/r5+Pf29fTz8vHw7+7t7e3u7/Dx8vP09fb3+Pn6+/v8/P39/f39/f38/Pv6+fj39vXz8vHw7+7t7e3u7u/w8fLz9PX29/j4+fr7+/z8/f39/f39/f38+/r6+fj39vXz8vHw7+7t7e3u7u/w8fLz9PX29/j4+fr7+/z8/f39/f39/f38/Pv6+fj39vXz8vHw7+7t7e3u7u/w8fLz9PX29/j4+fr7+/z8/f39');
    audio.volume = 0.2;
    audio.play();
  };

  const playVictorySound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1NOTQrHxEOBwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQYULEtxo9L///v39fXz8/Pz9PT19vf4+fr7/Pz9/f39/f39/fz8+/r5+Pb18/Lw7+7t7ezs7e3u7/Hy9PX3+fr7/P3+/v7+/v79/Pv6+ff29PPx8O/u7e3t7e7v8PHy9PX3+Pn6+/z9/f39/f39/Pv6+fj29fPy8O/u7e3t7e7v8PHy9PX3+Pn6+/z8/f39/f38/Pv6+fj29fPy8PDv7u3t7e3u7/Dx8vT19vf4+fr7/Pz9/f39/f38+/r5+Pf18/Lx7+/u7e3t7u/w8fL09fb3+Pn6+/z8/f39/f39/Pv6+fj39vTz8fDv7u3t7e3u7/Dx8/T19vf4+fr7/Pz9/f39/f38+/r5+Pf29PPx8O/u7e3t7e7v8PHy9PX29/j5+vv8/P39/f39/fz7+vn49/b08/Lw7+7t7e3t7u/w8fP09vf4+fr7/Pz9/f39/f38/Pv6+fj39fTy8fDv7u3t7e3u7/Dy8/T19/j5+vv8/P39/f39/fz7+vn49/b08/Lx7+7t7e3t7u/x8vP09vf4+fr7/Pz9/f39/f38+/r5+Pf29PTy8fDv7u3t7e7v8PHy9PX29/j5+vv8/P39/f39/fz7+vr5+Pf19PPx8O/u7e3t7e7v8PHy9PX29/j5+vv8/P39/f39/f38+/r5+Pf29PPy8PDv7u3t7e7v8PHz9PX29/j5+vv8/P39/f39/fz8+/r5+Pf29PTy8fDv7u3t7e7v8PHz9PX29/j5+vv7/Pz9/f39/f38/Pv6+fj39vTz8vHw7+7t7e3u7/Dx8vP09fb3+Pn6+/v8/P39/f39/f38+/r5+Pf29fTz8vHw7+7t7e3u7/Dx8vP09fb3+Pn6+/v8/P39/f39/f38/Pv6+fj39vXz8vHw7+7t7e3u7u/w8fLz9PX29/j4+fr7+/z8/f39/f39/f38+/r6+fj39vXz8vHw7+7t7e3u7u/w8fLz9PX29/j4+fr7+/z8/f39/f39/f38/Pv6+fj39vXz8vHw7+7t7e3u7u/w8fLz9PX29/j4+fr7+/z8/f39');
    audio.volume = 0.3;
    audio.play();
  };

  // 初始化拼图
  const initializePuzzle = () => {
    const newTiles: Tile[] = [];
    const tileSize = 100;
    const totalTiles = config.size * config.size;

    for (let i = 0; i < totalTiles; i++) {
      const row = Math.floor(i / config.size);
      const col = i % config.size;
      newTiles.push({
        id: i,
        currentPos: i,
        correctPos: i,
        imageUrl: `${config.imageUrl}#tile-${i}`,
      });
    }

    setTiles(shuffleTiles(newTiles));
    setMoves(0);
    setTime(0);
    setIsPlaying(true);
    setIsComplete(false);
  };

  // 打乱拼图
  const shuffleTiles = (tiles: Tile[]): Tile[] => {
    const shuffled = [...tiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i].currentPos, shuffled[j].currentPos] = 
      [shuffled[j].currentPos, shuffled[i].currentPos];
    }
    return shuffled;
  };

  // 交换拼图位置
  const swapTiles = (index1: number, index2: number) => {
    const newTiles = [...tiles];
    const tile1 = newTiles.find(t => t.currentPos === index1);
    const tile2 = newTiles.find(t => t.currentPos === index2);

    if (tile1 && tile2) {
      const tempPos = tile1.currentPos;
      tile1.currentPos = tile2.currentPos;
      tile2.currentPos = tempPos;
      setTiles(newTiles);
      setMoves(moves + 1);
      playMoveSound();
      checkCompletion(newTiles);
    }
  };

  // 检查是否完成
  const checkCompletion = (currentTiles: Tile[]) => {
    const isComplete = currentTiles.every(tile => tile.currentPos === tile.correctPos);
    if (isComplete) {
      setIsComplete(true);
      setIsPlaying(false);
      playVictorySound();
    }
  };

  // 计时器
  useEffect(() => {
    let timer: number;
    if (isPlaying) {
      timer = window.setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  return (
    <div className="puzzle-game">
      <div className="game-config">
        <select 
          value={config.size} 
          onChange={(e) => setConfig(prev => ({ ...prev, size: Number(e.target.value) }))}
          disabled={isPlaying}
        >
          {Object.entries(DIFFICULTY_LEVELS).map(([key, { size, label }]) => (
            <option key={key} value={size}>{label}</option>
          ))}
        </select>
        <select 
          value={config.imageUrl} 
          onChange={(e) => setConfig(prev => ({ ...prev, imageUrl: e.target.value }))}
          disabled={isPlaying}
        >
          {SAMPLE_IMAGES.map((image, index) => (
            <option key={index} value={image.url}>{image.label}</option>
          ))}
        </select>
      </div>
      <div className="game-info">
        <p>移动次数: {moves}</p>
        <p>用时: {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</p>
      </div>
      <div className="puzzle-board" style={{ 
        gridTemplateColumns: `repeat(${config.size}, 1fr)`,
        width: '300px',
        height: '300px'
      }}>
        {tiles.map(tile => (
          <div
            key={tile.id}
            className="puzzle-tile"
            style={{
              backgroundImage: `url(${tile.imageUrl})`,
              backgroundSize: `${config.size * 100}%`,
              backgroundPosition: `${(tile.id % config.size) / (config.size - 1) * 100}% ${Math.floor(tile.id / config.size) / (config.size - 1) * 100}%`,
              width: `${100 / config.size}%`,
              height: `${100 / config.size}%`,
              transform: `translate(
                ${(tile.currentPos % config.size) * (100)}%,
                ${Math.floor(tile.currentPos / config.size) * (100)}%
              )`,
            }}
            onClick={() => {
              const currentIndex = tile.currentPos;
              const emptyIndex = tiles.find(t => t.id === 8)?.currentPos;
              if (emptyIndex !== undefined && 
                  (Math.abs(currentIndex - emptyIndex) === 1 ||
                   Math.abs(currentIndex - emptyIndex) === 3)) {
                swapTiles(currentIndex, emptyIndex);
              }
            }}
          />
        ))}
      </div>
      <button 
        className="start-button"
        onClick={initializePuzzle}
      >
        {isPlaying ? '重新开始' : '开始游戏'}
      </button>
      {isComplete && (
        <div className="victory-message">
          恭喜！你完成了拼图！
          <br />
          用时：{Math.floor(time / 60)}分{time % 60}秒
          <br />
          移动次数：{moves}
        </div>
      )}
      <button 
        className="start-button"
        onClick={initializePuzzle}
      >
        {isPlaying ? '重新开始' : '开始游戏'}
      </button>
      {isComplete && (
        <div className="victory-message">
          恭喜！你完成了拼图！
          <br />
          用时：{Math.floor(time / 60)}分{time % 60}秒
          <br />
          移动次数：{moves}
        </div>
      )}
    </div>
  );
};

export default PuzzleGame;