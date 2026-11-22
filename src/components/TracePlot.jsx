import { useLayoutEffect, useRef } from 'react';
import { Maximize2 } from 'lucide-react';
import { INK } from './plotColors.js';

const fmt = (value) =>
  Math.abs(value) >= 1000 ? value.toExponential(0) : String(+value.toFixed(1));

function draw(canvas, history, metric, indices, channels, ghost, pendulum) {
  const { width, height } = canvas.getBoundingClientRect();
  if (width < 2 || height < 2) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const left = 39,
    top = 12,
    right = width - (metric === 'x' && pendulum ? 36 : 12),
    bottom = height - 23;
  const lines = [];
  const time = (pt) => pt.time;
  function line(x, y, color, dash = [], angle = false) {
    const points = history
      .map((pt) => [x(pt), y(pt)])
      .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
    lines.push({ points, color, dash, angle });
  }
  if (metric === 'x') line(time, (pt) => pt.target, '#72947e', [4, 3]);
  for (const i of indices) {
    const x = metric === 'phase' ? (pt) => pt.channels[i].x : time;
    const dashes = i === 1 ? [6, 3] : [];
    line(x, (pt) => pt.channels[i][metric === 'phase' ? 'v' : metric], INK[i], dashes);
    if (metric === 'x') {
      if (['PPC', 'Funnel-Control', 'TimeVary-BLF'].includes(channels[i].id)) {
        for (const sign of [-1, 1])
          line(x, (pt) => pt.target + sign * pt.channels[i].ref, '#8c71a8', [2, 3]);
      } else if (history.some((pt) => Number.isFinite(pt.channels[i].ref))) {
        line(x, (pt) => pt.channels[i].ref, '#8c71a8', [2, 3]);
      }
      if (pendulum) line(x, (pt) => (pt.channels[i].theta * 180) / Math.PI, INK[i], [1, 3], true);
    }
  }
  if (ghost && indices.length === 1 && channels.length === 2) {
    const other = 1 - indices[0];
    line(
      metric === 'phase' ? (pt) => pt.channels[other].x : time,
      (pt) => pt.channels[other][metric === 'phase' ? 'v' : metric],
      '#8898a2',
      [3, 4],
    );
  }
  let loX = Infinity,
    hiX = -Infinity,
    loY = 0,
    hiY = 0;
  for (const series of lines)
    for (const [x, y] of series.points) {
      loX = Math.min(loX, x);
      hiX = Math.max(hiX, x);
      if (!series.angle) {
        loY = Math.min(loY, y);
        hiY = Math.max(hiY, y);
      }
    }
  if (!Number.isFinite(loX)) {
    loX = 0;
    hiX = 1;
  }
  // Share signal ranges across the A/B panels when the ghost trace is hidden.
  if (channels.length > 1)
    for (const pt of history)
      for (const state of pt.channels) {
        const y = state[metric === 'phase' ? 'v' : metric];
        loY = Math.min(loY, y);
        hiY = Math.max(hiY, y);
        if (metric === 'phase') {
          loX = Math.min(loX, state.x);
          hiX = Math.max(hiX, state.x);
        }
      }
  if (metric !== 'phase') {
    hiX = Math.max(5, hiX);
    loX = Math.max(0, hiX - 15);
  }
  if (hiX - loX < 0.05) {
    loX -= 0.5;
    hiX += 0.5;
  }
  const pad = Math.max(0.1, (hiY - loY) * 0.1);
  loY -= pad;
  hiY += pad;
  const sx = (x) => left + ((right - left) * (x - loX)) / (hiX - loX);
  const sy = (y) => bottom - ((bottom - top) * (y - loY)) / (hiY - loY);
  ctx.font = '10px ui-monospace, monospace';
  ctx.fillStyle = '#52646d';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const part = i / 4,
      x = left + (right - left) * part,
      y = bottom - (bottom - top) * part;
    ctx.strokeStyle = '#dce5e8';
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillText(fmt(loY + part * (hiY - loY)), left - 5, y + 3);
    ctx.textAlign = 'center';
    ctx.fillText(fmt(loX + part * (hiX - loX)), x, bottom + 15);
    if (pendulum && metric === 'x') {
      ctx.textAlign = 'left';
      ctx.fillText(-60 + part * 120 + '°', right + 3, y + 3);
    }
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, right - left, bottom - top);
  ctx.clip();
  for (const { points, color, dash, angle } of lines) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.9;
    ctx.setLineDash(dash);
    ctx.beginPath();
    for (const [i, [x, y]] of points.entries()) {
      const py = angle ? bottom - ((bottom - top) * (60 + y)) / 120 : sy(y);
      if (i === 0) ctx.moveTo(sx(x), py);
      else ctx.lineTo(sx(x), py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function TracePlot({
  history,
  metric,
  indices,
  channels,
  ghost,
  pendulum,
  tr,
  zoom,
  onZoom,
}) {
  const ref = useRef(null);
  const title = {
    x: tr('位置响应', 'Position response'),
    phase: tr('相轨迹', 'Phase portrait'),
    u: tr('控制力', 'Actuator force'),
  }[metric];
  const axes = { x: 'x (m) / t (s)', phase: 'v (m/s) / x (m)', u: 'u (N) / t (s)' }[metric];
  useLayoutEffect(() => {
    const canvas = ref.current;
    const render = () => draw(canvas, history, metric, indices, channels, ghost, pendulum);
    render();
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [history, metric, indices, channels, ghost, pendulum]);
  return (
    <section className={'trace ' + (zoom ? 'large ' : '') + 'trace-' + metric}>
      <div className="trace-head">
        <strong>{title}</strong>
        <small>{axes}</small>
        {onZoom && (
          <button
            className="icon mini"
            title={tr('放大', 'Enlarge') + ' ' + title}
            aria-label={tr('放大', 'Enlarge') + ' ' + title}
            onClick={onZoom}
          >
            <Maximize2 size={15} />
          </button>
        )}
      </div>
      <canvas ref={ref} aria-label={title} />
    </section>
  );
}
