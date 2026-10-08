import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Given, Then, When, type DataTable } from "@cucumber/cucumber";
import type { MonthRow, SimResult } from "../../src/calc";
import { isCurrencyCode } from "../../src/currency";
import { STRINGS, type Language } from "../../src/i18n";
import { applyInput, applyTypedValue, defaultInputs, initialMaxes, paramDef, PARAMS } from "../../src/params";
import { breakEvenReturn, runScenarios, type Case } from "../../src/scenarios";
import { loadInputs, loadLanguage, saveInputs, saveLanguage, STORAGE_KEY } from "../../src/storage";
import {
  chartSeries,
  describeBreakEven,
  calendarMonth,
  describeDuration,
  describeInputError,
  credits,
  formatParam,
  helpText,
  highlightTargets,
  money,
  payoffMarker,
  summaryCards,
  verdict,
  warningMessage,
  yearlyTable,
  type HelpKey,
  type StartMonth,
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
  this.update({ inf: 0, invWorst: 0, invBest: 0, mort: 0, penalty: 0 });
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
  assert.equal(normalize(formatParam(paramDef(paramKey(name)), this.inputs, this.lang)), normalize(label));
});

Then("the amount {string} is shown as {string}", function (this: SimWorld, amount: string, shown: string) {
  assert.equal(normalize(money(parseNumber(amount), this.inputs.currency, this.lang)), normalize(shown));
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
    assert.ok(def.defaultValue >= def.min && def.defaultValue <= def.max, `${def.key}: default outside range`);
    const steps = (def.defaultValue - def.min) / def.step;
    assert.ok(
      Math.abs(steps - Math.round(steps)) < 1e-9,
      `${def.key}: default ${def.defaultValue} is not on the step grid`,
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
  this.maxes = initialMaxes(this.inputs);
});

// ---------- Typed values ----------

When(/^I type "(.*)" into the (.+) field$/, function (this: SimWorld, text: string, name: string) {
  const key = paramKey(name);
  this.inputsBeforeTyping = this.inputs;
  const result = applyTypedValue(this.inputs, this.maxes, key, text, this.lang);
  if (result.ok) {
    this.setInputs(result.inputs);
    this.maxes = result.maxes;
    this.lastError = null;
  } else {
    this.lastError = describeInputError(paramDef(key), result.error, this.inputs.currency, this.lang);
  }
});

Then(/^the (.+) slider goes up to (.+)$/, function (this: SimWorld, name: string, value: string) {
  assertAmount(this.maxes[paramKey(name)], value, `${name} slider maximum`);
});

Then("the input is rejected with {string}", function (this: SimWorld, message: string) {
  assert.equal(this.lastError === null ? null : normalize(this.lastError), normalize(message));
});

Then("no parameter has changed", function (this: SimWorld) {
  assert.deepEqual(this.inputs, this.inputsBeforeTyping);
});

Then("the typed value is accepted", function (this: SimWorld) {
  assert.equal(this.lastError, null);
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
  "in every month, net wealth equals investments minus the remaining loan, for both paths",
  function (this: SimWorld) {
    for (const c of ["worst", "best"] as Case[]) {
      for (const r of this.scenarios[c].rows) {
        assert.ok(Math.abs(r.netA - (r.invA - r.loanA)) < 1e-6, `${c} case, month ${r.month}: Path A`);
        assert.ok(Math.abs(r.netB - (r.invB - r.loanB)) < 1e-6, `${c} case, month ${r.month}: Path B`);
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
  const warning = warningMessage(this.inputs, this.lang);
  assert.ok(warning?.includes("doesn't cover"), `expected a warning, got ${warning}`);
});

Then("no warning is shown", function (this: SimWorld) {
  assert.equal(warningMessage(this.inputs, this.lang), null);
});

// ---------- Break-even and verdict ----------

Then("the break-even return is {string}", function (this: SimWorld, expected: string) {
  assert.equal(normalize(describeBreakEven(this.breakEven, this.lang)), normalize(expected));
});

Then("the break-even return is lower than without a penalty", function (this: SimWorld) {
  const withPenalty = this.breakEven;
  const without = breakEvenReturn({ ...this.inputs, penalty: 0 });
  assert.ok(withPenalty.kind === "at" && without.kind === "at", "both must have a break-even rate");
  assert.ok(withPenalty.rate < without.rate, `${withPenalty.rate} % is not lower than ${without.rate} %`);
});

Then("with that return both paths end within {float}% of each other", function (this: SimWorld, tolerancePct: number) {
  const be = this.breakEven;
  assert.ok(be.kind === "at", "no break-even rate");
  const res = runScenarios({ ...this.inputs, invWorst: be.rate, invBest: be.rate }).worst;
  const { netA, netB } = final(res);
  assert.ok(Math.abs(netA - netB) / netA <= tolerancePct / 100, `A ${netA} vs B ${netB}`);
});

Then("the verdict is:", function (this: SimWorld, text: string) {
  assert.equal(ungroup(verdict(this.inputs, this.scenarios, this.breakEven, this.lang)), ungroup(text));
});

Then("the verdict starts with {string}", function (this: SimWorld, start: string) {
  const actual = ungroup(verdict(this.inputs, this.scenarios, this.breakEven, this.lang));
  assert.ok(actual.startsWith(ungroup(start)), `verdict: ${actual}`);
});

// ---------- Dashboard ----------

const cards = (w: SimWorld) => summaryCards(w.inputs, w.scenarios, w.lang, w.start);

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

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "October 2026" → the loan's start month. */
function parseStart(text: string): StartMonth {
  const [name, year] = text.trim().split(" ");
  const month = MONTHS.indexOf(name) + 1;
  assert.ok(month > 0 && Number(year) > 0, `not a month and year: ${text}`);
  return { year: Number(year), month };
}

Then(
  /^a payoff in month (\d+) of a loan starting in (\w+ \d{4}) is shown as "(.*)" in "(.*)"$/,
  function (this: SimWorld, month: string, start: string, time: string, date: string) {
    assert.equal(describeDuration(Number(month), this.lang), time);
    assert.equal(calendarMonth(Number(month), parseStart(start), this.lang), date);
  },
);

Then(
  /^the mortgage-free card shows, for a loan starting in (\w+ \d{4}):$/,
  function (this: SimWorld, start: string, table: DataTable) {
    this.start = parseStart(start);
    const card = cards(this)[3];
    assert.equal(card.title, STRINGS[this.lang].cards.mortgageFree);
    const rows = table.hashes();
    assert.equal(card.lines.length, rows.length, "number of lines");
    rows.forEach((row, i) => {
      const line = card.lines[i];
      const pathName = row.path === "A" ? STRINGS[this.lang].pathA : STRINGS[this.lang].pathB;
      // Like "Worst case (3.0%)" on the other cards, the label carries the detail in brackets.
      assert.equal(line.label, row.date ? `${pathName} (${row.date})` : pathName, `Path ${row.path} label`);
      assert.equal(line.value, row.time, `Path ${row.path} time`);
    });
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
  const series = chartSeries(this.scenarios, this.lang);
  const expected = table.hashes();
  assert.equal(series.length, expected.length, "number of series");
  expected.forEach((row, i) => {
    const s = series[i];
    assert.equal(s.text, row.series, `series ${i + 1}`);
    assert.equal(colourName(cssColour(s.colorVar)), row.colour, `${row.series} colour`);
    assert.equal(s.dashed ? "dashed" : "solid", row.line, `${row.series} line style`);
    assert.equal(s.fillToPrevious ? "yes" : "no", row["shaded band"], `${row.series} band`);
  });
});

Then(
  "every chart series has one point per month including the start, with x in years elapsed",
  function (this: SimWorld) {
    const months = this.inputs.years * 12;
    for (const s of chartSeries(this.scenarios, this.lang)) {
      assert.equal(s.points.length, months + 1, `${s.text} point count`);
      s.points.forEach((p, m) => {
        assert.ok(Math.abs(p.x - m / 12) < 1e-9, `${s.text} point ${m} x`);
        assert.equal(p.y, this.scenarios[s.scenario].rows[m][s.key], `${s.text} point ${m} y`);
      });
    }
  },
);

Then(
  "the chart marks Path B's payoff after {int} months with the label {string}",
  function (this: SimWorld, months: number, label: string) {
    const marker = payoffMarker(this.result, this.lang);
    assert.ok(marker, "no payoff marker");
    assert.ok(Math.abs(marker.x - months / 12) < 1e-9, `marker at ${marker.x} years`);
    assert.equal(marker.label, label);
  },
);

Then("the chart has no payoff marker", function (this: SimWorld) {
  assert.equal(payoffMarker(this.result, this.lang), null);
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

// ---------- Languages and credits ----------

const LANGUAGE_NAMES: Record<string, Language> = { hungarian: "hu", slovak: "sk", german: "de", english: "en" };

function languageCode(name: string): Language {
  const code = LANGUAGE_NAMES[name.trim().toLowerCase()];
  assert.ok(code, `Unknown language "${name}". Known: ${Object.keys(LANGUAGE_NAMES).join(", ")}`);
  return code;
}

Given("the language is {word}", function (this: SimWorld, name: string) {
  this.lang = languageCode(name);
});

Given("I chose {word} before", function (this: SimWorld, name: string) {
  saveLanguage(this.store, languageCode(name));
});

Given("the app was built on {string}", function (this: SimWorld, date: string) {
  this.buildDate = date;
});

When("I open the app in a browser set to {string}", function (this: SimWorld, languages: string) {
  const list = languages
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
  this.lang = loadLanguage(this.store, list);
});

Then("the app is shown in {word}", function (this: SimWorld, name: string) {
  assert.equal(this.lang, languageCode(name));
});

Then("the title is {string}", function (this: SimWorld, title: string) {
  assert.equal(STRINGS[this.lang].title, title);
});

/** Lists every text path of a strings object, e.g. "cards.netA" or "table.headers.3". */
function textPaths(value: unknown, prefix = ""): string[] {
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => textPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

Then("every language has the same texts as English, none of them empty", function () {
  const english = textPaths(STRINGS.en).sort();
  for (const code of Object.keys(STRINGS) as Language[]) {
    assert.deepEqual(textPaths(STRINGS[code]).sort(), english, `${code}: texts differ from English`);
    const check = (value: unknown, path: string) => {
      if (typeof value === "string" && !path.includes(".separators."))
        assert.ok(value.trim() !== "", `${code}: ${path} is empty`);
    };
    const walk = (value: unknown, path: string) =>
      value && typeof value === "object"
        ? Object.entries(value).forEach(([k, v]) => walk(v, `${path}.${k}`))
        : check(value, path);
    walk(STRINGS[code], code);
    assert.deepEqual(Object.keys(STRINGS[code].params).sort(), PARAMS.map((p) => p.key).sort(), `${code}: labels`);
  }
});

Then("the credits are:", function (this: SimWorld, table: DataTable) {
  const c = credits(this.lang, this.buildDate);
  const expected = table.rowsHash();
  assert.equal(c.createdBy, expected["created by"], "created by");
  assert.equal(c.copyright, expected["copyright"], "copyright");
  assert.equal(normalize(c.version), normalize(expected["version"]), "version");
  assert.equal(c.authorUrl, expected["author link"], "author link");
  assert.equal(c.license, expected["license"], "license");
  assert.equal(c.licenseUrl, expected["license link"], "license link");
});

Then(/^0 is within the (.+) slider's range$/, function (this: SimWorld, name: string) {
  const def = paramDef(paramKey(name));
  assert.ok(def.min <= 0 && def.max >= 0, `${name}: slider range ${def.min}–${def.max} does not include 0`);
});

Then("the difference is shown in the colour of the path that is ahead:", function (this: SimWorld, table: DataTable) {
  const card = cards(this)[2];
  const toneName = (tone: string | undefined) => (tone === "a" ? "Path A" : tone === "b" ? "Path B" : "neither");
  const expected = table.rowsHash();
  assert.equal(toneName(card.lines[0].tone), expected["worst case"], "worst case colour");
  assert.equal(toneName(card.lines[1].tone), expected["best case"], "best case colour");
});

// ---------- Highlighting ----------

When(/^I point at the (worst|best) value of Path (A|B)$/, function (this: SimWorld, scenario: string, path: string) {
  const card = cards(this)[path === "A" ? 0 : 1];
  const line = card.lines.find((l) => l.highlight?.scenario === scenario);
  assert.ok(line?.highlight, `no ${scenario} value on the Path ${path} card`);
  assert.equal(line.highlight.path, path);
  this.pointed = line.highlight;
});

Then("the chart emphasises {string}", function (this: SimWorld, series: string) {
  assert.ok(this.pointed, "nothing is pointed at");
  const index = highlightTargets(this.pointed).seriesIndex;
  assert.equal(chartSeries(this.scenarios, this.lang)[index].text, series);
});

Then(
  /^the table shows the (worst|best) case with these columns highlighted:$/,
  function (this: SimWorld, scenario: string, table: DataTable) {
    assert.ok(this.pointed, "nothing is pointed at");
    const targets = highlightTargets(this.pointed);
    assert.equal(targets.tableCase, scenario);
    const headers = STRINGS[this.lang].table.headers;
    assert.deepEqual(
      targets.columns.map((i) => headers[i]),
      table
        .raw()[0][0]
        .split(",")
        .map((c) => c.trim()),
    );
  },
);

Then(
  "only the values of the {string} and {string} cards highlight a path",
  function (this: SimWorld, first: string, second: string) {
    for (const card of cards(this)) {
      const expected = card.title === first || card.title === second;
      for (const line of card.lines) assert.equal(Boolean(line.highlight), expected, `${card.title}: ${line.label}`);
    }
  },
);

Then("the {string} card has no notes", function (this: SimWorld, title: string) {
  const card = cards(this).find((c) => c.title === title);
  assert.ok(card, `no card titled "${title}"`);
  assert.deepEqual(card.notes, []);
});

// ---------- Explanations ----------

const HELP_KEYS: HelpKey[] = [
  ...PARAMS.map((p) => p.key),
  "netA",
  "netB",
  "difference",
  "mortgageFree",
  "verdict",
  "chart",
  "table",
  "currency",
];

Then(
  "every input, result card, the summary, the chart, the table and the currency switch have an explanation",
  function (this: SimWorld) {
    for (const key of HELP_KEYS) {
      const text = helpText(key, this.lang);
      assert.ok(typeof text === "string" && text.trim().length > 0, `${this.lang}: no explanation for ${key}`);
    }
  },
);

Then("all explanations are different from each other and longer than their label", function (this: SimWorld) {
  const texts = HELP_KEYS.map((key) => helpText(key, this.lang));
  assert.equal(new Set(texts).size, texts.length, `${this.lang}: two explanations are identical`);
  for (const def of PARAMS) {
    const label = STRINGS[this.lang].params[def.key];
    assert.ok(helpText(def.key, this.lang).length > label.length * 2, `${this.lang}: ${def.key} explanation too short`);
  }
});

Then("the cards have these explanations:", function (this: SimWorld, table: DataTable) {
  assert.deepEqual(
    cards(this).map((c) => [c.title, c.help]),
    table.raw().map(([title, key]) => [title, key]),
  );
});

Then(/^the explanation of the (.+) is:$/, function (this: SimWorld, name: string, text: string) {
  assert.equal(helpText(paramKey(name), this.lang), normalize(text));
});

Then(/^the "\?" button of the (.+) is announced as "(.+)"$/, function (this: SimWorld, name: string, label: string) {
  assert.equal(STRINGS[this.lang].help.button(STRINGS[this.lang].params[paramKey(name)]), label);
});

Then("no removed inputs are kept", function (this: SimWorld) {
  assert.deepEqual(Object.keys(this.inputs).sort(), Object.keys(defaultInputs()).sort());
});
