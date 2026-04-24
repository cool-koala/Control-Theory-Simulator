# Control Theory Simulator

这是一个面向控制理论学习、演示和实验的在线仿真项目。  
项目把原来单文件的 HTML 原型重构成了 `Vite + React` 静态站点，目的是让它可以：

- 在 GitHub Pages 上公开访问
- 作为一个长期维护的开源项目继续迭代
- 让开发者在本地更容易修改、测试和发布

如果你只是控制理论读者、学生或者演示使用者，你**不需要**会 Git、也不需要提 PR。你只需要打开网页、切换控制器、调参数、看响应曲线就够了。  
如果你是开发者，后面也提供了完整的本地开发、提交、发布和维护流程，但这些内容都集中在本 README，不再要求你跳到别的 markdown 文件里找。

## 这个项目现在能做什么

- 内置 99 个控制器原型
- 模拟质量-弹簧-阻尼系统
- 支持目标阶跃、正弦跟踪、方波跳变
- 支持执行器饱和、死区、时延、摩擦、噪声等非理想因素
- 提供动画视图和时间序列波形图
- 支持中英文界面切换
- 已接入 GitHub Actions 和 GitHub Pages 自动部署

## 普通读者怎么用

如果你只是想学习和体验控制器效果，推荐按下面方式使用：

1. 打开线上页面
2. 在顶部下拉框里选择控制器
3. 点击“启动演算”
4. 观察中间动画和下面的波形图
5. 在左侧调整控制器参数
6. 在右侧调整目标轨迹、噪声、摩擦、死区、延时等环境条件
7. 用右侧顶部的语言切换按钮在中文和英文之间切换

你重点可以观察这些内容：

- 跟踪速度是否够快
- 是否出现超调
- 是否有稳态误差
- 控制力是否很大
- 加入噪声或延迟后是否还能稳定

## 页面结构说明

页面大致分成三块：

### 1. 顶部操作区

- 控制器选择下拉框
- 启动 / 暂停
- 突发扰动
- 重置状态

### 2. 左侧控制器说明区

- 当前控制器简介
- 控制方程
- 调参指引
- 当前控制器参数滑块

### 3. 中间仿真与波形区

- 质量块和弹簧动画
- 位置曲线
- 控制输出曲线

### 4. 右侧环境与对象区

- 语言切换
- 目标轨迹与外部环境
- 硬件非理想限制
- 被控对象物理参数

## 本地运行

如果你想在自己电脑上运行项目：

```bash
npm install
npm run dev
```

启动后打开浏览器访问本地开发地址，通常是：

```text
http://127.0.0.1:4173/
```

## 本地构建

如果你只是想确认项目能正常打包：

```bash
npm run build
```

构建后的静态文件会输出到：

```text
dist/
```

## 本地测试

```bash
npm run test
```

目前已经覆盖的测试主要是：

- 目标信号生成
- 执行器死区和时延辅助逻辑
- 输入整形在高阻尼条件下的保护逻辑
- 控制器注册表和默认参数合法性

## 项目目录说明

```text
src/
  components/
    ControlSimulator.jsx     主界面、仿真调度、Canvas 绘制
  i18n/
    uiText.js                中英文界面文案
  simulator/
    controllerConfigs.js     控制器注册表与参数定义
    math.js                  数学工具函数
    runtime.js               目标生成、执行器辅助逻辑、界面运行时工具
  App.jsx
  main.jsx
  styles.css

tests/
  runtime.test.js
  controllerConfigs.test.js

legacy/
  控制理论模拟器V2.html       原始单文件版本归档
  original-script.js
  original-styles.css

.github/
  workflows/
    ci.yml
    pages.yml
```

## 架构说明

当前项目的架构思路是：

- UI 和仿真主流程集中在 `src/components/ControlSimulator.jsx`
- 控制器定义集中在 `src/simulator/controllerConfigs.js`
- 复用的数学逻辑集中在 `src/simulator/math.js`
- 目标信号、语言辅助、执行器延迟/死区等通用运行时逻辑集中在 `src/simulator/runtime.js`

当前还有一个明确的工程取舍：

- 控制器实现仍然主要集中在一个大的 `switch` 分支里
- 这不是最优雅的最终形态
- 但它能保证第一阶段重构时行为不被拆散，便于先稳定功能、再继续模块化

也就是说，这个仓库现在更偏向“先可运行、可验证、可部署”，然后再逐步把控制器实现进一步拆分。

## 如果你要新增控制器

这个部分是给开发者看的，不是给普通读者看的。

新增一个控制器时，基本流程是：

1. 在 `src/simulator/controllerConfigs.js` 里注册控制器
2. 提供完整元数据：
   - `category`
   - `name`
   - `desc`
   - `eq`
   - `tuning`
   - `params`
3. 每个参数都必须是 `[default, min, max, step]`
4. 在 `src/components/ControlSimulator.jsx` 里补上控制律实现
5. 如果涉及辅助参考轨迹或特殊运行时行为，按需修改 `src/simulator/runtime.js`
6. 如果新增的是通用逻辑，优先抽到 `runtime.js` 或 `math.js`
7. 最后补测试，至少保证核心纯函数可验证

新增控制器时建议遵守这些约束：

- 控制器 ID 要稳定，不要频繁改名
- 同样输入下，纯逻辑尽量保持确定性
- 不要偷偷依赖写死的初始物理参数
- 如果控制器需要辅助参考轨迹，应明确通过 `alg.ref_display` 或 `alg.xm` 暴露给图表层

## GitHub 提交与发布流程

这个部分是目前最重要的维护流程，下面用中文完整写清楚。

### 一、第一次把项目推到 GitHub

如果本地已经有完整代码，而 GitHub 上已经建好了空仓库，可以这样做：

```bash
git add .
git commit -m "Initial open-source release"
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

### 二、后续日常修改

每次你本地改完代码后，建议按这个顺序执行：

```bash
npm run test
npm run build
git status
git add .
git commit -m "写清楚这次改了什么"
git push
```

这个顺序的意义是：

1. 先保证测试通过
2. 再保证构建通过
3. 再提交到 Git
4. 最后推到 GitHub

这样可以尽量避免把明显坏掉的版本推上去。

### 三、GitHub Actions 会自动做什么

仓库里已经配置好了两个工作流：

#### `CI`

作用：

- 安装依赖
- 运行测试
- 执行生产构建

只要你 push 到 `main`，或者开 PR，都会自动触发。

#### `Deploy Pages`

作用：

- 构建生产版本
- 上传 `dist/`
- 自动部署到 GitHub Pages

### 四、怎么确认部署成功

1. 打开 GitHub 仓库的 `Actions`
2. 查看 `CI` 是否是绿色对勾
3. 查看 `Deploy Pages` 是否是绿色对勾
4. 打开仓库 `Settings -> Pages`
5. 如果成功，会看到类似 `Your site is live at ...`

如果仓库地址是：

```text
https://github.com/cool-koala/Control-Theory-Simulator
```

那么页面地址通常会是：

```text
https://cool-koala.github.io/Control-Theory-Simulator/
```

### 五、如果 GitHub Actions 报错，优先查什么

最常见的排查顺序：

1. 看 `Actions -> CI`
2. 看是 `npm ci` 失败、测试失败，还是构建失败
3. 如果 `CI` 绿了，再看 `Deploy Pages`
4. 如果 `Deploy Pages` 绿了但网页还是 404，通常是 Pages 配置或 `base` 路径有问题

### 六、Pages 仓库名和 `base` 路径

这个项目已经按真实仓库名配置了：

```js
/Control-Theory-Simulator/
```

如果你以后改了仓库名，要同步改 `vite.config.js` 里的 `repositoryBase`，否则静态资源路径会错，页面可能白屏或 404。

## 关于 PR、Issue 和读者角色

这部分我专门写清楚，避免误导。

### 如果你是普通读者

你不需要：

- 提 PR
- 看源码
- 配 Node
- 跑构建

你只需要打开网页使用即可。

### 如果你是开发者或维护者

你可以：

- 提 issue 反馈 bug
- 修改界面
- 新增控制器
- 优化仿真逻辑
- 修复部署问题

### 当前建议的协作方式

虽然仓库支持 PR，但这个项目的真实受众主要是控制理论读者，而不是开源协作型开发者，所以我们不把“欢迎大家提 PR”当成 README 的核心信息。

更现实的使用方式是：

- 读者使用网页
- 维护者直接在仓库里持续迭代
- 真正需要改代码的人再走 Git 提交和合并流程

## 行为规范

这个项目希望讨论方式保持：

- 尊重
- 具体
- 聚焦问题
- 不做人身攻击

不接受的行为包括：

- 骚扰
- 歧视
- 恶意挑衅
- 泄露他人隐私
- 侮辱性语言

维护者有权删除不合适内容、关闭讨论、限制恶意用户参与。

## 安全问题处理

如果你发现的是普通 bug，可以直接提 issue。  
如果你发现的是可能影响用户、依赖链或者部署流程的安全问题，建议不要第一时间公开贴出完整利用方式，而是先私下联系维护者，并提供：

- 复现步骤
- 影响范围
- 风险说明
- 可能的修复建议

虽然这是一个纯前端静态项目，但依赖安全和工作流安全依然很重要。

## 当前维护约定

如果以后继续扩展这个项目，建议坚持这些基本规则：

- 大改动先想清楚目标，不要把重构和功能改动混在一起
- Bug 修复尽量单独提交
- 新增控制器必须带完整参数定义
- 更新依赖后要同步提交 `package-lock.json`
- 提交前至少执行一次 `npm run test` 和 `npm run build`

## 许可证

本项目使用 MIT License。
