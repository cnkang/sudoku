"use client";
import "core-js/stable";
import "regenerator-runtime/runtime";
import { useEffect, useReducer } from "react";
import SudokuGrid from "../components/SudokuGrid";
import styles from "./page.module.css";

interface SudokuPuzzle {
  puzzle: number[][];
  solution: number[][];
  difficulty: number;
}

interface State {
  puzzle: number[][] | null;
  solution: number[][] | null;
  difficulty: number;
  error: string | null;
  userInput: number[][];
  time: number;
  timerActive: boolean;
  isCorrect: boolean | null;
}

type Action =
  | { type: "SET_PUZZLE"; payload: SudokuPuzzle }
  | { type: "SET_ERROR"; payload: string }
  | {
      type: "UPDATE_USER_INPUT";
      payload: { row: number; col: number; value: number };
    }
  | { type: "SET_DIFFICULTY"; payload: number }
  | { type: "CHECK_ANSWER" }
  | { type: "TICK" }
  | { type: "RESET" };

const initialState: State = {
  puzzle: null,
  solution: null,
  difficulty: 1,
  error: null,
  userInput: [],
  time: 0,
  timerActive: false,
  isCorrect: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_PUZZLE": {
      return {
        ...state,
        puzzle: action.payload.puzzle,
        solution: action.payload.solution,
        userInput: action.payload.puzzle.map((row) =>
          row.map((val) => (val === 0 ? 0 : val))
        ),
        error: null,
        isCorrect: null,
        time: 0,
        timerActive: true,
      };
    }
    case "SET_ERROR": {
      return {
        ...state,
        error: action.payload,
      };
    }
    case "UPDATE_USER_INPUT": {
      const newInput = [...state.userInput];
      newInput[action.payload.row][action.payload.col] = action.payload.value;
      return {
        ...state,
        userInput: newInput,
      };
    }
    case "SET_DIFFICULTY": {
      return {
        ...state,
        difficulty: action.payload,
        timerActive: false,
      };
    }
    case "CHECK_ANSWER": {
      const isSolvedCorrectly =
        JSON.stringify(state.userInput) === JSON.stringify(state.solution);
      return {
        ...state,
        isCorrect: isSolvedCorrectly,
        timerActive: !isSolvedCorrectly,
      };
    }
    case "TICK": {
      return {
        ...state,
        time: state.time + 1,
      };
    }
    case "RESET": {
      return initialState;
    }
    default:
      return state;
  }
};

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}?difficulty=${state.difficulty}`,
          { method: "POST" }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch puzzle");
        }

        const data: SudokuPuzzle = await response.json();
        dispatch({ type: "SET_PUZZLE", payload: data });
      } catch (err: unknown) {
        if (err instanceof Error) {
          dispatch({ type: "SET_ERROR", payload: err.message });
        } else {
          dispatch({
            type: "SET_ERROR",
            payload: "An unexpected error occurred",
          });
        }
      }
    };

    fetchPuzzle();
  }, [state.difficulty]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.timerActive) {
      timer = setInterval(() => {
        dispatch({ type: "TICK" });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.timerActive]);

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: "SET_DIFFICULTY", payload: parseInt(e.target.value, 10) });
  };

  const handleInputChange = (row: number, col: number, value: number) => {
    dispatch({ type: "UPDATE_USER_INPUT", payload: { row, col, value } });
  };

  const checkAnswer = () => {
    dispatch({ type: "CHECK_ANSWER" });
  };

  let content;

  if (state.error) {
    content = <p style={{ color: "red" }}>Error: {state.error}</p>;
  } else if (state.puzzle) {
    content = (
      <>
        <SudokuGrid
          puzzle={state.puzzle}
          userInput={state.userInput}
          onInputChange={handleInputChange}
        />
        <button onClick={checkAnswer}>Submit</button>
        <div>Time: {state.time}s</div>
        {state.isCorrect !== null && (
          <div>{state.isCorrect ? "Correct!" : "Incorrect, try again."}</div>
        )}
      </>
    );
  } else {
    content = <p>Loading...</p>;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Sudoku Generator</h1>
        <label htmlFor="difficulty-select">
          Difficulty Level:
          <select
            id="difficulty-select"
            aria-label="Select difficulty level"
            value={state.difficulty}
            onChange={handleDifficultyChange}
          >
            {Array.from({ length: 10 }, (_, i) => {
              const difficultyLevel = i + 1;
              return (
                <option
                  key={`difficulty-${difficultyLevel}`}
                  value={difficultyLevel}
                >
                  {difficultyLevel}
                </option>
              );
            })}
          </select>
        </label>
        {content}
      </main>
    </div>
  );
}
