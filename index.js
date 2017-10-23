'use strict';

const uuid = require('uuid/v4');

/* ----------------- */
/* --- Variables --- */
/* ----------------- */

const prefix = {
  pub: null,
  sub: null
};

const transporter = {
  connect: () => {
    throw new Error('Missing Transporter: no connect function declared');
  },
  publish: () => {
    throw new Error('Missing Transporter: no publish function declared');
  },
  subscribe: () => {
    throw new Error('Missing Transporter: no subscribe function declared');
  },
  unsubscribe: () => {
    throw new Error('Missing Transporter: no unsubscribe function declared');
  }
};

const subscriptionRegistry = {};
const subscriptionCounter = {};

/* ---------------- */
/* --- Internal --- */
/* ---------------- */

const _dataHandler = (channel, data) => {
  if (prefix.sub) {
    channel = channel.substring(prefix.sub.length);
  }

  if (subscriptionRegistry[channel]) {
    for (const callbackId in subscriptionRegistry[channel]) {
      if (!subscriptionRegistry[channel].hasOwnProperty(callbackId)) {
        continue;
      }
      subscriptionRegistry[channel][callbackId](channel, data);
    }
  }
};

const _unsubscribe = (channel, handlerId) => {
  if (typeof channel !== 'string' || channel.trim() === '') {
    throw new Error('Wrong Parameter: channel has to be a string');
  }
  if (typeof handlerId !== 'string' || handlerId.trim() === '') {
    throw new Error('Wrong Parameter: handlerId has to be a string');
  }

  channel = channel.trim();
  handlerId = handlerId.trim();

  if (subscriptionRegistry[channel] && subscriptionRegistry[channel][handlerId]) {
    delete subscriptionRegistry[channel][handlerId];
    subscriptionCounter[handlerId] -= 1;
  }
  if (subscriptionCounter[channel] < 1) {
    delete subscriptionRegistry[channel];
    delete subscriptionCounter[channel];
    transporter.unsubscribe((prefix.sub ? prefix.sub : '') + channel);
  }
};

/* ---------------------- */
/* --- Initialization --- */
/* ---------------------- */

const initialize = config => {
  if (typeof config !== 'object') {
    throw new Error('Missing Parameter: config is required');
  }
  if (typeof config.transporter !== 'object') {
    throw new Error('Parameter Error: transporter is required and has to be an object');
  }
  if (typeof config.transporter.connect !== 'function') {
    throw new Error('Parameter Error: transporter requires a connect function');
  }
  if (typeof config.transporter.publish !== 'function') {
    throw new Error('Parameter Error: transporter requires a publish function');
  }
  if (typeof config.transporter.subscribe !== 'function') {
    throw new Error('Parameter Error: transporter requires a subscribe function');
  }
  if (typeof config.transporter.unsubscribe !== 'function') {
    throw new Error('Parameter Error: transporter requires a unsubscribe function');
  }

  transporter.connect = config.transporter.connect;
  transporter.publish = config.transporter.publish;
  transporter.subscribe = config.transporter.subscribe;
  transporter.unsubscribe = config.transporter.unsubscribe;

  if (typeof config.channelPrefix === 'string' && config.channelPrefix.trim() !== '') {
    prefix.pub = prefix.sub = config.channelPrefix.trim();
  } else if (typeof config.channelPrefix === 'object') {
    if (typeof config.channelPrefix.pub === 'string' && config.channelPrefix.pub.trim() !== '') {
      prefix.pub = config.channelPrefix.pub.trim();
    }
    if (typeof config.channelPrefix.sub === 'string' && config.channelPrefix.sub.trim() !== '') {
      prefix.sub = config.channelPrefix.sub.trim();
    }
  }

  transporter.connect(_dataHandler);
};

/* ------------------- */
/* --- Publication --- */
/* ------------------- */

const publish = (channel, data) => {
  if (typeof channel !== 'string' || channel.trim() === '') {
    throw new Error('Wrong Parameter: channel has to be a string');
  }
  if (!data) {
    throw new Error('Missing Parameter: data is required');
  }

  channel = channel.trim();

  transporter.publish((prefix.pub ? prefix.pub : '') + channel, data);
};

/* -------------------- */
/* --- Subscription --- */
/* -------------------- */

const subscribe = (channel, subscriptionHandler) => {
  if (typeof channel !== 'string' || channel.trim() === '') {
    throw new Error('Wrong Parameter: channel has to be a string');
  }
  if (typeof subscriptionHandler !== 'function') {
    throw new Error('Wrong Parameter: callback has to be a function');
  }

  channel = channel.trim();
  const handlerId = uuid();

  if (!subscriptionRegistry[channel]) {
    subscriptionRegistry[channel] = [];
    subscriptionCounter[channel] = 0;
    transporter.subscribe((prefix.sub ? prefix.sub : '') + channel);
  }

  subscriptionRegistry[channel][handlerId] = subscriptionHandler;
  subscriptionCounter[channel] += 1;

  /* eslint-disable arrow-body-style */
  return () => _unsubscribe(channel, handlerId);
  /* eslint-enable arrow-body-style */
};

/* -------------- */
/* --- Export --- */
/* -------------- */

module.exports = {
  initialize,
  publish,
  subscribe
};
