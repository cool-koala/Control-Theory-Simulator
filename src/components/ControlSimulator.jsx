import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  Box,
  CircleHelp,
  Cpu,
  GitCompareArrows,
  Languages,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import { PRESET_COMPARISONS } from '../simulator/sources.js';
import { DICTIONARY_DATA } from '../simulator/dictionaryData.js';
import { useExperiment } from '../simulator/useExperiment.js';
import { ControllerPanel, EnvironmentPanel } from './ExperimentPanels.jsx';
import { Observations } from './Observations.jsx';
import { Modal } from './Modal.jsx';
import { GitHubIcon } from './GitHubIcon.jsx';

const repository = 'https://github.com/cool-koala/Control-Theory-Simulator';

export default function ControlSimulator() {
  const [lang, setLang] = useState(() =>
    localStorage.getItem('controller-simulator-language') === 'en' ? 'en' : 'zh',
  );
  const tr = (zh, en) => (lang === 'zh' ? zh : en);
  const [modal, setModal] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [mobilePanel, setMobilePanel] = useState('');
  const lab = useExperiment();
  const { env, channels, compare, active, running, busy, result } = lab;
  const message =
    result === 'error'
      ? tr('调参失败，请重试', 'Tuning failed. Try again.')
      : result && tr('评分改善 · ', 'Cost reduction · ') + result;
  useEffect(() => {
    localStorage.setItem('controller-simulator-language', lang);
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title = lang === 'en' ? 'Control Theory Simulator' : '控制理论模拟器';
  }, [lang]);
  return (
    <div className="lab">
      <header className="mast">
        <div className="identity">
          <span className="brand-icon">
            <Activity size={23} />
          </span>
          <h1>{tr('控制理论模拟器', 'Control Theory Simulator')}</h1>
          <small>v3.0</small>
        </div>
        <nav>
          <button
            aria-label={tr('符号词典', 'Glossary')}
            title={tr('符号词典', 'Glossary')}
            onClick={() => setModal('glossary')}
          >
            <BookOpen />
            <span>{tr('符号词典', 'Glossary')}</span>
          </button>
          <button
            aria-label={tr('使用指南', 'Guide')}
            title={tr('使用指南', 'Guide')}
            onClick={() => setModal('guide')}
          >
            <CircleHelp />
            <span>{tr('使用指南', 'Guide')}</span>
          </button>
          <button
            title={tr('切换语言', 'Switch language')}
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          >
            <Languages />
            {tr('EN', '中文')}
          </button>
          <a
            href={repository}
            target="_blank"
            rel="noreferrer"
            title="GitHub"
            aria-label="GitHub"
            className="github"
          >
            <GitHubIcon size={16} />
          </a>
        </nav>
      </header>
      <div className="toolbar">
        <div className="tool-group">
          <Box size={17} />
          <select
            aria-label={tr('物理对象', 'Plant')}
            value={env.plant}
            onChange={(e) => lab.changeEnv('plant', e.target.value)}
          >
            <option value="slider">{tr('弹簧滑块', 'Spring–mass')}</option>
            <option value="pendulum">{tr('小车倒立摆', 'Cart–pole')}</option>
          </select>
        </div>
        <button
          className={'compare-toggle ' + (compare ? 'selected' : '')}
          aria-pressed={compare}
          onClick={lab.toggleCompare}
        >
          <GitCompareArrows />
          {tr('算法对比', 'Compare')}
        </button>
        {compare && (
          <select
            aria-label={tr('对比预设', 'Comparison preset')}
            value=""
            onChange={(e) => {
              if (e.target.value !== '') lab.preset(PRESET_COMPARISONS[Number(e.target.value)]);
            }}
          >
            <option value="">{tr('对比预设', 'Preset pairs')}</option>
            {PRESET_COMPARISONS.map((p, i) => (
              <option key={i} value={i}>
                {p.a} / {p.b}
              </option>
            ))}
          </select>
        )}
        <div className="run-actions">
          <button className="primary" onClick={() => lab.setRunning(!running)}>
            {running ? <Pause /> : <Play />}
            {running ? tr('暂停', 'Pause') : tr('运行', 'Run')}
          </button>
          <button onClick={lab.disturb}>
            <Zap />
            {tr('扰动', 'Impulse')}
          </button>
          <button onClick={() => lab.reset()}>
            <RotateCcw />
            {tr('重置', 'Reset')}
          </button>
        </div>
      </div>
      <div className="mobile-tools">
        {[
          ['control', Cpu, tr('控制器', 'Controller')],
          ['env', SlidersHorizontal, tr('实验环境', 'Environment')],
        ].map(([key, Icon, label]) => (
          <button
            key={key}
            aria-expanded={mobilePanel === key}
            onClick={() => setMobilePanel(mobilePanel === key ? '' : key)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>
      <main className={'workspace ' + (expanded ? 'expanded' : '')}>
        <aside className={'left panel ' + (mobilePanel === 'control' ? 'mobile-open' : '')}>
          <ControllerPanel
            channels={channels}
            active={active}
            setActive={lab.setActive}
            changeMethod={lab.changeMethod}
            changeGain={lab.changeGain}
            onTune={lab.tune}
            busy={busy}
            message={message}
            tr={tr}
          />
        </aside>
        <Observations
          lab={lab}
          tr={tr}
          expanded={expanded}
          togglePanels={() => setExpanded(!expanded)}
        />
        <aside className={'right panel ' + (mobilePanel === 'env' ? 'mobile-open' : '')}>
          <EnvironmentPanel env={env} change={lab.changeEnv} tr={tr} />
        </aside>
      </main>
      {modal && (
        <Modal
          title={modal === 'guide' ? tr('使用指南', 'Guide') : tr('符号词典', 'Glossary')}
          closeLabel={tr('关闭', 'Close')}
          onClose={() => setModal('')}
        >
          {modal === 'guide' ? (
            <div className="guide">
              <p>
                {tr(
                  '选择物理对象和控制器后，调节增益或施加扰动，观察响应曲线。位置和控制力按仿真时间绘制，相轨迹显示速度随位置的变化。',
                  'Select a plant and controller, adjust its gains or apply an impulse. The phase portrait plots velocity against position.',
                )}
              </p>
              <p>
                {tr(
                  '开启算法对比可在相同目标和噪声下运行两组参数。自动调参从同一初始状态评估四秒轨迹，并应用评分最低的候选参数。',
                  'Compare runs two controllers with identical targets and sensor noise. Tuning evaluates four-second trials from the same initial state and applies the lowest-cost candidate.',
                )}
              </p>
              <p>
                {tr(
                  '控制器测量小车的位置与速度，摆杆由小车运动和重力驱动。到达 ±60° 机械限位后，指标表会保留触限记录。',
                  'Controllers measure cart position and velocity. Cart motion and gravity drive the pole. Reaching either 60° stop is recorded for the trial.',
                )}
              </p>
            </div>
          ) : (
            DICTIONARY_DATA.map((group) => (
              <section className="gloss" key={group.category}>
                <h3>{group.category}</h3>
                <dl>
                  {group.items.map((item) => (
                    <div key={item.sym}>
                      <dt>{item.sym}</dt>
                      <dd>
                        <strong>{item.name}</strong>
                        <p>{item.desc}</p>
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))
          )}
        </Modal>
      )}
    </div>
  );
}
