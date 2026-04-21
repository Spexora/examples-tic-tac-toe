<script lang="ts">
	import { createGame, makeMove, type GameState, type Player } from '$lib/game.js';

	type Mode = 'select' | 'singleplayer';
	let mode: Mode = 'select';
	let game: GameState = createGame();

	function startSingleplayer() {
		game = createGame();
		mode = 'singleplayer';
	}

	async function startMultiplayer() {
		const res = await fetch('/api/games', { method: 'POST' });
		const { sessionId } = await res.json();
		window.location.href = `/game/${sessionId}`;
	}

	function handleCellClick(index: number) {
		game = makeMove(game, index);
	}

	function startNewGame() {
		game = createGame();
	}

	function backToMenu() {
		mode = 'select';
		game = createGame();
	}

	function getStatusMessage(g: GameState): string {
		if (g.status === 'won') {
			return g.winner === 'X' ? 'Crosses won!' : 'Circles won!';
		}
		if (g.status === 'tied') {
			return "It's a tie!";
		}
		return g.currentPlayer === 'X' ? "Cross's turn" : "Circle's turn";
	}

	function getCellSymbol(cell: Player | null): string {
		if (cell === 'X') return '✕';
		if (cell === 'O') return '○';
		return '';
	}
</script>

<div class="app">
	<h1>Tic-Tac-Toe</h1>

	{#if mode === 'select'}
		<div class="mode-select">
			<p class="mode-prompt">Choose a game mode:</p>
			<button class="mode-btn singleplayer-btn" on:click={startSingleplayer}>
				Singleplayer
			</button>
			<button class="mode-btn multiplayer-btn" on:click={startMultiplayer}>
				Multiplayer
			</button>
		</div>
	{:else}
		<div class="status" aria-live="polite">
			{#if game.status !== 'playing'}
				<div class="game-over-message" aria-label="Game over message">
					<p>{getStatusMessage(game)}</p>
				</div>
			{:else}
				<p>{getStatusMessage(game)}</p>
			{/if}
		</div>

		<div class="board" aria-label="Game board">
			{#each game.board as cell, i}
				<button
					class="cell"
					class:occupied={cell !== null}
					class:cross={cell === 'X'}
					class:circle={cell === 'O'}
					disabled={cell !== null || game.status !== 'playing'}
					on:click={() => handleCellClick(i)}
					aria-label={cell
						? `${cell === 'X' ? 'Cross' : 'Circle'} at position ${i + 1}`
						: `Empty square ${i + 1}`}
				>
					{getCellSymbol(cell)}
				</button>
			{/each}
		</div>

		<div class="btn-row">
			<button class="new-game-btn" on:click={startNewGame}>New Game</button>
			<button class="back-btn" on:click={backToMenu}>Back to Menu</button>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #1a1a2e;
		color: #e0e0e0;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		min-height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.app {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem;
	}

	h1 {
		font-size: 2.5rem;
		color: #e0e0e0;
		margin: 0;
		text-shadow: 0 0 20px rgba(100, 149, 237, 0.5);
	}

	.mode-select {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.mode-prompt {
		font-size: 1.2rem;
		color: #a0c4ff;
		margin: 0;
	}

	.mode-btn {
		padding: 1rem 3rem;
		font-size: 1.1rem;
		border-radius: 8px;
		border: 2px solid #6495ed;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			transform 0.1s ease,
			box-shadow 0.15s ease;
		width: 220px;
	}

	.singleplayer-btn {
		background-color: #0f3460;
		color: #e0e0e0;
	}

	.multiplayer-btn {
		background-color: #0f3460;
		color: #e0e0e0;
	}

	.mode-btn:hover {
		background-color: #1a4a7a;
		transform: scale(1.05);
		box-shadow: 0 0 12px rgba(100, 149, 237, 0.4);
	}

	.status {
		font-size: 1.2rem;
		color: #a0c4ff;
		min-height: 2rem;
		text-align: center;
	}

	.game-over-message {
		padding: 1rem 2rem;
		background-color: #16213e;
		border: 2px solid #6495ed;
		border-radius: 8px;
		animation: fadeIn 0.3s ease-in;
	}

	.game-over-message p {
		margin: 0;
		font-size: 1.3rem;
		font-weight: bold;
		color: #a0c4ff;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.9);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.board {
		display: grid;
		grid-template-columns: repeat(3, 100px);
		grid-template-rows: repeat(3, 100px);
		gap: 8px;
		background-color: #0f3460;
		padding: 8px;
		border-radius: 8px;
	}

	.cell {
		width: 100px;
		height: 100px;
		background-color: #16213e;
		border: 2px solid #0f3460;
		border-radius: 8px;
		font-size: 2.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background-color 0.15s ease,
			transform 0.1s ease,
			box-shadow 0.15s ease;
		color: #e0e0e0;
	}

	.cell:not(:disabled):hover {
		background-color: #1a4a7a;
		transform: scale(1.05);
		box-shadow: 0 0 12px rgba(100, 149, 237, 0.4);
	}

	.cell.cross {
		color: #ff6b6b;
	}

	.cell.circle {
		color: #6bcbff;
	}

	.cell:disabled {
		cursor: not-allowed;
	}

	.cell.occupied:hover {
		transform: none;
		box-shadow: none;
		background-color: #16213e;
	}

	.btn-row {
		display: flex;
		gap: 1rem;
	}

	.new-game-btn,
	.back-btn {
		padding: 0.75rem 2rem;
		font-size: 1rem;
		background-color: #0f3460;
		color: #e0e0e0;
		border: 2px solid #6495ed;
		border-radius: 8px;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			transform 0.1s ease,
			box-shadow 0.15s ease;
	}

	.new-game-btn:hover,
	.back-btn:hover {
		background-color: #1a4a7a;
		transform: scale(1.05);
		box-shadow: 0 0 12px rgba(100, 149, 237, 0.4);
	}
</style>
