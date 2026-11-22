import { tune } from './tuning.js';
self.onmessage = ({ data: { channels, env } }) => {
  self.postMessage(channels.map((channel) => tune(channel, env)));
};
