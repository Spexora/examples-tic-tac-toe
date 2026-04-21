Feature: Play a multi-player game of tic-tac-toe

    Scenario: Main screen shows game mode options
        Given the application is open
        And the user has not started a game
        Then singleplayer and multiplayer options are shown

    Scenario: Starting a multiplayer game shows an invite link
        Given the application is open
        When the user selects the multiplayer option
        Then an invite link is shown

    Scenario: Host sees the game board when an opponent joins
        Given the application is open
        And the user has selected the multiplayer option
        When an opponent joins the game
        Then a 3x3 game board is shown

    Scenario: Second user joins through an invite link
        Given a new game has been created
        When a user joins through the invite link
        Then a 3x3 game board is shown
        And one user is assigned a cross and the other a circle

    Scenario: Cross plays first
        Given a new game has been created
        And a user has joined through the invite link
        And a 3x3 game board is shown
        And no moves have been made
        When the cross user selects an empty square
        Then that square shows a cross for both users

    Scenario: Circle cannot play first
        Given a new game has been created
        And a user has joined through the invite link
        And a 3x3 game board is shown
        And no moves have been made
        When the circle user selects an empty square
        Then the board does not change

    Scenario: Circle plays second
        Given a new game has been created
        And a user has joined through the invite link
        And a 3x3 game board is shown
        And one square already contains a cross
        When the circle user selects an empty square
        Then that square shows a circle for both users
