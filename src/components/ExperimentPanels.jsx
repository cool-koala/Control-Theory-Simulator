import { useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  Cpu,
  ExternalLink,
  Search,
  SlidersHorizontal,
  WandSparkles,
} from 'lucide-react';
import { CONTROLLER_CONFIGS } from '../simulator/controllerConfigs.js';
import { PAPER_CITATIONS } from '../simulator/sources.js';

const families = [
  'Industrial PID',
  'Frequency response & compensation',
  'State space & optimal control',
  'Robust control',
  'Model predictive control',
  'Sliding mode',
  'Disturbance rejection & observers',
  'Nonlinear & energy control',
  'Adaptive control & identification',
  'Data-driven & intelligent control',
  'Finite time & safety constraints',
  'Delay, networked & higher-order control',
];
const entries = Object.entries(CONTROLLER_CONFIGS);
const familyName = (c, tr) => tr(c.category.slice(4), families[Number(c.category.slice(0, 2)) - 1]);

export function Range({ label, value, bounds, unit = '', onChange }) {
  const [min, max, step] = bounds;
  return (
    <label className="range-field">
      <span>
        <span>{label}</span>
        <output>
          {Number(value.toFixed(3))} {unit}
        </output>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function ControllerPanel({
  channels,
  active,
  setActive,
  changeMethod,
  changeGain,
  onTune,
  busy,
  message,
  tr,
}) {
  const [search, setSearch] = useState('');
  const [browse, setBrowse] = useState(false);
  const { id, params } = channels[active];
  const config = CONTROLLER_CONFIGS[id];
  const paper = PAPER_CITATIONS[id];
  const matches = entries.filter(([key, c]) =>
    [key, c.name, c.category, familyName(c, tr)]
      .join(' ')
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  function select(key) {
    changeMethod(key);
    setBrowse(false);
    setSearch('');
  }
  return (
    <>
      <h2>
        <Cpu />
        {tr('控制器', 'Controller')}
      </h2>
      {channels.length > 1 && (
        <div className="seg wide">
          {channels.map((c, i) => (
            <button key={i} aria-pressed={active === i} onClick={() => setActive(i)}>
              {String.fromCharCode(65 + i)} · {c.id}
            </button>
          ))}
        </div>
      )}
      <div
        className="picker"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setBrowse(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setBrowse(false);
        }}
      >
        <button
          type="button"
          className="method-pick"
          aria-expanded={browse}
          onClick={() => setBrowse(!browse)}
        >
          <span>{id}</span>
          <ChevronDown size={17} />
        </button>
        {browse && (
          <div className="picker-list">
            <label className="search">
              <Search size={15} />
              <input
                autoFocus
                aria-label={tr('搜索算法', 'Search algorithms')}
                placeholder={tr('搜索算法或分类', 'Search by name or family')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="results">
              {matches.length === 0 && <p>{tr('没有匹配的算法', 'No matching algorithms')}</p>}
              {matches.map(([key, c], i) => (
                <div key={key}>
                  {c.category !== matches[i - 1]?.[1].category && (
                    <small>{familyName(c, tr)}</small>
                  )}
                  <button onClick={() => select(key)}>
                    {key}
                    {id === key && <Check size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="family">{familyName(config, tr)}</div>
      <div className="formula">
        <small>{tr('控制方程', 'Control law')}</small>
        <code>{config.eq}</code>
      </div>
      <h3>{tr('控制增益', 'Controller gains')}</h3>
      {Object.entries(config.params).map(([key, [, min, max, step]]) => (
        <Range
          key={key}
          label={key}
          value={params[key]}
          bounds={[min, max, step]}
          onChange={(value) => changeGain(key, value)}
        />
      ))}
      <button className="tune" disabled={busy} onClick={() => onTune(false)}>
        <WandSparkles size={16} />
        {busy ? tr('正在求解…', 'Tuning…') : tr('自动调参', 'Tune gains')}
      </button>
      {channels.length > 1 && (
        <button className="sub-action" disabled={busy} onClick={() => onTune(true)}>
          {tr('同步调参 A + B', 'Tune A + B')}
        </button>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <details className="notes">
        <summary>
          <BookOpen size={15} />
          {tr('原理与调参说明', 'Theory & tuning notes')}
        </summary>
        <p>{config.desc}</p>
        <p>{config.detail}</p>
        <p>{config.tuning}</p>
      </details>
      <details className="notes">
        <summary>{tr('参考文献', 'Reference')}</summary>
        <p>{paper.authors}</p>
        <a href={paper.url} target="_blank" rel="noreferrer">
          {paper.title} <ExternalLink size={13} />
        </a>
        <p>{paper.journal}</p>
      </details>
    </>
  );
}

export function EnvironmentPanel({ env, change, tr }) {
  const range = (key, zh, en, min, max, step, unit) => (
    <Range
      key={key}
      label={tr(zh, en)}
      value={env[key]}
      bounds={[min, max, step]}
      unit={unit}
      onChange={(value) => change(key, value)}
    />
  );
  return (
    <>
      <h2>
        <SlidersHorizontal />
        {tr('实验环境', 'Environment')}
      </h2>
      <h3>{tr('输入信号', 'Input signal')}</h3>
      <div className="seg wide">
        {[
          ['step', '阶跃', 'Step'],
          ['sine', '正弦', 'Sine'],
          ['square', '方波', 'Square'],
        ].map(([key, zh, en]) => (
          <button key={key} onClick={() => change('wave', key)} aria-pressed={env.wave === key}>
            {tr(zh, en)}
          </button>
        ))}
      </div>
      {env.wave === 'step' && range('target', '目标位置', 'Target position', -10, 10, 0.5, 'm')}
      {range('initialX', '初始位置', 'Initial position', -5, 10, 0.5, 'm')}
      {env.plant === 'pendulum' &&
        range('initialAngle', '初始摆角', 'Initial angle', -35, 35, 1, '°')}
      {range('wind', '恒定外力', 'Constant force', -50, 50, 1, 'N')}
      <h3>{tr('物理参数', 'Plant parameters')}</h3>
      {range('m', '质量', 'Mass', 0.5, 10, 0.1, 'kg')}
      {range('k', '弹簧刚度', 'Stiffness', 0, 10, 0.5, 'N/m')}
      {range('c', '黏性阻尼', 'Damping', 0, 5, 0.1, 'N·s/m')}
      {env.plant === 'pendulum' && range('l', '摆长', 'Rod length', 0.5, 3, 0.1, 'm')}
      <details className="notes">
        <summary>{tr('执行器与传感器', 'Actuator & sensor')}</summary>
        {range('saturation', '力限幅', 'Force limit', 10, 500, 10, 'N')}
        {range('deadzone', '死区', 'Deadzone', 0, 50, 1, 'N')}
        {range('delay', '时延（采样步）', 'Delay (samples)', 0, 50, 1, '')}
        {range('friction', '库仑摩擦', 'Coulomb friction', 0, 20, 1, 'N')}
        {range('noise', '测量噪声', 'Sensor noise', 0, 0.5, 0.01, '')}
        <button className="sub-action" onClick={() => change('hardware')}>
          {tr('复位硬件参数', 'Reset hardware')}
        </button>
      </details>
    </>
  );
}
