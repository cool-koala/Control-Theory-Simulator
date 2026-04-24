export const REFERENCE_METHODS = new Set([
  'MRAC',
  'L1',
  'InputShaping',
  'PPC',
  'Posicast',
  'TimeVary-BLF',
  'Lorenz-Coupled'
]);

export function getTargetSignal(targetMode, baseTarget, time) {
  if (targetMode === 'sine') {
    return 5.0 + 4.0 * Math.sin(1.0 * time);
  }

  if (targetMode === 'square') {
    const phase = Math.sign(Math.sin(0.5 * time));
    return 5.0 + 3.0 * (phase === 0 ? 1 : phase);
  }

  return baseTarget;
}

export function shouldShowReference(method) {
  return REFERENCE_METHODS.has(method);
}

export function getReferenceValue(alg) {
  return alg.ref_display ?? alg.xm ?? null;
}

export function hasSettled(x, v, target, tolerance = 0.05, velocityTolerance = 0.05) {
  return Math.abs(x - target) < tolerance && Math.abs(v) < velocityTolerance;
}

export function getDelayedCommand(buffer, plantDelay) {
  return buffer[Math.min(buffer.length - 1, Math.floor(plantDelay))] || 0;
}

export function applyActuatorDeadzone(command, actuatorDeadzone) {
  if (Math.abs(command) < actuatorDeadzone) {
    return 0;
  }

  return command > 0 ? command - actuatorDeadzone : command + actuatorDeadzone;
}

export function getInputShapingCoefficients(mass, damping, stiffness) {
  if (mass <= 0 || stiffness <= 0) {
    return { A1: 1, A2: 0, delay: 0 };
  }

  const wn = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  if (!Number.isFinite(wn) || !Number.isFinite(zeta) || zeta >= 1) {
    return { A1: 1, A2: 0, delay: 0 };
  }

  const wd = wn * Math.sqrt(1 - zeta * zeta);
  const K = Math.exp((-zeta * Math.PI) / Math.sqrt(1 - zeta * zeta));

  return {
    A1: 1 / (1 + K),
    A2: K / (1 + K),
    delay: Math.PI / wd
  };
}
