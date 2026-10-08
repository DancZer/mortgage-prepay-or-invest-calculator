import {
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type Plugin,
} from "chart.js";
import { CURRENCIES, type CurrencyCode } from "./currency";
import { LANGUAGES, STRINGS, type Language } from "./i18n";
import { applyInput, applyTypedValue, initialMaxes, PARAMS, type Maxes, type NumericKey } from "./params";
import { breakEvenReturn, runScenarios, type AppInputs, type Case, type Scenarios } from "./scenarios";
import { browserStore, loadInputs, loadLanguage, saveInputs, saveLanguage } from "./storage";
import { closeTooltipIfDetached, helpButton, initTooltips, setHelp } from "./tooltip";
import {
  chartSeries,
  credits,
  describeInputError,
  describePayoff,
  fmtMillions,
  formatInputValue,
  formatParam,
  helpText,
  highlightTargets,
  inputHint,
  money,
  payoffMarker,
  SERIES,
  seriesLabel,
  startMonthOf,
  summaryCards,
  unitLabel,
  verdict,
  warningMessage,
  yearlyTable,
  type HelpKey,
  type Highlight,
  type PathName,
} from "./view";

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Legend, Filler);

const store = browserStore();
let inputs: AppInputs = loadInputs(store);
let lang: Language = loadLanguage(store, navigator.languages ?? [navigator.language]);
/** Current slider maximums; typing a larger value extends them (decision 0011). */
let maxes: Maxes = initialMaxes(inputs);
let tableCase: Case = "worst";

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const controlsEl = $("#controls");
const cardsEl = $("#cards");
const verdictEl = $("#verdict");
const warningEl = $("#warning");
const tbodyEl = $<HTMLTableSectionElement>("#table tbody");
const canvasEl = $<HTMLCanvasElement>("#chart");

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (ch) => `&#${ch.charCodeAt(0)};`);

initTooltips();

/** Markup of a "?" button for parts rendered as HTML strings (the result cards). */
const helpMarkup = (key: HelpKey, subject: string) =>
  `<button type="button" class="help" aria-expanded="false" data-help="${escapeHtml(helpText(key, lang))}" aria-label="${escapeHtml(
    STRINGS[lang].help.button(subject),
  )}">?</button>`;

/** Builds a row of toggle buttons; `onSelect` receives the chosen value. */
function segmented<T extends string>(
  container: HTMLElement,
  options: [T, string][],
  selected: T,
  onSelect: (v: T) => void,
) {
  const render = (current: T) => {
    container.replaceChildren(
      ...options.map(([value, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.setAttribute("role", "radio");
        button.setAttribute("aria-checked", String(value === current));
        button.addEventListener("click", () => {
          render(value);
          onSelect(value);
        });
        return button;
      }),
    );
  };
  render(selected);
}

segmented(
  $("#currency"),
  Object.values(CURRENCIES).map((c) => [c.code, `${c.code} (${c.label})`] as [CurrencyCode, string]),
  inputs.currency,
  (currency) => {
    inputs = { ...inputs, currency };
    syncSliders();
    update();
  },
);

interface SliderEls {
  label: HTMLLabelElement;
  help: HTMLButtonElement;
  range: HTMLInputElement;
  field: HTMLInputElement;
  unit: HTMLElement;
  hint: HTMLElement;
  error: HTMLElement;
}
const sliderEls = new Map<NumericKey, SliderEls>();

function showError(els: SliderEls, message: string | null) {
  els.error.hidden = message === null;
  els.error.textContent = message ?? "";
  els.field.classList.toggle("invalid", message !== null);
  els.field.setAttribute("aria-invalid", String(message !== null));
}

for (const def of PARAMS) {
  const id = `field-${def.key}`;
  const row = document.createElement("div");
  row.className = "slider";
  row.innerHTML = `
    <span class="slider-head"><label class="slider-label" for="${id}"></label></span>
    <span class="field">
      <input id="${id}" class="num" type="text" inputmode="decimal" autocomplete="off" aria-describedby="${id}-error" />
      <span class="unit"></span>
    </span>
    <input class="range" type="range" min="${def.min}" step="${def.step}" />
    <small class="hint"></small>
    <small class="error" id="${id}-error" role="alert" hidden></small>`;
  const help = helpButton();
  row.querySelector(".slider-head")!.append(help);
  const els: SliderEls = {
    label: row.querySelector(".slider-label")!,
    help,
    range: row.querySelector(".range")!,
    field: row.querySelector(".num")!,
    unit: row.querySelector(".unit")!,
    hint: row.querySelector(".hint")!,
    error: row.querySelector(".error")!,
  };
  sliderEls.set(def.key, els);

  els.range.addEventListener("input", () => {
    inputs = applyInput(inputs, def.key, Number(els.range.value));
    syncSliders();
    update();
  });
  // Typed values apply on Enter or when the field loses focus.
  els.field.addEventListener("change", () => {
    const result = applyTypedValue(inputs, maxes, def.key, els.field.value, lang);
    if (!result.ok) {
      showError(els, describeInputError(def, result.error, inputs.currency, lang));
      return;
    }
    inputs = result.inputs;
    maxes = result.maxes;
    syncSliders();
    update();
  });
  els.field.addEventListener("keydown", (e) => {
    if (e.key === "Escape") syncSliders();
  });
  controlsEl.append(row);
}

/** Reflects `inputs` and slider maximums into all controls (after any change, and on load). */
function syncSliders() {
  for (const def of PARAMS) {
    const els = sliderEls.get(def.key)!;
    const value = inputs[def.key];
    els.label.textContent = STRINGS[lang].params[def.key];
    setHelp(els.help, helpText(def.key, lang), STRINGS[lang].help.button(STRINGS[lang].params[def.key]));
    els.range.setAttribute("aria-label", STRINGS[lang].params[def.key]);
    els.range.max = String(maxes[def.key]);
    els.range.value = String(value);
    els.range.setAttribute("aria-valuetext", formatParam(def, inputs, lang));
    els.field.value = formatInputValue(def, value, lang);
    els.unit.textContent = unitLabel(def, inputs.currency, lang);
    els.hint.textContent = inputHint(def, inputs, lang);
    els.hint.hidden = els.hint.textContent === "";
    showError(els, null);
  }
}

const buildDate = typeof __BUILD_DATE__ === "string" ? __BUILD_DATE__ : new Date().toISOString().slice(0, 10);

/** Puts every fixed text of the page into the chosen language. */
function renderTexts() {
  const t = STRINGS[lang];
  document.documentElement.lang = lang;
  document.title = t.title;
  $("#title").textContent = t.title;
  $("#lede").innerHTML =
    `<strong>${escapeHtml(t.pathA)}:</strong> ${escapeHtml(t.ledeA)}<br />` +
    `<strong>${escapeHtml(t.pathB)}:</strong> ${escapeHtml(t.ledeB)}<br />${escapeHtml(t.ledeBoth)}`;
  $("#currency").setAttribute("aria-label", t.labels.currency);
  $("#language").setAttribute("aria-label", t.labels.language);
  $("#table-case").setAttribute("aria-label", t.labels.tableCase);
  $("#table-title").textContent = t.table.title;
  $("#table-head").replaceChildren(
    ...t.table.headers.map((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      return th;
    }),
  );
  // "?" buttons of the currency switch, verdict, chart and table (created once, texts per language).
  const subjects: Record<string, string> = {
    currency: t.labels.currency,
    verdict: t.help.subjects.verdict,
    chart: t.help.subjects.chart,
    table: t.table.title,
  };
  document.querySelectorAll<HTMLElement>(".help-slot[data-help-key]").forEach((slot) => {
    const key = slot.dataset.helpKey as HelpKey;
    const button = slot.querySelector<HTMLButtonElement>("button.help") ?? slot.appendChild(helpButton());
    setHelp(button, helpText(key, lang), t.help.button(subjects[key]));
  });
  $("#disclaimer").textContent = t.disclaimer;
  $("#privacy").textContent = t.privacy;

  segmented(
    $("#table-case"),
    [
      ["worst", t.table.worst],
      ["best", t.table.best],
    ],
    tableCase,
    (c) => {
      tableCase = c;
      update();
    },
  );
  segmented(
    $("#language"),
    LANGUAGES.map((l) => [l, STRINGS[l].languageName] as [Language, string]),
    lang,
    (l) => {
      lang = l;
      saveLanguage(store, lang);
      renderTexts();
      syncSliders();
      update();
    },
  );

  const c = credits(lang, buildDate);
  $("#credits").innerHTML = `
    <div>${escapeHtml(c.createdBy)} · <a href="${c.authorUrl}" target="_blank" rel="noopener">${escapeHtml(c.authorLinkText)}</a></div>
    <div>${escapeHtml(c.copyright)} · <a href="${c.licenseUrl}" target="_blank" rel="noopener">${escapeHtml(c.license)}</a></div>
    <div>${escapeHtml(c.version)}</div>`;

  chart.options.scales!.x!.title!.text = t.chart.axis;
  SERIES.forEach((s, i) => (chart.data.datasets[i].label = seriesLabel(s, lang)));
}

const css = getComputedStyle(document.documentElement);
const color = (name: string) => css.getPropertyValue(name).trim();

let marker: ReturnType<typeof payoffMarker> = null;

/** Draws a dashed vertical line where Path B's mortgage is paid off. */
const payoffLine: Plugin<"line"> = {
  id: "payoffLine",
  afterDatasetsDraw(chart) {
    if (marker === null) return;
    const { ctx, chartArea, scales } = chart;
    const x = scales.x.getPixelForValue(marker.x);
    ctx.save();
    ctx.strokeStyle = color("--muted");
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.fillStyle = color("--muted");
    ctx.font = "12px system-ui, sans-serif";
    // Put the label on the left of the line when it would run off the right edge.
    const onLeft = x + 6 + ctx.measureText(marker.label).width > chartArea.right;
    ctx.textAlign = onLeft ? "right" : "left";
    ctx.fillText(marker.label, onLeft ? x - 6 : x + 6, chartArea.top + 14);
    ctx.restore();
  },
};

type Point = { x: number; y: number };

const chart = new Chart<"line", Point[]>(canvasEl, {
  type: "line",
  data: {
    datasets: SERIES.map((s) => ({
      label: "",
      data: [],
      borderColor: color(s.colorVar),
      backgroundColor: s.fillToPrevious ? color(`${s.colorVar}-band`) : color(s.colorVar),
      borderDash: s.dashed ? [6, 4] : [],
      borderWidth: s.key === "loanB" ? 2 : 1.5,
      fill: s.fillToPrevious ? "-1" : false,
    })),
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    parsing: false,
    elements: { point: { radius: 0, hitRadius: 6 } },
    interaction: { mode: "index", intersect: false },
    scales: {
      x: { type: "linear", min: 0, title: { display: true, text: "" }, ticks: { stepSize: 1 } },
      y: { ticks: { callback: (v) => fmtMillions(Number(v), lang) } },
    },
    plugins: {
      legend: { labels: { boxHeight: 2 } },
      tooltip: {
        callbacks: {
          title: (items) => {
            const m = Math.round((items[0].parsed.x ?? 0) * 12);
            return m === 0 ? STRINGS[lang].chart.start : describePayoff(m, lang);
          },
          label: (ctx) => `${ctx.dataset.label}: ${money(ctx.parsed.y ?? 0, inputs.currency, lang)}`,
        },
      },
    },
  },
  plugins: [payoffLine],
});

function renderCards(sc: Scenarios) {
  const be = breakEvenReturn(inputs);
  cardsEl.innerHTML = summaryCards(inputs, sc, lang, startMonthOf(new Date()))
    .map(
      (c) => `
    <div class="card">
      <span class="card-title">${escapeHtml(c.title)} ${helpMarkup(c.help, c.title)}</span>
      ${c.lines
        .map(
          (l) =>
            `<div class="card-line"${
              l.highlight ? ` tabindex="0" data-path="${l.highlight.path}" data-scenario="${l.highlight.scenario}"` : ""
            }>${l.label ? `<small>${escapeHtml(l.label)}</small>` : ""}
            <strong${(l.tone ?? c.tone) ? ` class="${l.tone ?? c.tone}"` : ""}>${escapeHtml(l.value)}</strong></div>`,
        )
        .join("")}
      ${c.notes.map((n) => `<small>${escapeHtml(n)}</small>`).join("")}
    </div>`,
    )
    .join("");
  verdictEl.textContent = verdict(inputs, sc, be, lang);
}

/** Renders the yearly table for `shownCase` and marks the highlighted path's columns, if any. */
function renderTable(sc: Scenarios, shownCase: Case = tableCase, highlighted: Highlight | null = null) {
  const columns = highlighted ? highlightTargets(highlighted).columns : [];
  const hlClass = highlighted ? `hl-${highlighted.path.toLowerCase()}` : "";
  [...$("#table-head").children].forEach((th, i) => th.classList.toggle("hl", columns.includes(i)));
  $("#table-head").dataset.hl = hlClass;
  tbodyEl.dataset.hl = hlClass;
  tbodyEl.replaceChildren(
    ...yearlyTable(sc[shownCase]).map((r) => {
      const tr = document.createElement("tr");
      if (r.isPayoffYear) tr.className = "payoff";
      const cells = [String(r.year), r.extra, r.netA, r.netB, r.diff, r.loanA, r.loanB, r.investedB, r.invA, r.invB];
      cells.forEach((c, i) => {
        const td = document.createElement("td");
        td.textContent = typeof c === "number" ? money(c, inputs.currency, lang) : c;
        if (i === 4 && typeof c === "number" && c < 0) td.className = "neg";
        if (columns.includes(i)) td.classList.add("hl");
        tr.append(td);
      });
      return tr;
    }),
  );
}

let lastScenarios: Scenarios | null = null;

/** Chart styles as configured, so a highlight can be undone. */
const baseStyles = chart.data.datasets.map((d) => ({
  borderColor: d.borderColor as string,
  backgroundColor: d.backgroundColor as string,
  borderWidth: d.borderWidth as number,
}));

/** Emphasises one path and case in the chart and table (or restores everything for null). */
function applyHighlight(h: Highlight | null) {
  const target = h ? highlightTargets(h) : null;
  chart.data.datasets.forEach((d, i) => {
    const base = baseStyles[i];
    const faded = target !== null && i !== target.seriesIndex;
    d.borderColor = faded ? `${base.borderColor}40` : base.borderColor; // 40 = 25 % opacity
    d.backgroundColor = target ? "transparent" : base.backgroundColor;
    d.borderWidth = target && i === target.seriesIndex ? 3.5 : base.borderWidth;
  });
  chart.update("none");
  const shown = target?.tableCase ?? tableCase;
  if (lastScenarios) renderTable(lastScenarios, shown, h);
  // Keep the Worst/Best switch in step with the case the table shows.
  $("#table-case")
    .querySelectorAll("button")
    .forEach((b, i) => b.setAttribute("aria-checked", String((i === 0 ? "worst" : "best") === shown)));
}

function highlightOf(el: EventTarget | null): Highlight | null {
  const line = (el as HTMLElement | null)?.closest<HTMLElement>(".card-line[data-path]");
  return line ? { path: line.dataset.path as PathName, scenario: line.dataset.scenario as Case } : null;
}

// Hovering or focusing a result value highlights its path in the chart and the table.
cardsEl.addEventListener("mouseover", (e) => {
  const h = highlightOf(e.target);
  if (h) applyHighlight(h);
});
cardsEl.addEventListener("mouseout", (e) => {
  if (highlightOf(e.target) && !highlightOf(e.relatedTarget)) applyHighlight(null);
});
cardsEl.addEventListener("focusin", (e) => applyHighlight(highlightOf(e.target)));
cardsEl.addEventListener("focusout", () => applyHighlight(null));

function update() {
  saveInputs(store, inputs);
  const sc = runScenarios(inputs);
  lastScenarios = sc;

  const warning = warningMessage(inputs, lang);
  warningEl.hidden = warning === null;
  warningEl.textContent = warning ?? "";

  marker = payoffMarker(sc.worst, lang);
  chart.options.scales!.x!.max = inputs.years;
  chartSeries(sc, lang).forEach((s, i) => (chart.data.datasets[i].data = s.points));
  chart.update();

  renderCards(sc);
  renderTable(sc);
  closeTooltipIfDetached();
}

renderTexts();
syncSliders();
update();
