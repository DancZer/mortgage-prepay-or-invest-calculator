import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Given, Then, When, type DataTable } from "@cucumber/cucumber";
import type { MonthRow } from "../../src/calc";
import { applyInput, defaultInputs, paramDef, PARAMS, prepayMax } from "../../src/params";
import {
  chartSeries,
  describeElapsed,
  describePayoff,
  payoffMarker,
  summaryCards,
  warningMessage,
  yearlyTable,
  type TableRow,
} from "../../src/view";
import { assertAmount, normalize, paramKey, parseNumber } from "../support/parse";
import type { SimWorld } from "../support/world";

// ---------- Parameters ----------

Given("the default parameters", function (this: SimWorld) {
  this.setInputs(defaultInputs());
});

Given("all rates are zero", function (this: SimWorld) {
  this.update({ inf: 0, inv: 0, mort: 0, penalty: 0 });
});

Given("the parameters:", function (this: SimWorld, table: DataTable) {
  for (const [name, value] of table.raw()) this.update({ [paramKey(name)]: parseNumber(value) });
});

When(/^I set the (.+) to (.+)$/, function (this: SimWorld, name: string, value: string) {
  this.setInputs(applyInput(this.inputs, paramKey(name), parseNumber(value)));
});

Then(/^the (.+) is set to (.+)$/, function (this: SimWorld, name: string, value: string) {
  assertAmount(this.inputs[paramKey(name)], value, name);
});

Then(/^the prepayment slider cannot go above (.+)$/, function (this: SimWorld, value: string) {
  assertAmount(prepayMax(this.inputs), value, "prepayment slider maximum");
});

Then("the sliders are:", function (table: DataTable) {
  const rows = table.hashes();
  assert.equal(rows.length, PARAMS.length, "number of sliders");
  for (const row of rows) {
    const def = paramDef(paramKey(row.parameter));
    assertAmount(def.defaultValue, row.default, `${row.parameter} default`);
    assertAmount(def.min, row.min, `${row.parameter} minimum`);
    assertAmount(def.max, row.max, `${row.parameter} maximum`);
    assertAmount(def.step, row.step, `${row.parameter} step`);
  }
});

Then("every default value lies within its range and on its slider's step grid", function () {
  for (const def of PARAMS) {
    assert.ok(def.defaultValue >= def.min && def.defaultValue <= def.max, `${def.label}: default outside range`);
    const steps = (def.defaultValue - def.min) / def.step;
    assert.ok(Math.abs(steps - Math.round(steps)) < 1e-9, `${def.label}: default ${def.defaultValue} is not on the step grid`);
  }
});

// ---------- Simulation ----------

When("I run the simulation", function (this: SimWorld) {
  this.run();
});

Then("the simulation has {int} monthly steps", function (this: SimWorld, months: number) {
  assert.equal(this.result.rows.length - 1, months);
});

const MONTH_COLUMNS: Record<string, keyof MonthRow> = {
  "extra savings": "extra",
  prepayment: "prepay",
  "loan a": "loanA",
  "invested a": "contribA",
  "investments a": "invA",
  "net wealth a": "netA",
  "loan b": "loanB",
  "invested b": "contribB",
  "investments b": "invB",
  "net wealth b": "netB",
};

Then("the monthly results are:", function (this: SimWorld, table: DataTable) {
  for (const row of table.hashes()) {
    const month = Number(row.month);
    const actual = this.result.rows[month];
    assert.ok(actual, `month ${month} is outside the simulation`);
    for (const [column, expected] of Object.entries(row)) {
      if (column === "month") continue;
      const key = MONTH_COLUMNS[column.toLowerCase()];
      if (!key) throw new Error(`Unknown column "${column}". Known: month, ${Object.keys(MONTH_COLUMNS).join(", ")}`);
      assertAmount(actual[key], expected, `month ${month}, ${column}`);
    }
  }
});

Then(/^the Path (A|B) mortgage is paid off in month (\d+)$/, function (this: SimWorld, path: string, month: string) {
  const actual = path === "A" ? this.result.payoffMonthA : this.result.payoffMonthB;
  assert.equal(actual, Number(month), `Path ${path} payoff month`);
});

Then(/^the Path (A|B) mortgage is not paid off within the horizon$/, function (this: SimWorld, path: string) {
  const actual = path === "A" ? this.result.payoffMonthA : this.result.payoffMonthB;
  assert.equal(actual, null, `Path ${path} payoff month`);
});

Then("Path B invests nothing before month {int}", function (this: SimWorld, month: number) {
  for (let m = 1; m < month; m++) assert.equal(this.result.rows[m].contribB, 0, `month ${m}: Path B invested`);
});

Then(
  /^from month (\d+) to month (\d+) Path (A|B) invests the monthly installment plus that month's extra savings$/,
  function (this: SimWorld, from: string, to: string, path: string) {
    for (let m = Number(from); m <= Number(to); m++) {
      const r = this.result.rows[m];
      const invested = path === "A" ? r.contribA : r.contribB;
      assert.ok(Math.abs(invested - (this.inputs.installment + r.extra)) < 1e-6, `month ${m}: Path ${path} invested ${invested}`);
    }
  },
);

Then("the Path B loan equals the Path A loan in every month", function (this: SimWorld) {
  for (const r of this.result.rows) assert.ok(Math.abs(r.loanA - r.loanB) < 1e-6, `month ${r.month}: ${r.loanA} vs ${r.loanB}`);
});

Then("Path B investments equal Path A investments up to month {int}", function (this: SimWorld, month: number) {
  for (const r of this.result.rows.slice(0, month + 1))
    assert.ok(Math.abs(r.invA - r.invB) < 1e-6, `month ${r.month}: ${r.invA} vs ${r.invB}`);
});

Then(
  "in every month, net wealth equals the loan amount plus investments minus the remaining loan, for both paths",
  function (this: SimWorld) {
    const { initial } = this.inputs;
    for (const r of this.result.rows) {
      assert.ok(Math.abs(r.netA - (initial + r.invA - r.loanA)) < 1e-6, `month ${r.month}: Path A net wealth`);
      assert.ok(Math.abs(r.netB - (initial + r.invB - r.loanB)) < 1e-6, `month ${r.month}: Path B net wealth`);
    }
  },
);

Then("the remaining loans are never negative", function (this: SimWorld) {
  for (const r of this.result.rows) {
    assert.ok(r.loanA >= 0, `month ${r.month}: Path A loan ${r.loanA}`);
    assert.ok(r.loanB >= 0, `month ${r.month}: Path B loan ${r.loanB}`);
  }
});

Then("a warning is shown that the installment does not cover the monthly interest", function (this: SimWorld) {
  const warning = warningMessage(this.inputs);
  assert.ok(warning?.includes("doesn't cover"), `expected a warning, got ${warning}`);
});

Then("no warning is shown", function (this: SimWorld) {
  assert.equal(warningMessage(this.inputs), null);
});

// ---------- Dashboard ----------

/** Ignores digit grouping: hu-HU writes "8000" but "18 000", and the scenarios may use either. */
const ungroup = (text: string) => normalize(text).replace(/(\d) (?=\d)/g, "$1");

Then("the dashboard cards are:", function (this: SimWorld, table: DataTable) {
  const cards = summaryCards(this.result);
  const expected = table.raw();
  assert.equal(cards.length, expected.length, "number of cards");
  expected.forEach(([title, value], i) => {
    assert.equal(normalize(cards[i].title), normalize(title), `card ${i + 1} title`);
    assert.equal(ungroup(cards[i].value), ungroup(value), `"${title}" card value`);
  });
});

Then("the {string} card notes:", function (this: SimWorld, title: string, table: DataTable) {
  const card = summaryCards(this.result).find((c) => c.title === title);
  assert.ok(card, `no card titled "${title}"`);
  assert.deepEqual(card.notes.map(normalize), table.raw().map(([n]) => normalize(n)));
});

Then("the third card is titled {string}", function (this: SimWorld, title: string) {
  assert.equal(summaryCards(this.result)[2].title, title);
});

Then("the dashboard shows a tie", function (this: SimWorld) {
  const card = summaryCards(this.result)[2];
  assert.equal(card.title, "Tie");
  assert.equal(normalize(card.value), "0 Ft");
});

Then("a payoff in month {int} is shown as {string} and {string}", function (month: number, date: string, elapsed: string) {
  assert.equal(describePayoff(month), date);
  assert.equal(describeElapsed(month), elapsed);
});

/** Classifies a #rrggbb colour by hue so the test reads "blue" rather than a hex code. */
function colourName(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return "grey";
  let hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hue = (hue * 60 + 360) % 360;
  if (hue < 20 || hue >= 330) return "red";
  if (hue < 70) return "yellow";
  if (hue < 170) return "green";
  if (hue < 260) return "blue";
  return "purple";
}

function cssColour(variable: string): string {
  const css = readFileSync(new URL("../../src/style.css", import.meta.url), "utf8");
  const match = css.match(new RegExp(`${variable}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `colour ${variable} not found in style.css`);
  return match[1];
}

Then("the chart series are:", function (this: SimWorld, table: DataTable) {
  const series = chartSeries(this.result);
  const expected = table.hashes();
  assert.equal(series.length, expected.length, "number of series");
  expected.forEach((row, i) => {
    assert.equal(series[i].label, row.series, `series ${i + 1}`);
    assert.equal(colourName(cssColour(series[i].colorVar)), row.colour, `${row.series} colour`);
    assert.equal(series[i].dashed ? "dashed" : "solid", row.line, `${row.series} line style`);
  });
});

Then(
  "every chart series has one point per month including the start, with x in years elapsed",
  function (this: SimWorld) {
    const months = this.inputs.years * 12;
    for (const s of chartSeries(this.result)) {
      assert.equal(s.points.length, months + 1, `${s.label} point count`);
      s.points.forEach((p, m) => {
        assert.ok(Math.abs(p.x - m / 12) < 1e-9, `${s.label} point ${m} x`);
        assert.equal(p.y, this.result.rows[m][s.key], `${s.label} point ${m} y`);
      });
    }
  },
);

Then("the chart marks Path B's payoff after {int} months with the label {string}", function (this: SimWorld, months: number, label: string) {
  const marker = payoffMarker(this.result);
  assert.ok(marker, "no payoff marker");
  assert.ok(Math.abs(marker.x - months / 12) < 1e-9, `marker at ${marker.x} years`);
  assert.equal(marker.label, label);
});

Then("the chart has no payoff marker", function (this: SimWorld) {
  assert.equal(payoffMarker(this.result), null);
});

// ---------- Yearly table ----------

const TABLE_COLUMNS: Record<string, keyof TableRow> = {
  "extra savings / month": "extra",
  "net wealth a": "netA",
  "net wealth b": "netB",
  "b − a": "diff",
  "b - a": "diff",
  "loan a": "loanA",
  "loan b": "loanB",
  "invested b (year)": "investedB",
  "investments a": "invA",
  "investments b": "invB",
};

Then("the yearly table has {int} rows", function (this: SimWorld, rows: number) {
  assert.equal(yearlyTable(this.result).length, rows);
});

Then("the yearly table is:", function (this: SimWorld, table: DataTable) {
  const actualRows = yearlyTable(this.result);
  for (const row of table.hashes()) {
    const year = Number(row.year);
    const actual = actualRows.find((r) => r.year === year);
    assert.ok(actual, `year ${year} is not in the table`);
    for (const [column, expected] of Object.entries(row)) {
      if (column === "year") continue;
      if (column === "payoff year") {
        assert.equal(actual.isPayoffYear ? "yes" : "no", expected, `year ${year}, payoff year`);
        continue;
      }
      const key = TABLE_COLUMNS[column.toLowerCase()];
      if (!key) throw new Error(`Unknown column "${column}". Known: year, payoff year, ${Object.keys(TABLE_COLUMNS).join(", ")}`);
      assertAmount(actual[key] as number, expected, `year ${year}, ${column}`);
    }
  }
});
