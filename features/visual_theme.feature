
Feature: Visual theme
    As a user
    I want a good and user friendly UI/UX
    So that I can understand the game properly and know what buttons do what

    Scenario: Dark theme is used
        When the user opens the application
        Then the background is dark
        And the foreground text has sufficient contrast to be readable

    Scenario: Buttons provide interaction feedback
        When the user hovers over a button
        Then the button changes appearance

    Scenario: Board cells provide hover feedback
        When the user hovers over an empty grid cell
        Then the cell changes appearance
