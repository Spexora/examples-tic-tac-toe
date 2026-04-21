<script lang="ts">
  import { createGame, makeMove, type GameState } from '$lib/game.js';

  let game: GameState = createGame();

  function handleCellClick(index: number) {
    game = makeMove(game, index);
  }

  function handleNewGame() {
    game = createGame();
  }

  function getResultMessage(result: GameState['result']): string {
    if (result === 'X_WINS') return 'Crosses won!';
    if (result === 'O_WINS') return 'Circles won!';
    if (result === 'TIE') return "It's a tie!";
    return '';
  }
</script>

<main>
  <h1>Tic-Tac-Toe</h1>

  <div class="board">
    {#each game.board as cell, i}
      <button
        class="cell"
        on:click={() => handleCellClick(i)}
        disabled={game.result !== null || cell !== null}
      >
        {cell ?? ''}
      </button>
    {/each}
  </div>

  {#if game.result !== null}
    <div class="message">
      <p>{getResultMessage(game.result)}</p>
    </div>
  {/if}

  <button class="new-game-btn" on:click={handleNewGame}>New Game</button>
</main>

<style>
  :global(body) {
    background-color: #0f0f23;
    color: #cccccc;
    margin: 0;
    font-family: sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }

  main {
    text-align: center;
  }

  h1 {
    color: #cccccc;
    margin-bottom: 1.5rem;
  }

  .board {
    display: grid;
    grid-template-columns: repeat(3, 100px);
    gap: 4px;
    margin: 0 auto 1.5rem;
  }

  .cell {
    width: 100px;
    height: 100px;
    font-size: 2.5rem;
    background-color: #1a1a3e;
    color: #cccccc;
    border: 2px solid #3a3a6e;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .cell:hover:not(:disabled) {
    background-color: #2a2a5e;
    border-color: #6a6aae;
  }

  .cell:disabled {
    cursor: default;
  }

  .message {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
    color: #ffcc00;
  }

  .new-game-btn {
    padding: 0.6rem 1.4rem;
    font-size: 1rem;
    background-color: #2a2a5e;
    color: #cccccc;
    border: 2px solid #6a6aae;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .new-game-btn:hover {
    background-color: #3a3a7e;
    border-color: #9a9ace;
  }

  button:hover {
    opacity: 1;
  }
</style>
