import {
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type Plugin,
} from "chart.js";
import { simulate, toYearMonth, type SimInputs, type SimResult } from "./calc";
import { applyInput, defaultInputs, PARAMS, prepayMax } from "./params";
import {
  chartSeries,
  fmtMillions,
  fmtMoney,
  formatParam,
  payoffMarker,
  SERIES,
  summaryCards,
  warningMessage,
  yearlyTable,
} from "./view";

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Legend);

let inputs: SimInputs = defaultInputs();

const controlsEl = document.querySelector<HTMLElement>("#controls")!;
const cardsEl = document.querySelector<HTMLElement>("#cards")!;
const warningEl = document.querySelector<HTMLElement>("#warning")!;
const tbodyEl = document.querySelector<HTMLTableSectionElement>("#table tbody")!;
const canvasEl = document.querySelector<HTMLCanvasElement>("#chart")!;

const sliderEls = new Map<keyof SimInputs, { input: HTMLInputElement; output: HTMLOutputElement }>();

for (const def of PARAMS) {
  const row = document.createElement("label");
  row.className = "slider";
  row.innerHTML = `
    <span class="slider-label">${def.label}</span>
    <output>${formatParam(def, def.defaultValue)}</output>
    <input type="range" min="${def.min}" max="${def.max}" step="${def.step}" value="${def.defaultValue}" />`;
  const input = row.querySelector("input")!;
  const output = row.querySelector("output")!;
  sliderEls.set(def.key, { input, output });
  input.addEventListener("input", () => {
    inputs = applyInput(inputs, def.key, Number(input.value));
    syncSliders();
    update();
  });
  controlsEl.append(row);
}

/** Reflects `inputs` back into the sliders (needed when one change clamps another). */
function syncSliders() {
  sliderEls.get("prepay")!.input.max = String(prepayMax(inputs));
  for (const def of PARAMS) {
    const { input, output } = sliderEls.get(def.key)!;
    if (Number(input.value) !== inputs[def.key]) input.value = String(inputs[def.key]);
    output.textContent = formatParam(def, inputs[def.key]);
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
      backgroundColor: color(s.colorVar),
      borderDash: s.dashed ? [6, 4] : [],
    })),
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    parsing: false,
    elements: { point: { radius: 0, hitRadius: 6 }, line: { borderWidth: 2 } },
    interaction: { mode: "index", intersect: false },
    scales: {
      x: { type: "linear", min: 0, title: { display: true, text: "Years elapsed" }, ticks: { stepSize: 1 } },
      y: { ticks: { callback: (v) => fmtMillions(Number(v)) } },
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (items) => {
            const m = Math.round((items[0].parsed.x ?? 0) * 12);
            if (m === 0) return "Start";
            const ym = toYearMonth(m);
            return `Year ${ym.year}, month ${ym.month}`;
          },
          label: (ctx) => `${ctx.dataset.label}: ${fmtMoney(ctx.parsed.y ?? 0)}`,
        },
      },
    },
  },
  plugins: [payoffLine],
});

function renderCards(res: SimResult) {
  cardsEl.innerHTML = summaryCards(res)
    .map(
      (c) => `
    <div class="card">
      <span>${c.title}</span><strong${c.tone ? ` class="${c.tone}"` : ""}>${c.value}</strong>
      ${c.notes.map((n) => `<small>${n}</small>`).join("")}
    </div>`,
    )
    .join("");
}

function renderTable(res: SimResult) {
  tbodyEl.replaceChildren(
    ...yearlyTable(res).map((r) => {
      const tr = document.createElement("tr");
      if (r.isPayoffYear) tr.className = "payoff";
      const cells = [String(r.year), r.extra, r.netA, r.netB, r.diff, r.loanA, r.loanB, r.investedB, r.invA, r.invB];
      cells.forEach((c, i) => {
        const td = document.createElement("td");
        td.textContent = typeof c === "number" ? fmtMoney(c) : c;
        if (i === 4 && typeof c === "number" && c < 0) td.className = "neg";
        tr.append(td);
      });
      return tr;
    }),
  );
}

function update() {
  const res = simulate(inputs);

  const warning = warningMessage(inputs);
  warningEl.hidden = warning === null;
  warningEl.textContent = warning ?? "";

  marker = payoffMarker(res);
  chart.options.scales!.x!.max = inputs.years;
  chartSeries(res).forEach((s, i) => (chart.data.datasets[i].data = s.points));
  chart.update();

  renderCards(res);
  renderTable(res);
}

update();
