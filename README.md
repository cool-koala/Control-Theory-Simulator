# Control Theory Simulator

一个面向教学、演示和社区实验的控制器仿真项目。当前版本将原始单文件 HTML 原型重构为 `Vite + React` 静态站点，便于在 GitHub Pages 上公开访问、被 fork，并通过 PR 持续扩展新的控制器、案例和文档。

An open simulator for control-theory demos, learning, and community experimentation. The current version refactors the original single-file HTML prototype into a `Vite + React` static site so it can be deployed on GitHub Pages, forked easily, and extended through pull requests.

## Features

- 99 个控制器原型与统一参数面板
- 质量-弹簧-阻尼系统仿真
- 执行器饱和、死区、时延、摩擦、噪声等非理想因素
- Canvas 动画与时间序列图
- 可扩展的控制器配置注册表
- GitHub Pages、CI、基础单元测试与开源协作模板

## Local Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

## Project Structure

```text
src/
  components/        UI and canvas rendering
  simulator/         controller registry and simulation helpers
tests/               unit tests
docs/                contributor-facing docs
legacy/              archived original prototype snapshot
.github/             workflows and community templates
```

## Deploying To GitHub Pages

1. Push this project to a GitHub repository.
2. In repository settings, enable GitHub Pages and choose “GitHub Actions” as the source.
3. The provided workflow builds and publishes the site automatically on pushes to `main`.
4. If your repository name changes, update the `base` path in `vite.config.js`.

## Adding A Controller

1. Add the controller metadata and parameter schema in `src/simulator/controllerConfigs.js`.
2. Add the implementation branch in `src/components/ControlSimulator.jsx`.
3. If the controller introduces derived reference trajectories, update `src/simulator/runtime.js` if needed.
4. Add or update tests.

More detail: `docs/adding-controller.md`

## Contribution

欢迎 fork、开 issue、提 PR。提交代码前请先阅读：

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`

Forks, issues, and pull requests are welcome. Please read the contribution and security docs before submitting major changes.
