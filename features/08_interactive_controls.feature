@manual
Feature: Interactive controls (checked by hand in the browser)
  These requirements are about live browser behaviour and are not run automatically
  (excluded with the @manual tag). Check them by hand before a release.

  Scenario: Moving any slider updates everything immediately
    Given the app is open in the browser
    When I drag any slider
    Then its value label, the summary cards, the chart and the yearly table update while I drag
    And no button has to be pressed

  Scenario: Sliders are in a sidebar on wide screens
    Given the app is open in a window wider than 860 pixels
    Then all sliders are in a sidebar to the left of the results

  Scenario: Sliders are above the results on narrow screens
    Given the app is open on a phone-sized screen
    Then all sliders are shown above the results
    And the page does not scroll sideways

  Scenario: The prepayment slider follows the extra savings slider
    Given the app is open in the browser
    When I drag the extra savings slider below the prepayment value
    Then the prepayment slider moves down with it and cannot be dragged above the extra savings
