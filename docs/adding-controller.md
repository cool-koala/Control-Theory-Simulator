# Adding A Controller

## Workflow

1. Register the controller in `src/simulator/controllerConfigs.js`.
2. Add the control law branch in `src/components/ControlSimulator.jsx`.
3. Reuse helper functions from `src/simulator/runtime.js` when the behavior is shared.
4. Add tests for any new pure helper logic.

## Registry Rules

- Use a stable controller id.
- Provide `category`, `name`, `desc`, `eq`, `tuning`, and `params`.
- Each parameter schema must be `[default, min, max, step]`.

## Implementation Notes

- Keep the control branch deterministic for the same inputs.
- If the controller depends on an auxiliary reference trajectory, expose that through `alg.ref_display` or `alg.xm`.
- Respect current physical parameters instead of hard-coded initial constants.
