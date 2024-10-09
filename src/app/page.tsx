"use client";
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { useEffect, useState } from "react";
import SudokuGrid from "../components/SudokuGrid";
import styles from "./page.module.css";

interface SudokuPuzzle {
  puzzle: number[][];
  solution: number[][];
  difficulty: number;
}

export default function Home() {
  const [puzzle, setPuzzle] = useState<number[][] | null>(null);
  const [solution, setSolution] = useState<number[][] | null>(null); // Add solution state
  const [difficulty, setDifficulty] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [userInput, setUserInput] = useState<number[][]>([]);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}?difficulty=${difficulty}`,
          { method: 'POST' }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch puzzle");
        }
        
        const data: SudokuPuzzle = await response.json();
        setPuzzle(data.puzzle);
        setSolution(data.solution); // Set the solution
        const initialUserInput = data.puzzle.map(row => row.map(val => (val === 0 ? 0 : val)));
        setUserInput(initialUserInput);
        setError(null);
        setIsCorrect(null);
        setTime(0);
        setTimerActive(true);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      }
    };

    fetchPuzzle();
  }, [difficulty]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive) {
      timer = setInterval(() => {
        setTime((prev: number) => prev + 1);;
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive]);

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDifficulty(parseInt(e.target.value, 10));
  };

  const handleInputChange = (row: number, col: number, value: number) => {
    const newInput = [...userInput];
    newInput[row][col] = value;
    setUserInput(newInput);
  };

  const checkAnswer = () => {
    if (!solution) return;
    const isSolvedCorrectly = JSON.stringify(userInput) === JSON.stringify(solution);
    setIsCorrect(isSolvedCorrectly);
  
    if (isSolvedCorrectly) {
      setTimerActive(false);
    }
  };  

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Sudoku Generator</h1>
        <label>
          Difficulty Level:
          <select
            aria-label="Select difficulty level"
            value={difficulty}
            onChange={handleDifficultyChange}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p style={{ color: "red" }}>Error: {error}</p>
        ) : puzzle ? (
          <>
            <SudokuGrid puzzle={puzzle} userInput={userInput} onInputChange={handleInputChange} />
            <button onClick={checkAnswer}>Submit</button>
            <div>Time: {time}s</div>
            {isCorrect !== null && (
              <div>{isCorrect ? 'Correct!' : 'Incorrect, try again.'}</div>
            )}
          </>
        ) : (
          <p>Loading...</p>
        )}
      </main>
    </div>
  );
}
