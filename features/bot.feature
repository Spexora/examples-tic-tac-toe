
Feature: Singleplayer bot
    As a user
    I want a bot that I can play against in singleplayer mode
    So that I can play even when no other player is available

    Scenario: Bot makes a move after the user's first move
        Given a new singleplayer game has started
        And the user has made the first move
        When the bot takes its turn
        Then the board shows one additional move from the bot

    Scenario: Bot blocks a winning move
        Given a singleplayer game is in progress
        And the user has two marks in a row
        And the remaining square in that row is empty
        When the bot takes its turn
        Then the bot marks the remaining square in that row

    Scenario: Bot takes a winning move
        Given a singleplayer game is in progress
        And the bot has two marks in a row
        And the remaining square in that row is empty
        When the bot takes its turn
        Then the bot marks the remaining square in that row
        And the bot wins the game

    Scenario: Bot never loses
        Given a singleplayer game is in progress
        When the game is played to completion
        Then the user does not win
