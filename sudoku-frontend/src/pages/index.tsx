import { useEffect, useState } from 'react';
import SudokuGrid from '../components/SudokuGrid';

interface SudokuPuzzle {
  puzzle: number[][];
  difficulty: number;
}

const SudokuPage = () => {
  const [puzzle, setPuzzle] = useState<number[][] | null>(null);
  const [difficulty, setDifficulty] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        const response = await fetch(
          `https://your-worker-domain.workers.dev/?difficulty=${difficulty}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch puzzle');
        }
        const data: SudokuPuzzle = await response.json();
        setPuzzle(data.puzzle);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchPuzzle();
  }, [difficulty]);

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDifficulty(parseInt(e.target.value, 10));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>数独生成器</h1>
      <label>
        难度级别:
        <select value={difficulty} onChange={handleDifficultyChange}>
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p style={{ color: 'red' }}>错误: {error}</p>
      ) : puzzle ? (
        <SudokuGrid puzzle={puzzle} />
      ) : (
        <p>加载中...</p>
      )}
    </div>
  );
};

export default SudokuPage;

