<script>
  import Welcome from './screens/Welcome.svelte';
  import Game from './screens/Game.svelte';

  // Game State: welcome, jeopardy, doubleJeopardy, finalJeopardy
  let state = 'welcome';

  const nextGameRound = () => {
    switch (state) {
      case 'welcome':
        state = 'jeopardy';
        break;
      case 'jeopardy':
        state = 'doubleJeopardy';
        break;
      case 'doubleJeopardy':
        state = 'finalJeopardy';
        break;
      case 'finalJeopardy':
      default:
        state = 'welcome';
    }
    console.log('next game round', state);
  };
</script>

<style>
  article {
    text-align: center;
    padding: 1em;
    max-width: 800px;
    margin: 0 auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
</style>

<main>
  {#if state === 'welcome'}
    <article>
      <Welcome on:start={nextGameRound} />
    </article>
  {:else if state === 'jeopardy'}
    <Game on:next={nextGameRound} currentRound={state} />
  {:else if state === 'doubleJeopardy'}
    <Game on:next={nextGameRound} currentRound={state} />
  {:else if state === 'finalJeopardy'}
    <Game on:next={nextGameRound} currentRound={state} />
  {/if}
</main>
