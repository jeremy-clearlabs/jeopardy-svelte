<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  let selected = false;

  const start = () => {
    selected = true;
    dispatch('start');
  };
</script>

<style>
  h1 {
    color: var(--jeopardy-gray);
    text-transform: uppercase;
    font-family: 'Fjalla One', sans-serif;
    font-size: min(12vw, 4em);
    font-weight: bold;
    margin: 0 0 0.5em 0;
  }

  button {
    padding: 1em 1em;
    display: block;
    margin: 0 0 0.2em 0;
    width: 100%;
  }
  @media (min-width: 640px) {
    button {
      display: inline;
      margin: 0 0.2em 0.4em 0.2em;
    }
  }
</style>

<header>
  <h1>Jeopardy!</h1>
</header>

<button on:click={() => start()} disabled={selected}>Start the game!</button>
