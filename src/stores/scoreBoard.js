import { writable, derived } from 'svelte/store';

function scoreBoardStatus() {
  const initialState = [
    { name: 'Player 1', score: 0, isCurrentPlayer: true },
    { name: 'Player 2', score: 0, isCurrentPlayer: false },
    { name: 'Player 3', score: 0, isCurrentPlayer: false },
  ];
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    addScore: (score) =>
      update((scoreBoard) => {
        const currentPlayerIndex = scoreBoard.findIndex(
          (playerScoreBoard) => playerScoreBoard.isCurrentPlayer
        );
        return [
          ...scoreBoard.slice(0, currentPlayerIndex),
          {
            ...scoreBoard[currentPlayerIndex],
            score: scoreBoard[currentPlayerIndex].score + score,
          },
          ...scoreBoard.slice(currentPlayerIndex + 1),
        ];
      }),
    removeScore: (score) =>
      update((scoreBoard) => {
        const currentPlayerIndex = scoreBoard.findIndex(
          (playerScoreBoard) => playerScoreBoard.isCurrentPlayer
        );
        return [
          ...scoreBoard.slice(0, currentPlayerIndex),
          {
            ...scoreBoard[currentPlayerIndex],
            score: scoreBoard[currentPlayerIndex].score - score,
          },
          ...scoreBoard.slice(currentPlayerIndex + 1),
        ];
      }),
    nextCurrentPlayer: () =>
      update((scoreBoard) => {
        const currentPlayerIndex = scoreBoard.findIndex(
          (playerScoreBoard) => playerScoreBoard.isCurrentPlayer
        );
        const nextPlayerIndex =
          currentPlayerIndex === scoreBoard.length - 1
            ? 0
            : currentPlayerIndex + 1;

        const nextScoreBoard = scoreBoard.map((playerScore, playerIndex) => ({
          ...playerScore,
          isCurrentPlayer: playerIndex === nextPlayerIndex,
        }));

        return nextScoreBoard;
      }),
    reset: () => set(initialState),
  };
}

export const scoreBoard = scoreBoardStatus();
