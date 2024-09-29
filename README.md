# Sudoku Application

This project is a Sudoku application comprising a backend and a frontend. The backend handles the Sudoku solving functionalities, while the frontend provides the user interface. The frontend is built using Next.js and React.

## Prerequisites

Ensure you have Node.js installed on your system. You can download it from [nodejs.org](https://nodejs.org/).

## Getting Started

### Clone the Repository

To get started, clone the repository to your local machine:

```bash
git clone https://github.com/cnkang/sudoku.git
```
### Navigate to the Project Directories

The project is divided into two main directories:

- `sudoku-backend`: Contains the backend logic for solving Sudoku puzzles.
- `sudoku-frontend`: Contains the frontend UI built with Next.js and React.

## Backend Setup (`sudoku-backend`)

### Structure

- **.yarnrc.yml**: Configuration file for Yarn specifying the `node-modules` nodeLinker.
- **src/dlxSolver.ts**: Contains the function `solveSudoku`, which uses the third-party library `fast-sudoku-solver` to solve Sudoku puzzles.
- **src/types.ts**: Defines the `SudokuPuzzle` interface with `puzzle` and `difficulty`.

### Installation

Navigate to the `sudoku-backend` folder and install dependencies:

```bash
cd sudoku-backend
yarn install
```
## Frontend Setup (`sudoku-frontend`)

### Structure

- **README.md**: Details for setting up and running the frontend.
- Utilizes Next.js for server-rendered React applications.

### Installation

Navigate to the `sudoku-frontend` folder and install dependencies:

```bash
cd sudoku-frontend
yarn install
```

## Running the Application
### Backend
To run the backend, use:
```bash
# Inside sudoku-backend
yarn start
```
### Frontend
To run the frontend, use:
```bash
# Inside sudoku-frontend
yarn dev
```
This will start the development server.

## Testing
For testing, the frontend uses vitest. You can run tests using:
```bash
# Inside sudoku-frontend
yarn test
```

## Building the Project
To build the frontend for production, use:
```bash
# Inside sudoku-frontend
yarn build
```
This will compile the application for production deployment.

## Contributing
If you wish to contribute to this project, feel free to raise issues or submit pull requests on the GitHub repository.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
