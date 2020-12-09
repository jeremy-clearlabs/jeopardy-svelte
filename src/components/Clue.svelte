<script>

  export let clue;
  export let answer;
  export let price;
  export let closeCurrentClue;
  let revealAnswer = false;

  const handleKeydown = (event) => {
    if (event?.key === 'Escape') {
      closeCurrentClue();
    }
    if (event?.key === 'a') {
      revealAnswer = true;
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
</style>

<div
  class="jeopardy-clue-wrapper"
  on:click={() => closeCurrentClue()}
  >
  <div class="jeopardy-clue">{clue}</div>
  {#if revealAnswer}
    <div class="jeopardy-answer">{answer}</div>
  {/if}
</div>

<svelte:window on:keydown={handleKeydown} />
