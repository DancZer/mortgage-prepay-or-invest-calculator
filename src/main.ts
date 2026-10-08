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
import { toYearMonth } from "./calc";
import { CURRENCIES, formatMoney, type CurrencyCode } from "./currency";
import { applyInput, applyTypedValue, initialMaxes, PARAMS, type Maxes, type NumericKey } from "./params";
import { breakEvenReturn, runScenarios, type AppInputs, type Case, type Scenarios } from "./scenarios";
import { browserStore, loadInputs, saveInputs } from "./storage";
import {
  chartSeries,
  describeInputError,
  DISCLAIMER,
  fmtMillions,
  formatInputValue,
  formatParam,
  inputHint,
  payoffMarker,
  PRIVACY_NOTE,
  SERIES,
  summaryCards,
  unitLabel,
  verdict,
  warningMessage,
  yearlyTable,
} from "./view";

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Legend, Filler);

const store = browserStore();
let inputs: AppInputs = loadInputs(store);
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

$("#disclaimer").textContent = DISCLAIMER;
$("#privacy").textContent = PRIVACY_NOTE;

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

segmented(
  $("#table-case"),
  [
    ["worst", "Worst case"],
    ["best", "Best case"],
  ],
  tableCase,
  (c) => {
    tableCase = c;
    update();
  },
);

interface SliderEls {
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
    <label class="slider-label" for="${id}">${def.label}</label>
    <span class="field">
      <input id="${id}" class="num" type="text" inputmode="decimal" autocomplete="off" aria-describedby="${id}-error" />
      <span class="unit"></span>
    </span>
    <input class="range" type="range" min="${def.min}" step="${def.step}" aria-label="${def.label}" />
    <small class="hint"></small>
    <small class="error" id="${id}-error" role="alert" hidden></small>`;
  const els: SliderEls = {
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
    const result = applyTypedValue(inputs, maxes, def.key, els.field.value);
    if (!result.ok) {
      showError(els, describeInputError(def, result.error, inputs.currency));
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
    els.range.max = String(maxes[def.key]);
    els.range.value = String(value);
    els.range.setAttribute("aria-valuetext", formatParam(def, inputs));
    els.field.value = formatInputValue(def, value);
    els.unit.textContent = unitLabel(def, inputs.currency);
    els.hint.textContent = inputHint(def, inputs);
    els.hint.hidden = els.hint.textContent === "";
    showError(els, null);
  }
}
syncSliders();

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
      label: s.label,
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
      x: { type: "linear", min: 0, title: { display: true, text: "Years elapsed" }, ticks: { stepSize: 1 } },
      y: { ticks: { callback: (v) => fmtMillions(Number(v)) } },
    },
    plugins: {
      legend: { labels: { boxHeight: 2 } },
      tooltip: {
        callbacks: {
          title: (items) => {
            const m = Math.round((items[0].parsed.x ?? 0) * 12);
            if (m === 0) return "Start";
            const ym = toYearMonth(m);
            return `Year ${ym.year}, month ${ym.month}`;
          },
          label: (ctx) => `${ctx.dataset.label}: ${formatMoney(ctx.parsed.y ?? 0, inputs.currency)}`,
        },
      },
    },
  },
  plugins: [payoffLine],
});

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (ch) => `&#${ch.charCodeAt(0)};`);

function renderCards(sc: Scenarios) {
  const be = breakEvenReturn(inputs);
  cardsEl.innerHTML = summaryCards(inputs, sc, be)
    .map(
      (c) => `
    <div class="card">
      <span>${escapeHtml(c.title)}</span>
      ${c.lines
        .map(
          (l) => `<div class="card-line">${l.label ? `<small>${escapeHtml(l.label)}</small>` : ""}
            <strong${c.tone ? ` class="${c.tone}"` : ""}>${escapeHtml(l.value)}</strong></div>`,
        )
        .join("")}
      ${c.notes.map((n) => `<small>${escapeHtml(n)}</small>`).join("")}
    </div>`,
    )
    .join("");
  verdictEl.textContent = verdict(inputs, sc, be);
}

function renderTable(sc: Scenarios) {
  const money = (v: number) => formatMoney(v, inputs.currency);
  tbodyEl.replaceChildren(
    ...yearlyTable(sc[tableCase]).map((r) => {
      const tr = document.createElement("tr");
      if (r.isPayoffYear) tr.className = "payoff";
      const cells = [
        String(r.year),
        r.extra,
        r.property,
        r.netA,
        r.netB,
        r.diff,
        r.loanA,
        r.loanB,
        r.investedB,
        r.invA,
        r.invB,
      ];
      cells.forEach((c, i) => {
        const td = document.createElement("td");
        td.textContent = typeof c === "number" ? money(c) : c;
        if (i === 5 && typeof c === "number" && c < 0) td.className = "neg";
        tr.append(td);
      });
      return tr;
    }),
  );
}

function update() {
  saveInputs(store, inputs);
  const sc = runScenarios(inputs);

  const warning = warningMessage(inputs);
  warningEl.hidden = warning === null;
  warningEl.textContent = warning ?? "";

  marker = payoffMarker(sc.worst);
  chart.options.scales!.x!.max = inputs.years;
  chartSeries(sc).forEach((s, i) => (chart.data.datasets[i].data = s.points));
  chart.update();

  renderCards(sc);
  renderTable(sc);
}

update();
