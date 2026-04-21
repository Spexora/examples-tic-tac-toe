<script lang="ts">
	import { createGame, makeMove, type GameState, type Player } from '$lib/game.js';

	type Mode = 'none' | 'singleplayer' | 'multiplayer';

	let mode: Mode = 'none';
	let game: GameState = createGame();
	let inviteCode: string = '';
	let opponentJoined: boolean = false;

	function selectSingleplayer() {
		mode = 'singleplayer';
		game = createGame();
	}

	function selectMultiplayer() {
		mode = 'multiplayer';
		game = createGame();
		inviteCode = Math.random().toString(36).slice(2, 9);
		opponentJoined = false;
	}

	function simulateOpponentJoin() {
		opponentJoined = true;
	}

	function handleCellClick(index: number) {
		game = makeMove(game, index);
	}

	function startNewGame() {
		game = createGame();
		if (mode === 'multiplayer') {
			opponentJoined = false;
			inviteCode = Math.random().toString(36).slice(2, 9);
		}
	}

	function backToMenu() {
		mode = 'none';
		opponentJoined = false;
		inviteCode = '';
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

{#if mode === 'none'}
	<!-- Mode selection screen: singleplayer and multiplayer options -->
	<div class="app mode-select">
		<h1>Tic-Tac-Toe</h1>
		<p class="prompt">Select a game mode:</p>
		<div class="mode-buttons">
			<button class="mode-btn singleplayer-btn" on:click={selectSingleplayer}>
				Singleplayer
			</button>
			<button class="mode-btn multiplayer-btn" on:click={selectMultiplayer}>
				Multiplayer
			</button>
		</div>
	</div>
{:else if mode === 'multiplayer' && !opponentJoined}
	<!-- Multiplayer lobby: show invite link while waiting for opponent -->
	<div class="app">
		<h1>Tic-Tac-Toe</h1>
		<p class="prompt">Waiting for an opponent to join…</p>
		<div class="invite-section">
			<p>Share this invite link with a friend:</p>
			<div class="invite-link" aria-label="Invite link">
				/game/{inviteCode}
			</div>
			<button class="mode-btn simulate-btn" on:click={simulateOpponentJoin}>
				Simulate opponent joining
			</button>
		</div>
		<button class="new-game-btn back-btn" on:click={backToMenu}>Back to menu</button>
	</div>
{:else}
	<!-- Game board screen -->
	<div class="app">
		<h1>Tic-Tac-Toe</h1>

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

		<button class="new-game-btn" on:click={startNewGame}>New Game</button>
		<button class="new-game-btn back-btn" on:click={backToMenu}>Back to menu</button>
	</div>
{/if}

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

	.prompt {
		font-size: 1.2rem;
		color: #a0c4ff;
		margin: 0;
	}

	.mode-buttons {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.mode-btn {
		padding: 0.75rem 2rem;
		font-size: 1rem;
		background-color: #0f3460;
		color: #e0e0e0;
		border: 2px solid #6495ed;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
	}

	.mode-btn:hover {
		background-color: #1a4a7a;
		transform: scale(1.05);
		box-shadow: 0 0 12px rgba(100, 149, 237, 0.4);
	}

	.invite-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem 2rem;
		background-color: #16213e;
		border: 2px solid #6495ed;
		border-radius: 8px;
		text-align: center;
	}

	.invite-section p {
		margin: 0;
		color: #a0c4ff;
	}

	.invite-link {
		padding: 0.5rem 1rem;
		background-color: #0f3460;
		border: 1px solid #6495ed;
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.95rem;
		color: #e0e0e0;
		word-break: break-all;
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
		transition: background-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
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

	.new-game-btn {
		padding: 0.75rem 2rem;
		font-size: 1rem;
		background-color: #0f3460;
		color: #e0e0e0;
		border: 2px solid #6495ed;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
	}

	.new-game-btn:hover {
		background-color: #1a4a7a;
		transform: scale(1.05);
		box-shadow: 0 0 12px rgba(100, 149, 237, 0.4);
	}
</style>
