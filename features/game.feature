
Feature: Play a single-player game of tic-tac-toe
    As a user
    I want to be able to play a game of tic-tac-toe
    So that I can still my hunger of playing games

    Scenario: Start a new game
        Given the application is open
        When the user starts a new game
        Then a 3x3 game board is shown

    Scenario: First move places a cross
        Given a new game has started
        When the user selects an empty square
        Then a cross is shown in that square

    Scenario: Occupied square cannot be selected
        Given a game has started
        And a square already contains a cross or a circle
        When the user selects that square
        Then the board does not change

    Scenario: Crosses win with three in a row
        Given a game has started
        And two squares in a row contain crosses
        When the user selects the remaining empty square in that row
        Then crosses win the game

    Scenario: Game ends in a tie
        Given a game has started
        And all squares are filled
        And no player has three in a row
        Then the game ends in a tie

    Scenario: Tie message is shown
        Given the game has ended in a tie
        Then a game over message is shown
        And the message says the game is a tie

    Scenario: Cross win message is shown
        Given crosses have won the game
        Then a game over message is shown
        And the message says crosses won

    Scenario: Circle win message is shown
        Given circles have won the game
        Then a game over message is shown
        And the message says circles won
