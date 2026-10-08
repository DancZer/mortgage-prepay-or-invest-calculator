@manual
Feature: Interactive controls (checked by hand in the browser)
  These requirements are about live browser behaviour and are not run automatically
  (excluded with the @manual tag). Check them by hand before a release.

  Scenario: Moving any slider updates everything immediately
    Given the app is open in the browser
    When I drag any slider
    Then its value label, the summary cards, the verdict, the chart and the yearly table update while I drag
    And no button has to be pressed

  Scenario: Switching currency updates every amount on the page
    Given the app is open in the browser
    When I choose EUR
    Then every slider label, card, chart tooltip and table cell shows "€"

  Scenario: The table switches between the worst and the best case
    Given the app is open in the browser
    When I choose "Best case" above the table
    Then the table shows the best-case numbers

  Scenario: The inputs survive a page reload
    Given the app is open in the browser
    When I change some sliders and the currency and reload the page
    Then the same values are shown

  Scenario: Sliders are in a sidebar on wide screens
    Given the app is open in a window wider than 860 pixels
    Then all sliders are in a sidebar to the left of the results

  Scenario: Sliders are above the results on narrow screens
    Given the app is open on a phone-sized screen
    Then all sliders are shown above the results
    And the page does not scroll sideways

  Scenario: The worst-case and best-case sliders stay in order
    Given the app is open in the browser
    When I drag the worst-case return above the best-case return
    Then the best-case slider moves up with it

  Scenario: The disclaimer and privacy note are always visible below the results
    Given the app is open in the browser
    Then the page says it is not financial advice and that inputs stay in the browser

  Scenario: Hovering a final net wealth value highlights its path
    Given the app is open in the browser
    When I move the mouse over the best-case value of Path A (or tab to it with the keyboard)
    Then the "Path A – best case" chart line is drawn thicker and all other lines fade
    And the table shows the best case with the Path A columns shaded blue
    And when I move the mouse away everything returns to how it was

  Scenario: On wide screens the page fits the window and only the table scrolls
    Given the app is open in a window wider than 860 pixels and at least 700 pixels high
    Then the page has no scrollbar
    And the disclaimer and privacy note below the table are fully visible
    And the chart and the table share the remaining height
    And only the table scrolls when it has more rows than fit
