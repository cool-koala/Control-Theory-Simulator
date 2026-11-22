import { useId } from 'react';

import { INK } from './plotColors.js';

export function PlantView({ channels, states, target, env, tr }) {
  const grid = useId().replace(/:/g, '');
  const extent = Math.max(10, Math.abs(target), ...states.map((s) => Math.abs(s.x)));
  const px = (x) => 282 + (214 * x) / extent;
  return (
    <div className="apparatus">
      {states.map((s, i) => {
        const color = INK[i];
        const cart = px(s.x);
        const cartWidth = 52;
        const attachment = cart - cartWidth / 2;
        const spring = Array.from({ length: 23 }, (_, j) => {
          const x = 30 + ((attachment - 38) * j) / 22;
          const y = j === 0 || j === 22 ? 97 : 97 + (j % 2 ? -7 : 7);
          return x + ',' + y;
        }).join(' ');
        const pendulum = env.plant === 'pendulum';
        const rod = 40 + 9 * env.l;
        const tip = [cart + rod * Math.sin(s.theta), 86 - rod * Math.cos(s.theta)];
        return (
          <svg
            key={i}
            className="plant-svg"
            viewBox="0 0 560 152"
            role="img"
            aria-label={tr('物理模型', 'Physical model') + ' ' + channels[i].id}
          >
            <defs>
              <pattern id={grid + i} width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="8" cy="8" r=".8" fill="#b6c7cc" />
              </pattern>
            </defs>
            <rect width="560" height="152" fill={'url(#' + grid + i + ')'} />
            <text x="14" y="21" fill={color} className="svg-label">
              {String.fromCharCode(65 + i)} · {channels[i].id}
            </text>
            <path d={'M' + px(target) + ' 27v88'} stroke="#628777" strokeDasharray="4 4" />
            <text x={px(target)} y="21" textAnchor="middle" fill="#537665" className="svg-label">
              r = {target.toFixed(1)}
            </text>
            <rect x="14" y="75" width="11" height="41" fill="#74858f" />
            <path d={'M25 97h5 M' + (attachment - 8) + ' 97h8'} stroke="#596d78" strokeWidth="2" />
            <polyline points={spring} fill="none" stroke="#465d6a" strokeWidth="2.2" />
            <path d="M12 117h536" stroke="#607581" strokeWidth="2" />
            <rect
              x={cart - cartWidth / 2}
              y="85"
              width={cartWidth}
              height="23"
              rx="3"
              fill={color}
            />
            {[cart - 15, cart + 15].map((x) => (
              <g key={x}>
                <circle cx={x} cy="111" r="5.5" fill="#30424b" />
                <circle cx={x} cy="111" r="2" fill="#dbe5e7" />
              </g>
            ))}
            {pendulum ? (
              <g>
                <line x1={cart} y1="86" x2={tip[0]} y2={tip[1]} stroke={color} strokeWidth="5" />
                <circle cx={tip[0]} cy={tip[1]} r="7" fill={color} stroke="white" strokeWidth="2" />
                <circle cx={cart} cy="86" r="3" fill="white" />
              </g>
            ) : (
              <text x={cart} y="101" textAnchor="middle" fill="white" className="svg-label">
                {env.m.toFixed(1)} kg
              </text>
            )}
            {[-1, -0.5, 0, 0.5, 1].map((k) => (
              <g key={k}>
                <path d={'M' + px(k * extent) + ' 118v5'} stroke="#7f8e95" />
                <text
                  x={px(k * extent)}
                  y="139"
                  textAnchor="middle"
                  fill="#51656f"
                  className="svg-label"
                >
                  {Number((k * extent).toFixed(1))}
                </text>
              </g>
            ))}
            <text x="544" y="139" textAnchor="end" fill="#51656f" className="svg-label">
              m
            </text>
          </svg>
        );
      })}
    </div>
  );
}
