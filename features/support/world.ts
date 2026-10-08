import { setWorldConstructor, World, type IWorldOptions } from "@cucumber/cucumber";
import { simulate, type SimInputs, type SimResult } from "../../src/calc";
import { defaultInputs } from "../../src/params";

/** State shared by the steps of one scenario. */
export class SimWorld extends World {
  inputs: SimInputs = defaultInputs();
  private cached: SimResult | null = null;

  constructor(options: IWorldOptions) {
    super(options);
  }

  setInputs(inputs: SimInputs) {
    this.inputs = inputs;
    this.cached = null;
  }

  update(changes: Partial<SimInputs>) {
    this.setInputs({ ...this.inputs, ...changes });
  }

  run() {
    this.cached = simulate(this.inputs);
  }

  /** Simulation result for the current inputs (runs the simulation if needed). */
  get result(): SimResult {
    return (this.cached ??= simulate(this.inputs));
  }
}

setWorldConstructor(SimWorld);
