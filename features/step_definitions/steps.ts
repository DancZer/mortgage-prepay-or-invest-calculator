import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Given, Then, When, type DataTable } from "@cucumber/cucumber";
import type { MonthRow, SimResult } from "../../src/calc";
import { formatMoney, isCurrencyCode } from "../../src/currency";
import { applyInput, defaultInputs, paramDef, PARAMS } from "../../src/params";
import { breakEvenReturn, runScenarios, type Case } from "../../src/scenarios";
import { loadInputs, saveInputs, STORAGE_KEY } from "../../src/storage";
import {
  chartSeries,
  describeBreakEven,
  describeElapsed,
  describePayoff,
  formatParam,
  payoffMarker,
  summaryCards,
  verdict,
  warningMessage,
  yearlyTable,
  type TableRow,
} from "../../src/view";
import { assertAmount, normalize, paramKey, parameterChange, parseNumber, ungroup } from "../support/parse";
import type { SimWorld } from "../support/world";

const final = (res: SimResult) => res.rows[res.rows.length - 1];

// ---------- Parameters ----------

Given("the default parameters", function (this: SimWorld) {
  this.setInputs(defaultInputs());
});

Given("all rates are zero", function (this: SimWorld) {
  this.update({ inf: 0, invWorst: 0, invBest: 0, mort: 0, penalty: 0, appr: 0 });
});

Given("the parameters:", function (this: SimWorld, table: DataTable) {
  for (const [name, value] of table.raw()) this.update(parameterChange(name, value));
});

Given("I use the currency {word}", function (this: SimWorld, currency: string) {
  this.update(parameterChange("currency", currency));
});

When("I switch the currency to {word}", function (this: SimWorld, currency: string) {
  assert.ok(isCurrencyCode(currency), `unknown currency ${currency}`);
  this.update({ currency });
});

When(/^I set the (.+) to (.+)$/, function (this: SimWorld, name: string, value: string) {
  this.setInputs(applyInput(this.inputs, paramKey(name), parseNumber(value)));
});

Then(/^the (.+) is set to (.+)$/, function (this: SimWorld, name: string, value: string) {
  assertAmount(this.inputs[paramKey(name)], value, name);
});

Then("the currency is {word}", function (this: SimWorld, currency: string) {
  assert.equal(this.inputs.currency, currency);
});

Then("the {string} slider shows {string}", function (this: SimWorld, name: string, label: string) {
  assert.equal(normalize(formatParam(paramDef(paramKey(name)), this.inputs)), normalize(label));
});

Then("the amount {string} is shown as {string}", function (this: SimWorld, amount: string, shown: string) {
  assert.equal(normalize(formatMoney(parseNumber(amount), this.inputs.currency)), normalize(shown));
});

Then("the sliders are:", function (table: DataTable) {
  const rows = table.hashes();
  assert.deepEqual(
    rows.map((r) => paramKey(r.parameter)),
    PARAMS.map((p) => p.key),
    "sliders and their order",
  );
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
    assert.ok(
      Math.abs(steps - Math.round(steps)) < 1e-9,
      `${def.label}: default ${def.defaultValue} is not on the step grid`,
    );
  }
});

// ---------- Saved inputs ----------

Given("I have never used the app before", function (this: SimWorld) {
  // The in-memory store starts empty.
});

Given("I used the app before with:", function (this: SimWorld, table: DataTable) {
  let inputs = defaultInputs();
  for (const [name, value] of table.raw()) inputs = { ...inputs, ...parameterChange(name, value) };
  saveInputs(this.store, inputs);
});

Given("the saved data is {string}", function (this: SimWorld, raw: string) {
  this.store.setItem(STORAGE_KEY, raw);
});

When("I open the app", function (this: SimWorld) {
  this.setInputs(loadInputs(this.store));
});

Then("all parameters have their default values", function (this: SimWorld) {
  assert.deepEqual(this.inputs, defaultInputs());
});

Then("saving does not fail when the browser blocks storage", function (this: SimWorld) {
  const blocked = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
  assert.doesNotThrow(() => saveInputs(blocked, this.inputs));
  assert.deepEqual(loadInputs(blocked), defaultInputs());
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
  "property value": "property",
  "loan a": "loanA",
  "invested a": "contribA",
  "investments a": "invA",
  "net wealth a": "netA",
  "loan b": "loanB",
  "invested b": "contribB",
  "investments b": "invB",
  "net wealth b": "netB",
};

function assertMonthlyResults(result: SimResult, table: DataTable, label: string) {
  for (const row of table.hashes()) {
    const month = Number(row.month);
    const actual = result.rows[month];
    assert.ok(actual, `month ${month} is outside the simulation`);
    for (const [column, expected] of Object.entries(row)) {
      if (column === "month") continue;
      const key = MONTH_COLUMNS[column.toLowerCase()];
      if (!key) throw new Error(`Unknown column "${column}". Known: month, ${Object.keys(MONTH_COLUMNS).join(", ")}`);
      assertAmount(actual[key], expected, `${label}month ${month}, ${column}`);
    }
  }
}

Then("the monthly results are:", function (this: SimWorld, table: DataTable) {
  assertMonthlyResults(this.scenarios.worst, table, "");
});

Then("the best-case monthly results are:", function (this: SimWorld, table: DataTable) {
  assertMonthlyResults(this.scenarios.best, table, "best case, ");
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
      assert.equal(invested, this.inputs.installment + r.extra, `month ${m}: Path ${path} invested`);
    }
  },
);

Then("the Path B loan equals the Path A loan in every month", function (this: SimWorld) {
  for (const r of this.result.rows) assert.equal(r.loanB, r.loanA, `month ${r.month}`);
});

Then("Path B investments equal Path A investments up to month {int}", function (this: SimWorld, month: number) {
  for (const r of this.result.rows.slice(0, month + 1)) assert.equal(r.invB, r.invA, `month ${r.month}`);
});

Then(
  "in every month, net wealth equals the property value plus investments minus the remaining loan, for both paths",
  function (this: SimWorld) {
    for (const c of ["worst", "best"] as Case[]) {
      for (const r of this.scenarios[c].rows) {
        assert.ok(Math.abs(r.netA - (r.property + r.invA - r.loanA)) < 1e-6, `${c} case, month ${r.month}: Path A`);
        assert.ok(Math.abs(r.netB - (r.property + r.invB - r.loanB)) < 1e-6, `${c} case, month ${r.month}: Path B`);
      }
    }
  },
);

Then("the remaining loans are never negative", function (this: SimWorld) {
  for (const r of this.result.rows) {
    assert.ok(r.loanA >= 0, `month ${r.month}: Path A loan ${r.loanA}`);
    assert.ok(r.loanB >= 0, `month ${r.month}: Path B loan ${r.loanB}`);
  }
});

Then(
  "the difference between the paths is the same in every month as with {int} % property growth",
  function (this: SimWorld, growth: number) {
    const other = runScenarios({ ...this.inputs, appr: growth });
    for (const c of ["worst", "best"] as Case[]) {
      this.scenarios[c].rows.forEach((r, m) => {
        const o = other[c].rows[m];
        assert.ok(Math.abs(r.netB - r.netA - (o.netB - o.netA)) < 1e-6, `${c} case, month ${m}`);
      });
    }
  },
);

Then("the loan and the payoff months are the same in the worst and the best case", function (this: SimWorld) {
  const { worst, best } = this.scenarios;
  assert.equal(worst.payoffMonthA, best.payoffMonthA);
  assert.equal(worst.payoffMonthB, best.payoffMonthB);
  worst.rows.forEach((r, m) => {
    assert.equal(r.loanA, best.rows[m].loanA, `month ${m}: loan A`);
    assert.equal(r.loanB, best.rows[m].loanB, `month ${m}: loan B`);
  });
});

Then("a warning is shown that the installment does not cover the monthly interest", function (this: SimWorld) {
  const warning = warningMessage(this.inputs);
  assert.ok(warning?.includes("doesn't cover"), `expected a warning, got ${warning}`);
});

Then("no warning is shown", function (this: SimWorld) {
  assert.equal(warningMessage(this.inputs), null);
});

// ---------- Break-even and verdict ----------

Then("the break-even return is {string}", function (this: SimWorld, expected: string) {
  assert.equal(normalize(describeBreakEven(this.breakEven)), normalize(expected));
});

Then("the break-even return is lower than without a penalty", function (this: SimWorld) {
  const withPenalty = this.breakEven;
  const without = breakEvenReturn({ ...this.inputs, penalty: 0 });
  assert.ok(withPenalty.kind === "at" && without.kind === "at", "both must have a break-even rate");
  assert.ok(withPenalty.rate < without.rate, `${withPenalty.rate} % is not lower than ${without.rate} %`);
});

Then("with that return both paths end within {float} % of each other", function (this: SimWorld, tolerancePct: number) {
  const be = this.breakEven;
  assert.ok(be.kind === "at", "no break-even rate");
  const res = runScenarios({ ...this.inputs, invWorst: be.rate, invBest: be.rate }).worst;
  const { netA, netB } = final(res);
  assert.ok(Math.abs(netA - netB) / netA <= tolerancePct / 100, `A ${netA} vs B ${netB}`);
});

Then("the verdict is:", function (this: SimWorld, text: string) {
  assert.equal(ungroup(verdict(this.inputs, this.scenarios, this.breakEven)), ungroup(text));
});

Then("the verdict starts with {string}", function (this: SimWorld, start: string) {
  const actual = ungroup(verdict(this.inputs, this.scenarios, this.breakEven));
  assert.ok(actual.startsWith(ungroup(start)), `verdict: ${actual}`);
});

// ---------- Dashboard ----------

const cards = (w: SimWorld) => summaryCards(w.inputs, w.scenarios, w.breakEven);

Then("the final net wealth is:", function (this: SimWorld, table: DataTable) {
  for (const row of table.hashes()) {
    const card = cards(this).find((c) => c.title === `Path ${row.path} final net wealth`);
    assert.ok(card, `no card for Path ${row.path}`);
    assert.equal(ungroup(card.lines[0].value), ungroup(row["worst case"]), `Path ${row.path} worst case`);
    assert.equal(ungroup(card.lines[1].value), ungroup(row["best case"]), `Path ${row.path} best case`);
  }
});

Then("the cards are titled:", function (this: SimWorld, table: DataTable) {
  assert.deepEqual(
    cards(this).map((c) => c.title),
    table.raw().map(([t]) => t),
  );
});

Then("the {string} card shows {string}", function (this: SimWorld, title: string, value: string) {
  const card = cards(this).find((c) => c.title === title);
  assert.ok(card, `no card titled "${title}"`);
  assert.equal(ungroup(card.lines.map((l) => l.value).join(" / ")), ungroup(value));
});

Then("the {string} card notes:", function (this: SimWorld, title: string, table: DataTable) {
  const card = cards(this).find((c) => c.title === title);
  assert.ok(card, `no card titled "${title}"`);
  assert.deepEqual(
    card.notes.map(normalize),
    table.raw().map(([n]) => normalize(n)),
  );
});

Then(
  "a payoff in month {int} is shown as {string} and {string}",
  function (month: number, date: string, elapsed: string) {
    assert.equal(describePayoff(month), date);
    assert.equal(describeElapsed(month), elapsed);
  },
);

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
  const series = chartSeries(this.scenarios);
  const expected = table.hashes();
  assert.equal(series.length, expected.length, "number of series");
  expected.forEach((row, i) => {
    const s = series[i];
    assert.equal(s.label, row.series, `series ${i + 1}`);
    assert.equal(colourName(cssColour(s.colorVar)), row.colour, `${row.series} colour`);
    assert.equal(s.dashed ? "dashed" : "solid", row.line, `${row.series} line style`);
    assert.equal(s.fillToPrevious ? "yes" : "no", row["shaded band"], `${row.series} band`);
  });
});

Then(
  "every chart series has one point per month including the start, with x in years elapsed",
  function (this: SimWorld) {
    const months = this.inputs.years * 12;
    for (const s of chartSeries(this.scenarios)) {
      assert.equal(s.points.length, months + 1, `${s.label} point count`);
      s.points.forEach((p, m) => {
        assert.ok(Math.abs(p.x - m / 12) < 1e-9, `${s.label} point ${m} x`);
        assert.equal(p.y, this.scenarios[s.scenario].rows[m][s.key], `${s.label} point ${m} y`);
      });
    }
  },
);

Then(
  "the chart marks Path B's payoff after {int} months with the label {string}",
  function (this: SimWorld, months: number, label: string) {
    const marker = payoffMarker(this.result);
    assert.ok(marker, "no payoff marker");
    assert.ok(Math.abs(marker.x - months / 12) < 1e-9, `marker at ${marker.x} years`);
    assert.equal(marker.label, label);
  },
);

Then("the chart has no payoff marker", function (this: SimWorld) {
  assert.equal(payoffMarker(this.result), null);
});

// ---------- Yearly table ----------

const TABLE_COLUMNS: Record<string, keyof TableRow> = {
  "extra savings / month": "extra",
  "property value": "property",
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

function assertYearlyTable(result: SimResult, table: DataTable) {
  const actualRows = yearlyTable(result);
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
      if (!key)
        throw new Error(
          `Unknown column "${column}". Known: year, payoff year, ${Object.keys(TABLE_COLUMNS).join(", ")}`,
        );
      assertAmount(actual[key] as number, expected, `year ${year}, ${column}`);
    }
  }
}

Then("the yearly table is:", function (this: SimWorld, table: DataTable) {
  assertYearlyTable(this.scenarios.worst, table);
});

Then("the best-case yearly table is:", function (this: SimWorld, table: DataTable) {
  assertYearlyTable(this.scenarios.best, table);
});
