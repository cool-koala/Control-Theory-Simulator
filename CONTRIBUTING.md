# Contributing

## Before You Start

- Discuss large UI or architecture changes in an issue first.
- Keep pull requests small enough to review.
- Do not bundle unrelated refactors with bug fixes.

## Development Checklist

1. Install dependencies with `npm install`.
2. Run `npm run test`.
3. Run `npm run build`.
4. Describe the behavior change and validation steps in your PR.

## Controller Contributions

- Every new controller must include:
  - metadata in the controller registry
  - parameter schema with default/min/max/step
  - implementation branch in the simulator logic
  - at least one test or a concrete manual validation note
- If the controller adds a derived reference trajectory, document it clearly.

## Documentation

- Keep user-facing docs bilingual when practical.
- Prefer concise explanations and reproducible examples.

## Pull Request Expectations

- Explain what changed and why.
- Include screenshots or recordings for UI changes when possible.
- Mention any known limitations openly.
