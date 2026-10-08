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
import { elapsedTime, installmentTooLow, simulate, toYearMonth, type SimInputs, type SimResult } from "./calc";

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Legend);

const CURRENCY = "HUF";
const LOCALE = "hu-HU";

const money = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 });
const fmtMoney = (v: number) => money.format(v);
const fmtMillions = (v: number) => `${(v / 1e6).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} M`;
const fmtPct = (digits: number) => (v: number) => `${v.toFixed(digits)} %`;

interface SliderDef {
  key: keyof SimInputs;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (v: number) => string;
}

const sliders: SliderDef[] = [
  { key: "initial", label: "Loan amount / property value", min: 10_000_000, max: 100_000_000, step: 1_000_000, value: 45_000_000, format: fmtMoney },
  { key: "installment", label: "Monthly installment", min: 100_000, max: 600_000, step: 10_000, value: 300_000, format: fmtMoney },
  { key: "extra", label: "Monthly extra savings", min: 20_000, max: 500_000, step: 10_000, value: 150_000, format: fmtMoney },
  { key: "prepay", label: "…of which prepayment (Path B)", min: 0, max: 500_000, step: 5_000, value: 75_000, format: fmtMoney },
  { key: "inf", label: "Annual savings growth / inflation", min: 0, max: 15, step: 0.5, value: 4, format: fmtPct(1) },
  { key: "inv", label: "Investment annual return", min: 0.1, max: 20, step: 0.1, value: 10, format: fmtPct(1) },
  { key: "mort", label: "Mortgage interest rate", min: 0.1, max: 15, step: 0.01, value: 6.18, format: fmtPct(2) },
  { key: "penalty", label: "Prepayment penalty", min: 0, max: 5, step: 0.1, value: 1.5, format: fmtPct(1) },
  { key: "years", label: "Time horizon (years)", min: 15, max: 30, step: 1, value: 25, format: (v) => `${v}` },
];

const inputs = Object.fromEntries(sliders.map((s) => [s.key, s.value])) as unknown as SimInputs;

const controlsEl = document.querySelector<HTMLElement>("#controls")!;
const cardsEl = document.querySelector<HTMLElement>("#cards")!;
const warningEl = document.querySelector<HTMLElement>("#warning")!;
const tbodyEl = document.querySelector<HTMLTableSectionElement>("#table tbody")!;
const canvasEl = document.querySelector<HTMLCanvasElement>("#chart")!;

const sliderEls = new Map<keyof SimInputs, { input: HTMLInputElement; output: HTMLOutputElement; def: SliderDef }>();

for (const s of sliders) {
  const row = document.createElement("label");
  row.className = "slider";
  row.innerHTML = `
    <span class="slider-label">${s.label}</span>
    <output>${s.format(s.value)}</output>
    <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" />`;
  const input = row.querySelector("input")!;
  const output = row.querySelector("output")!;
  sliderEls.set(s.key, { input, output, def: s });
  input.addEventListener("input", () => {
    inputs[s.key] = Number(input.value);
    output.textContent = s.format(inputs[s.key]);
    if (s.key === "extra") capPrepay();
    update();
  });
  controlsEl.append(row);
}

/** Prepayment can never exceed the extra savings: limit the slider and clamp its value. */
function capPrepay() {
  const prepay = sliderEls.get("prepay")!;
  prepay.input.max = String(inputs.extra);
  if (inputs.prepay > inputs.extra) {
    inputs.prepay = inputs.extra;
    prepay.input.value = String(inputs.extra);
    prepay.output.textContent = prepay.def.format(inputs.extra);
  }
}
capPrepay();

const css = getComputedStyle(document.documentElement);
const color = (name: string) => css.getPropertyValue(name).trim();

let payoffMonthB: number | null = null;

/** Draws a dashed vertical line where Path B's mortgage is paid off. */
const payoffLine: Plugin<"line"> = {
  id: "payoffLine",
  afterDatasetsDraw(chart) {
    if (payoffMonthB === null) return;
    const { ctx, chartArea, scales } = chart;
    const x = scales.x.getPixelForValue(payoffMonthB / 12);
    ctx.save();
    ctx.strokeStyle = color("--muted");
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.fillStyle = color("--muted");
    ctx.font = "12px system-ui, sans-serif";
    const label = `B mortgage-free: ${describePayoff(payoffMonthB)}`;
    // Put the label on the left of the line when it would run off the right edge.
    const onLeft = x + 6 + ctx.measureText(label).width > chartArea.right;
    ctx.textAlign = onLeft ? "right" : "left";
    ctx.fillText(label, onLeft ? x - 6 : x + 6, chartArea.top + 14);
    ctx.restore();
  },
};

type Point = { x: number; y: number };

const chart = new Chart<"line", Point[]>(canvasEl, {
  type: "line",
  data: {
    datasets: [
      { label: "Path A net wealth", data: [], borderColor: color("--series-a"), backgroundColor: color("--series-a") },
      { label: "Path B net wealth", data: [], borderColor: color("--series-b"), backgroundColor: color("--series-b") },
      {
        label: "Path B remaining loan",
        data: [],
        borderColor: color("--series-loan"),
        backgroundColor: color("--series-loan"),
        borderDash: [6, 4],
      },
    ],
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

function describePayoff(month: number | null): string {
  if (month === null) return "Not within horizon";
  const ym = toYearMonth(month);
  return `Year ${ym.year}, month ${ym.month}`;
}

function describeElapsed(month: number | null): string {
  if (month === null) return "";
  const { years, months } = elapsedTime(month);
  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  return `after ${parts.join(" ")}`;
}

function renderCards(res: SimResult) {
  const last = res.rows[res.rows.length - 1];
  const diff = last.netB - last.netA;
  const winner = Math.abs(diff) < 1 ? "Tie" : diff > 0 ? "Path B wins" : "Path A wins";
  cardsEl.innerHTML = `
    <div class="card"><span>Path A final net wealth</span><strong class="a">${fmtMoney(last.netA)}</strong></div>
    <div class="card"><span>Path B final net wealth</span><strong class="b">${fmtMoney(last.netB)}</strong></div>
    <div class="card"><span>${winner} by</span><strong>${fmtMoney(Math.abs(diff))}</strong></div>
    <div class="card">
      <span>Path B mortgage-free</span><strong>${describePayoff(res.payoffMonthB)}</strong>
      <small>${describeElapsed(res.payoffMonthB)}</small>
      <small>Path A: ${describePayoff(res.payoffMonthA)}</small>
    </div>`;
}

function renderTable(res: SimResult) {
  const payoffYear = res.payoffMonthB === null ? null : toYearMonth(res.payoffMonthB).year;
  const yearly = res.rows.filter((r) => r.month > 0 && r.month % 12 === 0);
  tbodyEl.replaceChildren(
    ...yearly.map((r) => {
      const year = r.month / 12;
      const tr = document.createElement("tr");
      if (year === payoffYear) tr.className = "payoff";
      const investedB = res.rows.slice(r.month - 11, r.month + 1).reduce((sum, row) => sum + row.contribB, 0);
      const cells = [String(year), r.extra, r.netA, r.netB, r.netB - r.netA, r.loanA, r.loanB, investedB, r.invA, r.invB];
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

  warningEl.hidden = !installmentTooLow(inputs);
  warningEl.textContent =
    "The monthly installment doesn't cover the first month's interest, so the Path A loan never shrinks. Raise the installment or lower the loan amount or interest rate.";

  payoffMonthB = res.payoffMonthB;
  chart.options.scales!.x!.max = inputs.years;
  chart.data.datasets[0].data = res.rows.map((r) => ({ x: r.month / 12, y: r.netA }));
  chart.data.datasets[1].data = res.rows.map((r) => ({ x: r.month / 12, y: r.netB }));
  chart.data.datasets[2].data = res.rows.map((r) => ({ x: r.month / 12, y: r.loanB }));
  chart.update();

  renderCards(res);
  renderTable(res);
}

update();
