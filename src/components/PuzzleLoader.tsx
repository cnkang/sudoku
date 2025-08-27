import { Suspense } from 'react';
import { usePuzzleData } from '../hooks/usePuzzleData';
import SudokuGrid from './SudokuGrid';

interface PuzzleContentProps {
  difficulty: number;
  shouldFetch: boolean;
  force?: boolean;
  userInput: number[][];
  onInputChange: (row: number, col: number, value: number) => void;
  disabled?: boolean;
  hintCell?: { row: number; col: number } | null;
}

function PuzzleContent({ 
  difficulty, 
  shouldFetch, 
  force = false, 
  userInput, 
  onInputChange, 
  disabled, 
  hintCell 
}: PuzzleContentProps) {
  const puzzle = usePuzzleData(difficulty, shouldFetch, force);
  
  if (!puzzle) return null;
  
  return (
    <SudokuGrid
      puzzle={puzzle.puzzle}
      userInput={userInput}
      onInputChange={onInputChange}
      disabled={disabled}
      hintCell={hintCell}
    />
  );
}

function PuzzleLoadingFallback() {
  return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>Generating your puzzle...</p>
      <style jsx>{`
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem;
          color: #6b7280;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function PuzzleLoader(props: PuzzleContentProps) {
  return (
    <Suspense fallback={<PuzzleLoadingFallback />}>
      <PuzzleContent {...props} />
    </Suspense>
  );
}