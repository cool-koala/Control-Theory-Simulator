import { describe, it, expect } from 'vitest';
import { CONTROLLER_CONFIGS, DT, getDefaultParams } from '../src/simulator/controllerConfigs.js';
import { PAPER_CITATIONS, PRESET_COMPARISONS } from '../src/simulator/sources.js';
import {
  advancePlant,
  createExperiment,
  DEFAULT_ENV,
  LIMIT,
  stepExperiment,
} from '../src/simulator/experiment.js';
import { score, tune } from '../src/simulator/tuning.js';

const channel = (id) => ({ id, params: getDefaultParams(id) });
describe('controller experiments', () => {
  it('exercises the complete catalog and all preset references', () => {
    const ids = Object.keys(CONTROLLER_CONFIGS);
    expect(ids).toHaveLength(159);
    expect(new Set(ids.map((id) => CONTROLLER_CONFIGS[id].category)).size).toBe(12);
    expect(PRESET_COMPARISONS).toHaveLength(10);
    for (const { a, b } of PRESET_COMPARISONS)
      expect(ids.includes(a) && ids.includes(b)).toBe(true);
    for (const id of ids) {
      expect(PAPER_CITATIONS[id]?.url, id).toMatch(/^https?:\/\//);
      for (const plant of ['slider', 'pendulum']) {
        const env = { ...DEFAULT_ENV, plant };
        const run = createExperiment(env, 1);
        const selection = [channel(id)];
        for (let t = 0; t < 200; t++) stepExperiment(run, selection, env, false);
        const { x, v, theta, energy } = run.channels[0];
        expect([x, v, theta, energy].every(Number.isFinite), id).toBe(true);
      }
    }
  });
  it.each(['PID', 'Particle-Filter'])(
    'gives identical noisy trials to identical %s controllers',
    (id) => {
      const env = { ...DEFAULT_ENV, noise: 0.1, delay: 2 };
      const run = createExperiment(env, 2);
      const channels = [channel(id), channel(id)];
      run.impulse = 100;
      for (let t = 0; t < 100; t++) stepExperiment(run, channels, env);
      for (const point of run.history) expect(point.channels[0]).toEqual(point.channels[1]);
    },
  );
  it('lets an unforced tilted pendulum fall to the mechanical limit', () => {
    const env = { ...DEFAULT_ENV, plant: 'pendulum', target: 0, initialAngle: 2 };
    const state = createExperiment(env, 1).channels[0];
    const angle = state.theta;
    advancePlant(state, env, 0);
    expect(state.theta).toBeGreaterThan(angle);
    for (let i = 0; i < 200; i++) advancePlant(state, env, 0);
    expect(state.hitLimit).toBe(true);
    expect(Math.abs(state.theta)).toBeLessThanOrEqual(LIMIT);
  });
  it('integrates the force delivered after delay and deadzone', () => {
    const env = { ...DEFAULT_ENV, delay: 1, saturation: 10, deadzone: 3 };
    const run = createExperiment(env, 1);
    for (let i = 0; i < 2; i++) stepExperiment(run, [channel('P')], env);
    expect(run.history.map((p) => p.channels[0].u)).toEqual([0, 7]);
    expect(run.channels[0].energy).toBeCloseTo(49 * DT);
  });
  it('bypasses delayed shaping for an overdamped slider', () => {
    const env = { ...DEFAULT_ENV, c: 5, m: 1, k: 1 };
    const run = createExperiment(env, 1);
    stepExperiment(run, [channel('InputShaping')], env);
    expect(run.channels[0].ref).toBe(env.target);
  });
  it('uses the previous square-wave value during the Posicast delay', () => {
    const env = { ...DEFAULT_ENV, wave: 'square' };
    const run = createExperiment(env, 1);
    const control = channel('Posicast');
    let target;
    do {
      target = stepExperiment(run, [control], env);
    } while (target === 8 && run.tick < 400);
    expect(target).toBe(2);
    expect(run.channels[0].ref).toBeCloseTo(2 + 6 * control.params.k_pos);
  });
  it('tunes reproducibly against the same baseline', () => {
    const env = { ...DEFAULT_ENV, noise: 0.1 };
    const start = channel('PID');
    const result = tune(start, env);
    expect(score({ id: 'PID', params: result.params }, env)).toBeLessThanOrEqual(score(start, env));
    expect(result.improvement).toBeGreaterThanOrEqual(0);
  });
});
