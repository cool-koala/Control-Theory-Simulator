import { useState } from 'react';
import { Box, ChartSpline } from 'lucide-react';
import { Modal } from './Modal.jsx';
import { PlantView } from './PlantView.jsx';
import { TracePlot } from './TracePlot.jsx';

const metrics = ['x', 'phase', 'u'];
const letters = ['A', 'B'];
export function Observations({ lab, tr, expanded, togglePanels }) {
  const { env, channels, compare, running, history, states, target, time } = lab;
  const [compact, setCompact] = useState(false);
  const [layout, setLayout] = useState('split');
  const [focus, setFocus] = useState('x');
  const [ghost, setGhost] = useState(true);
  const [zoom, setZoom] = useState(null);
  const indices = channels.map((_, i) => i);
  function plot(metric, ix, large = false) {
    return (
      <TracePlot
        key={metric + ix.join('')}
        history={history}
        metric={metric}
        indices={ix}
        channels={channels}
        ghost={!large && compare && layout === 'split' && ghost}
        pendulum={env.plant === 'pendulum'}
        tr={tr}
        zoom={large}
        onZoom={large ? null : () => setZoom({ metric, ix })}
      />
    );
  }
  return (
    <div className="bench">
      <section className="model">
        <header className="section-head">
          <h2>
            <Box />
            {tr('动力学模型', 'Plant dynamics')}
          </h2>
          <span className={'state ' + (running ? 'live' : '')}>
            {running ? tr('运行中', 'Running') : tr('已暂停', 'Paused')}
          </span>
          <output className="clock">{time.toFixed(2)} s</output>
          <button className="plain" onClick={() => setCompact(!compact)}>
            {compact ? tr('展开', 'Expand') : tr('收起', 'Collapse')}
          </button>
        </header>
        {!compact && (
          <PlantView channels={channels} states={states} env={env} target={target} tr={tr} />
        )}
      </section>
      <section className="signals">
        <header className="section-head">
          <h2>
            <ChartSpline />
            {tr('响应曲线', 'Response plots')}
          </h2>
          <button className="plain desktop-only" onClick={togglePanels}>
            {expanded ? tr('显示侧栏', 'Show panels') : tr('隐藏侧栏', 'Hide panels')}
          </button>
        </header>
        {compare && (
          <div className="chart-tools">
            <div className="seg">
              {[
                ['split', '分屏', 'Split'],
                ['overlay', '叠加', 'Overlay'],
                ['focus', '单指标', 'Single metric'],
              ].map(([key, zh, en]) => (
                <button aria-pressed={layout === key} key={key} onClick={() => setLayout(key)}>
                  {tr(zh, en)}
                </button>
              ))}
            </div>
            {layout === 'focus' && (
              <select
                aria-label={tr('指标', 'Metric')}
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
              >
                {metrics.map((m, i) => (
                  <option key={m} value={m}>
                    {['x(t)', 'v(x)', 'u(t)'][i]}
                  </option>
                ))}
              </select>
            )}
            {layout === 'split' && (
              <label>
                <input
                  type="checkbox"
                  checked={ghost}
                  onChange={(e) => setGhost(e.target.checked)}
                />
                {tr('对方参考线', 'Other channel')}
              </label>
            )}
          </div>
        )}
        <div className="legend">
          {channels.map((c, i) => (
            <span key={i} className={'key key-' + i}>
              {letters[i]} · {c.id}
            </span>
          ))}
          <span className="key ref">{tr('目标', 'Target')}</span>
          {states.some((s) => Number.isFinite(s.ref)) && (
            <span className="key aux">{tr('辅助参考', 'Reference')}</span>
          )}
          {env.plant === 'pendulum' && <span>{tr('点线 θ（右轴）', 'Dotted θ (right axis)')}</span>}
        </div>
        {compare && layout !== 'overlay' ? (
          <div className={'compare-plots mode-' + layout}>
            {indices.map((i) => (
              <div className="channel-group" key={i}>
                <h4>
                  {letters[i]} · {channels[i].id}
                </h4>
                <div className="plots">
                  {(layout === 'focus' ? [focus] : metrics).map((m) => plot(m, [i]))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="plots">{metrics.map((m) => plot(m, indices))}</div>
        )}
      </section>
      <section className="metrics">
        <h2>{tr('性能指标', 'Performance')}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  tr('通道', 'Channel'),
                  'RMSE (m)',
                  '∫u²dt (N²s)',
                  tr('阶跃超调', 'Overshoot'),
                  env.plant === 'pendulum' ? 'θ (°)' : tr('位置误差 (m)', 'Error (m)'),
                ].map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {states.map((s, i) => (
                <tr key={i}>
                  <th>
                    {letters[i]} · {channels[i].id}
                  </th>
                  <td>{s.rmse.toFixed(3)}</td>
                  <td>{s.energy.toFixed(1)}</td>
                  <td>
                    {env.wave === 'step' && env.target !== env.initialX
                      ? s.overshoot.toFixed(1) + '%'
                      : '—'}
                  </td>
                  <td>
                    {(env.plant === 'pendulum' ? (s.theta * 180) / Math.PI : target - s.x).toFixed(
                      2,
                    )}{' '}
                    {s.hitLimit && <b className="limit">{tr('曾触限', 'Limit hit')}</b>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {zoom && (
        <Modal
          wide
          title={tr('曲线检视', 'Plot inspector')}
          closeLabel={tr('关闭', 'Close')}
          onClose={() => setZoom(null)}
        >
          {plot(zoom.metric, zoom.ix, true)}
        </Modal>
      )}
    </div>
  );
}
