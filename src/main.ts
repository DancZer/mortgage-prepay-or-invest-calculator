import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { projectInvestment, type InvestmentInputs, type YearRow } from "./calc";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface SliderDef {
  key: keyof InvestmentInputs;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (v: number) => string;
}

const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtMoney = (v: number) => money.format(v);

const sliders: SliderDef[] = [
  { key: "initial", label: "Initial amount", min: 0, max: 100_000, step: 500, value: 10_000, format: fmtMoney },
  { key: "monthlyContribution", label: "Monthly contribution", min: 0, max: 5_000, step: 50, value: 500, format: fmtMoney },
  { key: "annualReturnPct", label: "Annual return", min: 0, max: 15, step: 0.1, value: 7, format: (v) => `${v.toFixed(1)} %` },
  { key: "years", label: "Years", min: 1, max: 40, step: 1, value: 20, format: (v) => `${v}` },
];

const inputs = Object.fromEntries(sliders.map((s) => [s.key, s.value])) as unknown as InvestmentInputs;

const controlsEl = document.querySelector<HTMLElement>("#controls")!;
const summaryEl = document.querySelector<HTMLElement>("#summary")!;
const tbodyEl = document.querySelector<HTMLTableSectionElement>("#table tbody")!;
const canvasEl = document.querySelector<HTMLCanvasElement>("#chart")!;

for (const s of sliders) {
  const row = document.createElement("label");
  row.className = "slider";
  row.innerHTML = `
    <span class="slider-label">${s.label}</span>
    <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" />
    <output>${s.format(s.value)}</output>`;
  const input = row.querySelector("input")!;
  const output = row.querySelector("output")!;
  input.addEventListener("input", () => {
    const v = Number(input.value);
    inputs[s.key] = v;
    output.textContent = s.format(v);
    update();
  });
  controlsEl.append(row);
}

const css = getComputedStyle(document.documentElement);
const chart = new Chart<"bar", number[], number>(canvasEl, {
  type: "bar",
  data: {
    labels: [],
    datasets: [
      { label: "Contributions", data: [], backgroundColor: css.getPropertyValue("--series-1").trim() },
      { label: "Growth", data: [], backgroundColor: css.getPropertyValue("--series-2").trim() },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: { stacked: true, title: { display: true, text: "Year" } },
      y: { stacked: true, ticks: { callback: (v) => fmtMoney(Number(v)) } },
    },
    plugins: {
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${fmtMoney(ctx.parsed.y ?? 0)}` } },
    },
  },
});

function renderTable(rows: YearRow[]) {
  tbodyEl.replaceChildren(
    ...rows.map((r) => {
      const tr = document.createElement("tr");
      for (const text of [String(r.year), fmtMoney(r.contributions), fmtMoney(r.growth), fmtMoney(r.balance)]) {
        const td = document.createElement("td");
        td.textContent = text;
        tr.append(td);
      }
      return tr;
    }),
  );
}

function renderSummary(last: YearRow) {
  summaryEl.innerHTML = `
    <div><span>Final balance</span><strong>${fmtMoney(last.balance)}</strong></div>
    <div><span>Total contributed</span><strong>${fmtMoney(last.contributions)}</strong></div>
    <div><span>Total growth</span><strong>${fmtMoney(last.growth)}</strong></div>`;
}

function update() {
  const rows = projectInvestment(inputs);
  chart.data.labels = rows.map((r) => r.year);
  chart.data.datasets[0].data = rows.map((r) => r.contributions);
  chart.data.datasets[1].data = rows.map((r) => r.growth);
  chart.update();
  renderTable(rows);
  renderSummary(rows[rows.length - 1]);
}

update();
