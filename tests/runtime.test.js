import { describe, expect, it } from 'vitest';
import {
  applyActuatorDeadzone,
  getDelayedCommand,
  getInputShapingCoefficients,
  getReferenceValue,
  getTargetSignal,
  hasSettled,
  shouldShowReference
} from '../src/simulator/runtime.js';

describe('runtime helpers', () => {
  it('returns the base target for step mode', () => {
    expect(getTargetSignal('step', 7, 3)).toBe(7);
  });

  it('returns a deterministic waveform for square mode', () => {
    expect(getTargetSignal('square', 5, 0)).toBe(8);
  });

  it('returns safe input shaping coefficients for overdamped systems', () => {
    expect(getInputShapingCoefficients(2, 10, 1)).toEqual({
      A1: 1,
      A2: 0,
      delay: 0
    });
  });

  it('applies actuator deadzone symmetrically', () => {
    expect(applyActuatorDeadzone(5, 10)).toBe(0);
    expect(applyActuatorDeadzone(15, 10)).toBe(5);
    expect(applyActuatorDeadzone(-15, 10)).toBe(-5);
  });

  it('reads delayed commands from the hardware buffer', () => {
    expect(getDelayedCommand([30, 20, 10], 1)).toBe(20);
  });

  it('detects settled state only inside position and velocity tolerances', () => {
    expect(hasSettled(4.99, 0.01, 5)).toBe(true);
    expect(hasSettled(4.8, 0.01, 5)).toBe(false);
  });

  it('exposes the correct reference methods and values', () => {
    expect(shouldShowReference('InputShaping')).toBe(true);
    expect(shouldShowReference('PID')).toBe(false);
    expect(getReferenceValue({ ref_display: 2, xm: 1 })).toBe(2);
    expect(getReferenceValue({ xm: 1.5 })).toBe(1.5);
  });
});
