import { describe, expect, it } from 'vitest';
import {
  CONTROLLER_CONFIGS,
  getDefaultParams,
  validateControllerConfigs
} from '../src/simulator/controllerConfigs.js';

describe('controller config registry', () => {
  it('validates the full controller catalog', () => {
    expect(validateControllerConfigs()).toBe(true);
  });

  it('derives default params from the schema definition', () => {
    const defaults = getDefaultParams('PID');

    expect(defaults).toEqual({
      kp: CONTROLLER_CONFIGS.PID.params.kp[0],
      ki: CONTROLLER_CONFIGS.PID.params.ki[0],
      kd: CONTROLLER_CONFIGS.PID.params.kd[0]
    });
  });

  it('keeps every controller id unique and addressable', () => {
    const ids = Object.keys(CONTROLLER_CONFIGS);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(50);
  });
});
