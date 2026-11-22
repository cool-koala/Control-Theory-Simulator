import { CONTROLLER_CONFIGS, DT, getDefaultParams } from './controllerConfigs.js';
import { createExperiment, stepExperiment } from './experiment.js';

export function score(channel, env) {
  const run = createExperiment(env, 1);
  const state = run.channels[0];
  let cost = 0;
  let previousForce = 0;
  let error = 0;
  for (let i = 0; i < 200; i++) {
    const target = stepExperiment(run, [channel], env, false);
    error = target - state.x;
    cost +=
      DT *
      ((1 + 2.8 * i * DT) * Math.abs(error) +
        3.5 * error ** 2 +
        0.0005 * state.u ** 2 +
        0.0018 * (state.u - previousForce) ** 2 +
        65 * state.theta ** 2 +
        8 * state.omega ** 2);
    previousForce = state.u;
  }
  return cost + 45 * error ** 2 + 0.45 * state.overshoot ** 2 + (state.hitLimit ? 500 : 0);
}

export function tune(channel, env) {
  const schema = CONTROLLER_CONFIGS[channel.id].params;
  let params = { ...channel.params };
  const initial = score(channel, env);
  let best = initial;
  function consider(candidate) {
    const cost = score({ id: channel.id, params: candidate }, env);
    if (cost < best) {
      best = cost;
      params = candidate;
    }
  }
  consider(getDefaultParams(channel.id));
  for (const fraction of [0.25, 0.08, 0.02]) {
    for (const [key, [, min, max, step]] of Object.entries(schema)) {
      const center = params[key];
      for (const sign of [-1, 1]) {
        const value = center + sign * Math.max(step, fraction * (max - min));
        const snapped = min + step * Math.round((value - min) / step);
        consider({ ...params, [key]: Number(Math.min(max, Math.max(min, snapped)).toFixed(6)) });
      }
    }
  }
  return { params, improvement: initial ? (100 * (initial - best)) / initial : 0 };
}
