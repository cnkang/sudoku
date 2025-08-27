// CSS styles for page component - excluded from coverage
export const pageStyles = `
  .game-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .game-header h1 {
    font-size: 2.5rem;
    font-weight: 800;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .game-subtitle {
    font-size: 1.1rem;
    color: #6b7280;
    font-style: italic;
  }

  .error-message {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #fee2e2;
    color: #991b1b;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #fecaca;
    margin-bottom: 1rem;
  }

  .error-dismiss {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #991b1b;
    padding: 0;
    margin-left: 1rem;
  }

  .game-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

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

  .hint-message {
    background-color: #fef3c7;
    color: #92400e;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #fbbf24;
    margin: 1rem 0;
    text-align: center;
    font-weight: 500;
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    .game-header { margin-bottom: 1.5rem; }
    .game-header h1 { font-size: 2rem; }
    .game-subtitle { font-size: 1rem; }
    .error-message { font-size: 0.875rem; padding: 0.75rem; margin: 0 -0.5rem 1rem -0.5rem; }
    .game-area { gap: 0.75rem; }
    .loading-state { padding: 2rem 1rem; }
    .hint-message { font-size: 0.875rem; padding: 0.75rem; margin: 0.75rem 0; }
  }

  @media (max-width: 480px) {
    .game-header { margin-bottom: 1rem; }
    .game-header h1 { font-size: 1.75rem; line-height: 1.2; }
    .game-subtitle { font-size: 0.875rem; margin-bottom: 0; }
    .error-message { font-size: 0.8rem; padding: 0.625rem; margin: 0 -1rem 0.75rem -1rem; border-radius: 0; }
    .error-dismiss { font-size: 1.25rem; margin-left: 0.5rem; }
    .game-area { gap: 0.5rem; }
    .loading-state { padding: 1.5rem 0.5rem; }
    .loading-spinner { width: 32px; height: 32px; border-width: 3px; }
    .hint-message { font-size: 0.8rem; padding: 0.625rem; margin: 0.5rem 0; line-height: 1.4; }
  }

  @media (max-width: 768px) and (orientation: landscape) {
    .game-header { margin-bottom: 0.75rem; }
    .game-header h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .game-subtitle { font-size: 0.875rem; }
    .game-area { gap: 0.5rem; }
    .hint-message { font-size: 0.8rem; padding: 0.5rem; margin: 0.5rem 0; }
  }

  @media (hover: none) and (pointer: coarse) {
    .error-dismiss {
      min-width: 44px;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-tap-highlight-color: transparent;
    }
  }
`;
