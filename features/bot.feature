
Feature: Singleplayer bot
    As a user
    I want to play tic-tac-toe against a bot in singleplayer mode
    So that I can play even when no other player is available

    Scenario: Starting a singleplayer game assigns the bot as the opponent
        Given the application is open
        When the user starts a new game
        Then a 3x3 game board is shown
        And the user plays as cross
        And the bot plays as circle

    Scenario: Bot makes the second move automatically
        Given a game has started
        And the user plays as cross
        And the bot plays as circle
        When the user selects an empty square
        Then a cross is shown in that square
        And the bot makes the next move automatically
        And a circle is shown in an empty square

    Scenario: User cannot play the bot's turn
        Given a game has started
        And the user has made the first move
        And the bot has not moved yet
        When the user selects another empty square
        Then the board does not change

    Scenario: Bot blocks a winning move
        Given a game is in progress
        And the user has two marks in a row
        And the remaining square in that row is empty
        When the bot takes its turn
        Then the bot marks the remaining square in that row

    Scenario: Bot takes a winning move
        Given a game is in progress
        And the bot has two marks in a row
        And the remaining square in that row is empty
        When the bot takes its turn
        Then the bot marks the remaining square in that row
        And the bot wins the game
