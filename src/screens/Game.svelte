<script>
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { fly, scale, crossfade } from 'svelte/transition';
  import * as eases from 'svelte/easing';
  import Card from '../components/Card.svelte';
  import { sleep, pick_random, load_image } from '../utils.js';

  let data_promise;
  let categories = [];
  let clueRows = [];
  let currentClue;
  let showSingleClue = false;
  console.log('showSingleClue', showSingleClue);

  const loadGame = async () => {
    const res = await fetch(`/data.json`);
    categories = await res.json();
    clueRows = new Array(categories.length).fill().map((_, i) => i);
  };

  onMount(() => {
    data_promise = loadGame();
  });

  const setCurrentClue = (clue) => {
    currentClue = clue;
    showSingleClue = true;
  };

  const closeCurrentClue = () => {
    showSingleClue = false;
  };

  // let i = 0;
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

  .jeopardy-clue-single {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 95vw;
    height: 95vh;
    background-color: var(--jeopardy-blue);
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Fjalla One', sans-serif;
    font-size: 3.2rem;
    text-align: center;
    padding: 1rem;
    box-shadow: 0.5rem 0.5rem #000;
  }
</style>

<div class="jeopardy-game">
  <div class="jeopardy-board">
    <div class="jeopardy-board-categories">
      {#each categories as category}
        <div class="jeopardy-board-category">{category.name}</div>
      {/each}
    </div>

    <div class="jeopardy-board-columns">
      {#each clueRows as categoryIndex}
        <div class="jeopardy-board-clues">
          {#each categories[categoryIndex].clues as clue}
            <div
              class="jeopardy-board-clue"
              on:click={() => setCurrentClue(clue)}>
              ${clue.price}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
  {#if Boolean(showSingleClue)}
    <div class="jeopardy-clue-single" on:click={() => closeCurrentClue()}>
      {currentClue.answer}
    </div>
  {/if}
</div>
