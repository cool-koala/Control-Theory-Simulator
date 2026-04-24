# Architecture

## Overview

- `src/components/ControlSimulator.jsx`
  - main UI, animation loop, canvas drawing, state orchestration
- `src/simulator/controllerConfigs.js`
  - controller catalog and parameter schema defaults
- `src/simulator/math.js`
  - math helpers used by multiple controllers
- `src/simulator/runtime.js`
  - target generation, actuator helpers, reference visibility, chart-state helpers

## Current Tradeoff

The simulator logic has been extracted from the original monolithic HTML file, but the main control-law switch is still centralized. This is intentional for the first refactor pass so behavior stays stable while the project becomes buildable, testable, and open-source friendly.
