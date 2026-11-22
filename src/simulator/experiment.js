import { DT, INITIAL_PARAMS } from './controllerConfigs.js';
import { calculateControlOutput, createFreshAlgState } from './controlLaws.js';
import { gaussNoise } from './math.js';
import {
  applyActuatorDeadzone,
  getDelayedCommand,
  getTargetSignal,
  shouldShowReference,
  getReferenceValue,
} from './runtime.js';

export const DEFAULT_ENV = {
  ...INITIAL_PARAMS,
  plant: 'slider',
  wave: 'step',
  initialX: 0,
  initialAngle: 12,
  wind: 0,
  saturation: 200,
  deadzone: 0,
  delay: 0,
  friction: 0,
  noise: 0,
};
export const LIMIT = Math.PI / 3;

function stream(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return (seed + 0.5) / 4294967296;
  };
}

export function createChannel(env) {
  return {
    x: env.initialX,
    v: 0,
    theta: env.plant === 'pendulum' ? (env.initialAngle * Math.PI) / 180 : 0,
    omega: 0,
    tick: 0,
    u: 0,
    hitLimit: false,
    energy: 0,
    squaredError: 0,
    overshoot: 0,
    ref: null,
    alg: createFreshAlgState(env.target, env.initialX),
    random: stream(37303),
  };
}

export function createExperiment(env, count) {
  return {
    channels: Array.from({ length: count }, () => createChannel(env)),
    tick: 0,
    impulse: 0,
    random: stream(18443),
    history: [],
  };
}

// Cart coordinate points right. Angle is measured clockwise from upright.
// Both plants are driven by the same horizontal actuator and external force.
export function advancePlant(state, env, appliedForce) {
  const subDt = DT / 4;
  for (let i = 0; i < 4; i++) {
    const drive = appliedForce - env.k * state.x - env.c * state.v;
    let net = drive - env.friction * Math.sign(state.v);
    if (Math.abs(state.v) < 0.005)
      net = Math.sign(drive) * Math.max(0, Math.abs(drive) - env.friction);
    let acceleration = net / env.m;
    if (env.plant === 'pendulum') {
      const bob = 0.2 * env.m;
      const sin = Math.sin(state.theta);
      const cos = Math.cos(state.theta);
      acceleration =
        (net + bob * sin * (env.l * state.omega ** 2 - 9.81 * cos)) / (env.m + bob * sin ** 2);
      const angularAcceleration = (9.81 * sin - acceleration * cos) / env.l;
      if (
        Math.abs(state.theta) >= LIMIT &&
        state.omega === 0 &&
        state.theta * angularAcceleration >= 0
      ) {
        acceleration = net / (env.m + bob);
      } else {
        state.omega += angularAcceleration * subDt;
        state.theta += state.omega * subDt;
        if (Math.abs(state.theta) >= LIMIT) {
          state.theta = Math.sign(state.theta) * LIMIT;
          // The angular stop transfers the bob's horizontal momentum to the cart.
          state.v += (bob * env.l * Math.cos(state.theta) * state.omega) / (env.m + bob);
          state.omega = 0;
          state.hitLimit = true;
        }
      }
    }
    state.v += acceleration * subDt;
    state.x += state.v * subDt;
  }
}

export function stepChannel(state, channel, env, target, disturbance, nx, nv) {
  const { id, params } = channel;
  const command = calculateControlOutput(
    DT,
    state.x + nx,
    state.v + nv,
    target,
    env,
    params,
    state.alg,
    id,
    state.tick * DT,
    env.saturation,
    state.random,
  );
  const buffer = state.alg.u_hw_buffer;
  buffer.unshift(command);
  buffer.pop();
  state.u = applyActuatorDeadzone(getDelayedCommand(buffer, env.delay), env.deadzone);
  advancePlant(state, env, state.u + disturbance);
  state.ref = shouldShowReference(id) ? getReferenceValue(state.alg) : state.alg.ref_display;
  const error = target - state.x;
  state.squaredError += error ** 2;
  state.energy += state.u ** 2 * DT;
  state.tick++;
  const amplitude = target - env.initialX;
  if (env.wave === 'step' && amplitude !== 0) {
    state.overshoot = Math.max(state.overshoot, (-100 * error) / amplitude);
  }
}

export function snapshot(state) {
  const { x, v, u, theta, ref, energy, overshoot, hitLimit } = state;
  return {
    x,
    v,
    u,
    theta,
    ref,
    energy,
    overshoot,
    hitLimit,
    rmse: state.tick ? Math.sqrt(state.squaredError / state.tick) : 0,
  };
}

export function stepExperiment(run, channels, env, record = true) {
  const target = getTargetSignal(env.wave, env.target, run.tick * DT);
  const nx = env.noise ? env.noise * gaussNoise(run.random) : 0;
  const nv = env.noise ? 2 * env.noise * gaussNoise(run.random) : 0;
  const force = env.wind + run.impulse;
  run.impulse = run.impulse < 1 ? 0 : run.impulse * 0.8;
  channels.forEach((channel, i) =>
    stepChannel(run.channels[i], channel, env, target, force, nx, nv),
  );
  run.tick++;
  if (record) {
    run.history.push({ time: run.tick * DT, target, channels: run.channels.map(snapshot) });
    if (run.history.length > 750) run.history.shift();
  }
  return target;
}
