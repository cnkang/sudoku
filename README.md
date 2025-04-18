
# sudoku-project (v1.1.1)

## Project Description

This project is a Sudoku game frontend application built using Next.js and React. It provides an interactive Sudoku grid for users to solve puzzles, with features to input and track user solutions.

## Features
- Interactive Sudoku grid implemented with React.
- Users can input numbers to solve the puzzle.
- Dynamic rendering of the Sudoku grid, supporting both initial puzzle values and user inputs.
- Built with TypeScript for enhanced type safety and maintainability.
- Uses Vite for fast development and build processes.
- Added feature: Reset button to clear user inputs and restart the puzzle.
- Added feature: Validate solution to check the correctness of the user's input.

## Installation
To install the dependencies, run:
```
yarn install
```

## Usage
To start the development server, use:
```
next dev
```

To build the project:
```
next build && tsc
```

## Tests
Run the tests using:
```
vitest --run
```

## Project Structure
- **src/app/**: Contains the main application setup and routing.
- **src/components/SudokuGrid.tsx**: Core component that implements the Sudoku grid with user input support.
- **src/components/Controls.tsx**: Component for additional controls like reset and validate buttons.
- **src/public/**: Static assets such as images or icons.
- **next.config.mjs**: Configuration for Next.js.
- **tsconfig.json**: TypeScript configuration.
- **vite.config.ts**: Configuration for Vite bundler.

## Dependencies
The project relies on the following key dependencies:
browserslist, core-js, fast-sudoku-solver, next, react, react-dom

Development dependencies include:
@eslint/config-array, @eslint/object-schema, @testing-library/dom, @testing-library/react, @types/core-js, @types/node, @types/react, @types/react-dom, @types/regenerator-runtime, @vitejs/plugin-react, dotenv, dotenv-cli, esbuild, eslint, eslint-config-next, happy-dom, typescript, vite, vitest

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
