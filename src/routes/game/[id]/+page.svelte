<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import type { GameState, Player } from '$lib/game.js';

	const sessionId = $page.params.id;

	let playerId: string = '';
	let role: Player | null = null;
	let game: GameState | null = null;
	let opponentJoined = false;
	let inviteLink = '';
	let eventSource: EventSource | null = null;
	let errorMessage = '';

	async function joinGame() {
		playerId = crypto.randomUUID();
		try {
			const res = await fetch(`/api/games/${sessionId}/join`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ playerId }),
			});
			if (!res.ok) {
				errorMessage = 'Failed to join game.';
				return;
			}
			const data = await res.json();
			role = data.role as Player;
			connectToEvents();
		} catch {
			errorMessage = 'Could not connect to game server.';
		}
	}

	function connectToEvents() {
		eventSource = new EventSource(`/api/games/${sessionId}/events?playerId=${playerId}`);
		eventSource.onmessage = (event) => {
			const state = JSON.parse(event.data) as GameState & { opponentJoined?: boolean };
			game = state;
			if (state.opponentJoined !== undefined) {
				opponentJoined = state.opponentJoined;
			}
		};
		eventSource.onerror = () => {
			errorMessage = 'Connection to game server lost.';
		};
	}

	async function handleCellClick(index: number) {
		if (!game || game.status !== 'playing' || game.board[index] !== null) return;
		if (game.currentPlayer !== role) return;

		await fetch(`/api/games/${sessionId}/move`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ playerId, index }),
		});
	}

	function getStatusMessage(): string {
		if (!game) return 'Waiting for game to start...';
		if (game.status === 'won') {
			return game.winner === role ? 'You won!' : 'Opponent won.';
		}
		if (game.status === 'tied') return "It's a tie!";
		return game.currentPlayer === role ? 'Your turn' : "Opponent's turn";
	}

	function getCellSymbol(cell: Player | null): string {
		if (cell === 'X') return '✕';
		if (cell === 'O') return '○';
		return '';
	}

	onMount(async () => {
		inviteLink = window.location.href;
		await joinGame();
	});

	onDestroy(() => {
		eventSource?.close();
	});
</script>

<div class="app">
	<h1>Tic-Tac-Toe</h1>

	{#if errorMessage}
		<p class="error">{errorMessage}</p>
	{:else if !opponentJoined && role}
		<div class="waiting">
			<p>Waiting for an opponent to join…</p>
			<div class="invite-section">
				<p class="invite-label">Invite link:</p>
				<div class="invite-link-box" aria-label="Invite link">
					<span class="invite-url">{inviteLink}</span>
				</div>
			</div>
			<p class="role-info">You are playing as {role === 'X' ? 'Crosses (✕)' : 'Circles (○)'}</p>
		</div>
	{:else if game}
		<p class="role-info">You are: {role === 'X' ? 'Crosses (✕)' : 'Circles (○)'}</p>

		<div class="status" aria-live="polite">
			{#if game.status !== 'playing'}
				<div class="game-over-message" aria-label="Game over message">
					<p>{getStatusMessage()}</p>
				</div>
			{:else}
				<p>{getStatusMessage()}</p>
			{/if}
		</div>

		<div class="board" aria-label="Game board">
			{#each game.board as cell, i}
				<button
					class="cell"
					class:occupied={cell !== null}
					class:cross={cell === 'X'}
					class:circle={cell === 'O'}
					disabled={cell !== null || game.status !== 'playing' || game.currentPlayer !== role}
					on:click={() => handleCellClick(i)}
					aria-label={cell
						? `${cell === 'X' ? 'Cross' : 'Circle'} at position ${i + 1}`
						: `Empty square ${i + 1}`}
				>
					{getCellSymbol(cell)}
				</button>
			{/each}
		</div>
	{:else}
		<p>Connecting…</p>
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

	.error {
		color: #ff6b6b;
		font-size: 1.1rem;
	}

	.waiting {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
	}

	.invite-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.invite-label {
		font-size: 1rem;
		color: #a0c4ff;
		margin: 0;
	}

	.invite-link-box {
		background-color: #16213e;
		border: 2px solid #6495ed;
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		max-width: 400px;
		word-break: break-all;
	}

	.invite-url {
		color: #6bcbff;
		font-family: monospace;
		font-size: 0.9rem;
	}

	.role-info {
		color: #a0c4ff;
		font-size: 1rem;
		margin: 0;
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
</style>
