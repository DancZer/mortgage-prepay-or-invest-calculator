import { setWorldConstructor, World, type IWorldOptions } from "@cucumber/cucumber";
import type { SimResult } from "../../src/calc";
import { defaultInputs } from "../../src/params";
import { breakEvenReturn, runScenarios, type AppInputs, type BreakEven, type Scenarios } from "../../src/scenarios";
import type { KeyValueStore } from "../../src/storage";

/** In-memory stand-in for the browser's localStorage. */
export class MemoryStore implements KeyValueStore {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

/** State shared by the steps of one scenario. */
export class SimWorld extends World {
  inputs: AppInputs = defaultInputs();
  store = new MemoryStore();
  private cached: Scenarios | null = null;

  constructor(options: IWorldOptions) {
    super(options);
  }

  setInputs(inputs: AppInputs) {
    this.inputs = inputs;
    this.cached = null;
  }

  update(changes: Partial<AppInputs>) {
    this.setInputs({ ...this.inputs, ...changes });
  }

  run() {
    this.cached = runScenarios(this.inputs);
  }

  /** Both scenarios for the current inputs (runs the simulation if needed). */
  get scenarios(): Scenarios {
    return (this.cached ??= runScenarios(this.inputs));
  }

  /** Worst-case result; when worst and best returns are equal it is also the best case. */
  get result(): SimResult {
    return this.scenarios.worst;
  }

  get breakEven(): BreakEven {
    return breakEvenReturn(this.inputs);
  }
}

setWorldConstructor(SimWorld);
