
Feature: Multiplayer tic-tac-toe game state is managed by the server
    As a user
    I want the multiplayer game of tic-tac-toe to be managed by the server
    So that my friends can't cheat in the game

    Scenario: Client sends a move to the server
        Given a multiplayer game is in progress
        And it is the cross user's turn
        When the cross user selects an empty square
        Then the client sends the move to the server
        And the move is not applied only in the local client state

    Scenario: Server validates and publishes the move
        Given a multiplayer game is in progress
        And the server receives a valid move
        When the server processes the move
        Then the server updates the game state
        And the server publishes the updated game state to both clients

    Scenario: Clients receive updated state from the server
        Given a multiplayer game is in progress
        And the server has published a game state update
        When both clients receive the server-sent event
        Then both clients show the same board state

    Scenario: Invalid move is rejected by the server
        Given a multiplayer game is in progress
        And a square is already occupied
        When a user selects that square
        Then the client sends the move attempt to the server
        And the server rejects the move
        And the board does not change for either user
