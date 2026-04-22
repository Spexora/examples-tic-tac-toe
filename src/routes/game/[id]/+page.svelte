<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';

	const gameId = $page.params.id;

	type Player = 'X' | 'O';
	type Cell = Player | null;

	interface GameSession {
		id: string;
		board: Cell[];
		currentPlayer: Player;
		status: 'waiting' | 'playing' | 'won' | 'tied';
		winner: Player | null;
		players: number;
		hostRole: Player;
		guestRole: Player;
	}

	let role: Player | null = null;
	let gameState: GameSession | null = null;
	let inviteLink = '';
	let eventSource: EventSource | null = null;
	let errorMessage = '';

	onMount(async () => {
		inviteLink = window.location.href;

		// Check localStorage for a stored role for this game
		const storedRole = localStorage.getItem(`game_role_${gameId}`);
		if (storedRole === 'X' || storedRole === 'O') {
			role = storedRole as Player;
		} else {
			// Try to join as the second player
			const res = await fetch(`/api/games/${gameId}/join`, { method: 'POST' });
			if (res.ok) {
				const data = await res.json();
				role = data.role as Player;
				localStorage.setItem(`game_role_${gameId}`, role);
			} else if (res.status === 409) {
				errorMessage = 'This game is already full.';
				return;
			} else {
				errorMessage = 'Game not found.';
				return;
			}
		}

		connectSSE();
	});

	onDestroy(() => {
		eventSource?.close();
	});

	function connectSSE() {
		eventSource = new EventSource(`/api/games/${gameId}/events`);
		eventSource.onmessage = (e) => {
			gameState = JSON.parse(e.data) as GameSession;
		};
		eventSource.onerror = () => {
			eventSource?.close();
		};
	}

	async function handleCellClick(index: number) {
		if (!role || !gameState || gameState.status !== 'playing') return;
		if (gameState.currentPlayer !== role) return;
		if (gameState.board[index] !== null) return;

		await fetch(`/api/games/${gameId}/move`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ player: role, index })
		});
	}

	function getCellSymbol(cell: Cell): string {
		if (cell === 'X') return '✕';
		if (cell === 'O') return '○';
		return '';
	}

	function getStatusMessage(): string {
		if (!gameState) return '';
		if (gameState.status === 'won') {
			return gameState.winner === 'X' ? 'Crosses won!' : 'Circles won!';
		}
		if (gameState.status === 'tied') return "It's a tie!";
		if (gameState.status === 'waiting') return 'Waiting for opponent…';
		return gameState.currentPlayer === 'X' ? "Cross's turn" : "Circle's turn";
	}

	$: waitingForOpponent = !gameState || gameState.players < 2;
	$: isMyTurn = gameState?.currentPlayer === role && gameState?.status === 'playing';
</script>

<div class="app">
	<h1>Tic-Tac-Toe</h1>

	{#if errorMessage}
		<p class="error">{errorMessage}</p>
		<a href="/" class="back-link">Back to home</a>
	{:else if !gameState}
		<p class="status">Connecting…</p>
	{:else if waitingForOpponent}
		<div class="waiting">
			<p class="status">You are <strong>{role}</strong>. Waiting for an opponent to join…</p>
			<div class="invite-link-box">
				<p>Share this invite link:</p>
				<span class="invite-link">{inviteLink}</span>
			</div>
		</div>
	{:else}
		<p class="role-info">You are playing as: <strong>{role}</strong></p>

		<div class="status" aria-live="polite">
			{#if gameState.status !== 'playing'}
				<div class="game-over-message" aria-label="Game over message">
					<p>{getStatusMessage()}</p>
				</div>
			{:else}
				<p class:your-turn={isMyTurn}>{getStatusMessage()}</p>
			{/if}
		</div>

		<div class="board" aria-label="Game board">
			{#each gameState.board as cell, i}
				<button
					class="cell"
					class:occupied={cell !== null}
					class:cross={cell === 'X'}
					class:circle={cell === 'O'}
					disabled={cell !== null || gameState.status !== 'playing' || !isMyTurn}
					on:click={() => handleCellClick(i)}
					aria-label={cell
						? `${cell === 'X' ? 'Cross' : 'Circle'} at position ${i + 1}`
						: `Empty square ${i + 1}`}
				>
					{getCellSymbol(cell)}
				</button>
			{/each}
		</div>

		{#if gameState.status !== 'playing'}
			<a href="/" class="new-game-btn">New Game</a>
		{/if}
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

	.status {
		font-size: 1.2rem;
		color: #a0c4ff;
		min-height: 2rem;
		text-align: center;
	}

	.your-turn {
		color: #6bcbff;
		font-weight: bold;
	}

	.role-info {
		font-size: 1rem;
		color: #a0c4ff;
	}

	.waiting {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.invite-link-box {
		padding: 1rem 1.5rem;
		background-color: #16213e;
		border: 2px solid #6495ed;
		border-radius: 8px;
		text-align: center;
	}

	.invite-link-box p {
		margin: 0 0 0.5rem;
		color: #a0c4ff;
	}

	.invite-link {
		display: block;
		font-family: monospace;
		color: #6bcbff;
		word-break: break-all;
	}

	.error {
		color: #ff6b6b;
		font-size: 1.1rem;
	}

	.back-link {
		color: #a0c4ff;
		text-decoration: underline;
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

	.new-game-btn {
		padding: 0.75rem 2rem;
		font-size: 1rem;
		background-color: #0f3460;
		color: #e0e0e0;
		border: 2px solid #6495ed;
		border-radius: 8px;
		cursor: pointer;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			transform 0.1s ease,
			box-shadow 0.15s ease;
	}

	.new-game-btn:hover {
		background-color: #1a4a7a;
		transform: scale(1.05);
		box-shadow: 0 0 12px rgba(100, 149, 237, 0.4);
	}
</style>
