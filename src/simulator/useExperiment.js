import { useEffect, useRef, useState } from 'react';
import { DT, getDefaultParams } from './controllerConfigs.js';
import { DEFAULT_ENV, createExperiment, snapshot, stepExperiment } from './experiment.js';
import { getTargetSignal } from './runtime.js';

const channel = (id) => ({ id, params: getDefaultParams(id) });
export function useExperiment() {
  const [env, setEnv] = useState(DEFAULT_ENV);
  const [pair, setPair] = useState(() => [channel('PID'), channel('ADRC')]);
  const [compare, setCompare] = useState(false);
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [history, setHistory] = useState([]);
  const model = useRef(null);
  const worker = useRef(null);
  if (!model.current) model.current = createExperiment(env, 1);
  const channels = compare ? pair : [pair[0]];
  useEffect(() => {
    if (!running) return;
    const selection = compare ? pair : [pair[0]];
    let frame,
      previous = null,
      accumulator = 0,
      painted = 0;
    function update(now) {
      if (previous !== null) accumulator += Math.min(0.1, (now - previous) / 1000);
      previous = now;
      while (accumulator >= DT) {
        stepExperiment(model.current, selection, env);
        accumulator -= DT;
      }
      if (now - painted >= 75) {
        setHistory(model.current.history.slice());
        painted = now;
      }
      frame = requestAnimationFrame(update);
    }
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [running, pair, compare, env]);
  useEffect(() => () => worker.current?.terminate(), []);
  function cancelTune() {
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
    setResult('');
  }
  function reset(nextEnv = env, count = channels.length) {
    cancelTune();
    model.current = createExperiment(nextEnv, count);
    setHistory([]);
  }
  function changeEnv(key, value) {
    const next = { ...env };
    if (key === 'hardware')
      for (const k of ['saturation', 'deadzone', 'delay', 'friction', 'noise'])
        next[k] = DEFAULT_ENV[k];
    else next[key] = value;
    setEnv(next);
    if (['plant', 'initialX', 'initialAngle', 'wave', 'target'].includes(key)) reset(next);
    else cancelTune();
  }
  function toggleCompare() {
    setCompare(!compare);
    setActive(0);
    reset(env, compare ? 1 : 2);
  }
  function preset(p) {
    setPair([channel(p.a), channel(p.b)]);
    setActive(0);
    reset(env, 2);
  }
  function changeMethod(id) {
    setPair(pair.map((c, i) => (i === active ? channel(id) : c)));
    reset();
  }
  function changeGain(key, value) {
    cancelTune();
    setPair(
      pair.map((c, i) => (i === active ? { ...c, params: { ...c.params, [key]: value } } : c)),
    );
  }
  function tune(both) {
    cancelTune();
    setBusy(true);
    const indices = both ? [0, 1] : [active];
    const job = new Worker(new URL('./tuning.worker.js', import.meta.url), { type: 'module' });
    worker.current = job;
    job.onmessage = ({ data }) => {
      if (worker.current !== job) return;
      const next = pair.slice();
      indices.forEach((i, j) => {
        next[i] = { ...pair[i], params: data[j].params };
      });
      setPair(next);
      reset();
      setResult(
        indices
          .map((i, j) => (i ? 'B' : 'A') + ' ' + data[j].improvement.toFixed(1) + '%')
          .join(' / '),
      );
    };
    job.onerror = () => {
      if (worker.current === job) {
        cancelTune();
        setResult('error');
      }
    };
    job.postMessage({ channels: indices.map((i) => pair[i]), env });
  }
  function disturb() {
    model.current.impulse = 150;
    setRunning(true);
  }
  const point = history.at(-1);
  return {
    env,
    channels,
    compare,
    active,
    setActive,
    running,
    setRunning,
    busy,
    result,
    history,
    states: point?.channels ?? model.current.channels.map(snapshot),
    target: point?.target ?? getTargetSignal(env.wave, env.target, 0),
    time: point?.time ?? 0,
    reset,
    changeEnv,
    toggleCompare,
    preset,
    changeMethod,
    changeGain,
    tune,
    disturb,
  };
}
