import { writable, derived } from 'svelte/store';

function gameRoundStatus() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    initialize: (categories) => set(categories),
    setAnswered: ({ categoryIndex, clueIndex }) =>
      update((categories) => {
        categories[categoryIndex].clues[clueIndex].answered = true;
        return categories;
      }),
    allAnswered: () => update((n) => n - 1),
    reset: () => set([]),
  };
}

export const gameRound = gameRoundStatus();

export const allAnswered = derived(
  gameRoundStatus,
  ($gameRoundStatus) =>
    $gameRoundStatus.length > 0 &&
    $gameRoundStatus.every((category) =>
      category.clues.every((clue) => clue.answered)
    )
);
