<script>
  import { onMount, afterUpdate, createEventDispatcher } from 'svelte';
  import * as eases from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  import FinalClue from '../components/FinalClue.svelte';
  import { gameRound } from '../stores/gameRound.js';

  export let currentRound;

  const dispatch = createEventDispatcher();

  let data_promise;
  let currentClue;
  let currentClueLocation;
  let showSingleClue = false;

  onMount(() => {
    data_promise = loadGame();
  });

  afterUpdate(() => {
    if (
      $gameRound.length > 0 &&
      $gameRound.every((category) =>
        category.clues.every((clue) => clue.answered)
      )
    ) {
      roundOver();
    }
  });

  const loadGame = async () => {
    const res = await fetch('/finalJeopardy.json');
    const categories = await res.json();
    gameRound.initialize(categories);
  };

  const roundOver = () => {
    currentClue = null;
    currentClueLocation = null;
    data_promise = null;
    showSingleClue = false;
    gameRound.reset();
    dispatch('next');
  };

  const setCurrentClue = (clue, clueLocation) => {
    currentClue = clue;
    currentClueLocation = clueLocation;
    showSingleClue = true;
  };

  const closeCurrentClue = () => {
    gameRound.setAnswered(currentClueLocation);
    showSingleClue = false;
  };
</script>

<style>
  .jeopardy-game {
    position: relative;
  }

  .jeopardy-board {
    background: var(--jeopardy-blue);
    border: 1rem solid #000;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    font-family: 'Fjalla One', sans-serif;
    height: 100vh;
    text-shadow: 4px 4px #000000;
    width: 100vw;
  }

  .jeopardy-board-categories {
    align-items: center;
    display: flex;
    justify-content: space-around;
  }

  .jeopardy-board-columns {
    align-items: center;
    display: flex;
    flex-grow: 1;
    justify-content: space-around;
  }

  .jeopardy-board-clues {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    flex-basis: 0;
  }

  .jeopardy-board-category {
    padding: 0.5rem 0;
    text-transform: uppercase;
    font-size: 2rem;
  }

  .jeopardy-board-clue,
  .jeopardy-board-category {
    display: flex;
    justify-content: center;
    align-items: center;
    align-self: stretch;
    border-bottom: 0.5rem solid #000000;
    border-left: 0.5rem solid #000000;
    border-right: 0.5rem solid #000000;
    border-top: 0.5rem solid #000000;
    flex-grow: 1;
    text-align: center;
    flex-basis: 0;
  }

  .jeopardy-board-clue {
    cursor: pointer;
    color: var(--jeopardy-clue);
    font-size: 3.2rem;
    background-color: var(--jeopardy-blue);
  }

  .jeopardy-board-clue:hover {
    background: var(--jeopardy-blue-dark);
  }

  .jeopardy-board-clue--disabled {
    cursor: not-allowed;
    background-color: var(--jeopardy-blue-dark);
  }

  .jeopardy-clue--absolute {
    position: absolute;
    width: 95vw;
    height: 95vh;
    background-color: var(--jeopardy-blue);
    box-shadow: 0.5rem 0.5rem #000;
    transform: translate(-50%, -50%);
    top: 50%;
    left: 50%;
  }
</style>

<div class="jeopardy-game">
  <div class="jeopardy-board">
    <div class="jeopardy-board-categories">
      {#each $gameRound as category}
        <div class="jeopardy-board-category">{category.name}</div>
      {/each}
    </div>

    <div class="jeopardy-board-columns">
      {#each $gameRound as _, categoryIndex}
        <div class="jeopardy-board-clues">
          {#each $gameRound[categoryIndex].clues as clue, clueIndex}
            <div
              class={clue.answered ? 'jeopardy-board-clue jeopardy-board-clue--disabled' : 'jeopardy-board-clue'}
              on:click={() => !clue.answered && setCurrentClue(clue, {
                  categoryIndex,
                  clueIndex,
                })}>
              {#if !clue.answered}<span>${clue.price}</span>{/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  {#if Boolean(showSingleClue)}
    <div
      class="jeopardy-clue--absolute"
      transition:scale={{ duration: 250, delay: 100, opacity: 0.1, start: 0.1, easing: quintOut }}>
      <FinalClue {closeCurrentClue} {...currentClue} />
    </div>
  {/if}
</div>
