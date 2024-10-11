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

/**
 * Reducer function for the Sudoku state.
 * @param {State} state The current state.
 * @param {Action} action The action to perform on the state.
 * @returns {State} The new state.
 */
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_PUZZLE": {
      const { puzzle, solution } = action.payload;

      return {
        ...state,
        puzzle,
        solution,
        userInput: puzzle.map((row) => row.map((val) => (val === 0 ? 0 : val))),
        error: null,
        isCorrect: null,
        time: 0,
        timerActive: true,
      };
    }

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "UPDATE_USER_INPUT": {
      const { row, col, value } = action.payload;

      const newUserInput = [...state.userInput];
      newUserInput[row][col] = value;

      return { ...state, userInput: newUserInput };
    }

    case "SET_DIFFICULTY":
      return { ...state, difficulty: action.payload, timerActive: false };

    case "CHECK_ANSWER": {
      const isSolvedCorrectly =
        JSON.stringify(state.userInput) === JSON.stringify(state.solution);

      return {
        ...state,
        isCorrect: isSolvedCorrectly,
        timerActive: !isSolvedCorrectly,
      };
    }

    case "TICK":
      return { ...state, time: state.time + 1 };

    case "RESET":
      return initialState;

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
          const errorMessage = errorData.error || "Failed to fetch puzzle";
          throw new Error(errorMessage);
        }

        const data: SudokuPuzzle = await response.json();
        dispatch({ type: "SET_PUZZLE", payload: data });
      } catch (err) {
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

    if (state.difficulty !== null) {
      fetchPuzzle();
    }
  }, [state.difficulty]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (state.timerActive) {
      timer = setInterval(() => {
        dispatch({ type: "TICK" });
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [state.timerActive]);

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === null || value === "") {
      dispatch({
        type: "SET_ERROR",
        payload: "Event target value is null or empty",
      });
      return;
    }

    const difficulty = parseInt(value, 10);
    if (isNaN(difficulty)) {
      dispatch({
        type: "SET_ERROR",
        payload: "Event target value is not a number",
      });
      return;
    }

    dispatch({ type: "SET_DIFFICULTY", payload: difficulty });
  };

  const handleInputChange = (row: number, col: number, value: number) => {
    if (state.userInput === null) {
      dispatch({
        type: "SET_ERROR",
        payload: "Cannot update user input when puzzle is not loaded",
      });
      return;
    }

    try {
      dispatch({ type: "UPDATE_USER_INPUT", payload: { row, col, value } });
    } catch (err) {
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

  const checkAnswer = () => {
    if (state.userInput === null || state.solution === null) {
      dispatch({
        type: "SET_ERROR",
        payload: "Cannot check answer when puzzle is not loaded",
      });
      return;
    }

    try {
      dispatch({ type: "CHECK_ANSWER" });
    } catch (err) {
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
