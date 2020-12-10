<script>
  import { afterUpdate, onMount } from 'svelte';

  import { scoreBoard } from '../stores/scoreBoard.js';

  export let clue;
  export let answer;
  export let category;
  export let isDoubleJeopardy;
  export let price;
  export let closeCurrentClue;
  
  
  const getCurrentPlayer = () => {
    return $scoreBoard.find(
      (playerScoreBoard) => playerScoreBoard.isCurrentPlayer
      );
    };
    
    let currentPlayer = getCurrentPlayer();
    let revealAnswer = false;
    let timesTried = 0;
    let tripleStump = false;
    let wager;

  onMount(() => {
    getCurrentPlayer();
  });

  const handleKeydown = (event) => {
    if (event?.key === 'Escape') {
      closeCurrentClue();
    }
    if (event?.key === 'r') {
      revealAnswer = true;
    }
    if (event?.key === 'n') {
      scoreBoard.nextCurrentPlayer();
      currentPlayer = getCurrentPlayer();
    }
    if (event?.key === 'w') {
      scoreBoard.addScore(wager);
      scoreBoard.nextCurrentPlayer();
      currentPlayer = getCurrentPlayer();
    }
    if (event?.key === 'q') {
      scoreBoard.removeScore(wager);
      scoreBoard.nextCurrentPlayer();
      currentPlayer = getCurrentPlayer();
    }
  };
</script>

<style>
  .jeopardy-clue-wrapper {
    width: 95vw;
    height: 95vh;
    justify-content: center;
    align-items: center;
    display: flex;
    flex-direction: column;
    font-family: 'Fjalla One', sans-serif;
    font-size: 3.2rem;
    padding: 1rem;
    text-align: center;
  }
  .jeopardy-answer {
    font-size: 1.6rem;
    color: #f0f;
  }

  .jeopardy-guide {
    font-size: 1rem;
    display: flex;
    justify-content: space-evenly;
    width: 100%;
  }

  .jeopardy-score {
    display: flex;
    justify-content: space-around;
    width: 100%;
    margin-bottom: 2rem;
  }
  .jeopardy-player-score {
    font-size: 1.2rem;
    margin-top: 2rem;
    display: flex;
    border: 1px solid var(--jeopardy-blue-dark);
    padding: 1rem;
  }

  .jeopardy-player-score--current {
    border: 1px solid #000;
  }
</style>

<div class="jeopardy-clue-wrapper">
  <div class="jeopardy-clue">{clue}</div>
  {#if revealAnswer}
    <div class="jeopardy-answer">{answer}</div>
  {/if}
  <div class="jeopardy-score">
    {#each $scoreBoard as playerBoard}
      <div
        class={playerBoard.isCurrentPlayer ? 'jeopardy-player-score jeopardy-player-score--current' : 'jeopardy-player-score'}>
        <div>
          {playerBoard.name}: ${Intl.NumberFormat('en-US').format(playerBoard.score)}
        </div>
      </div>
    {/each}
  </div>
  <label for="jeopardy-wager">Wager</label>
  <input
    id="jeopardy-wager"
    name="jeopardy-wager"
    type="number"
    bind:value={wager} />
  <div class="jeopardy-guide">
    Guide:
    <div>[r] Reveal answer</div>
    <div>[w] player wins score</div>
    <div>[q] player lose score</div>
    <div>[esc] Close clue</div>
    <div>[n] Next player</div>
  </div>
</div>

<svelte:window on:keydown={handleKeydown} />
