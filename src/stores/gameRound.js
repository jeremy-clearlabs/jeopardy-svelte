import { writable } from 'svelte/store';

function gameRoundStatus() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    initialize: (categories) => update(() => categories),
    setAnswered: ({ categoryIndex, clueIndex }) =>
      update((categories) => {
				console.log(categoryIndex, clueIndex)
				console.log(categories)
				categories[categoryIndex].clues[clueIndex].answered = true;
				return categories;
      }),
    allAnswered: () => update((n) => n - 1),
    reset: () => set([]),
  };
}

export const gameRound = gameRoundStatus();
