'use strict'

const Plugin = require('ilp-plugin-bells')
const request = require('request')
const WebSocket = require('ws')
const passwords = require('../passwords')

function connect(prefix, account, password) {
  var plugin;
  return Promise.resolve().then(() => {
    plugin = new Plugin({ prefix, account, password, });
    return plugin.connect();
  }).then(() => {
    return plugin;
  });
}

function testMsg(plugin, prefix, conn, dest) {
  return new Promise((resolve, reject) => {
    plugin.on('incoming_message', res => {
console.log('received msg', res);
      resolve(res.data.data.liquidity_curve);
    });
    if (!plugin.ready) {
      throw new Error('Must be connected before sendMessage can be called');
    }

    plugin.sendMessage({ ledger: prefix,
      account: `${prefix}${conn}`,
      data: {
       method: 'quote_request',
       data: {
         source_address: `${prefix}connectorland`,
         destination_address: `${dest}connectorland`,
         destination_amount: '0.01',
       },
       id: `${prefix}-${conn}-${dest}`
      },
    });
  });
}

// new test plan:
// * connect to the plugin
// * listen to incoming messages using connectorland account
// * send various quote requests
// * see what comes back

function doWithTimeout(tryIt, timeoutMs) {
  const startTime = new Date().getTime();
  return new Promise(resolve => {
    const timeout = setTimeout(function () {
      resolve({ error: 'timeout' });
    }, timeoutMs);
    Promise.resolve().then(() => {
      return tryIt();
    }).then(result => {
console.log('clearing timeout after success');
      clearTimeout(timeout);
      resolve(result);
    }, err => {
console.log('clearing timeout after error');
      clearTimeout(timeout);
      resolve({ 'error': err });
    });
  }).then(result => {
    result.duration = new Date().getTime()-startTime;
console.log(result);
    return result;
  });
}

function testQuote(plugin, conn, from, to) {
  return doWithTimeout(function() {
    console.log('testing quote', { conn, from, to });
    return getQuote(plugin, conn, from, to);
  }, 5000);
}

var pending = {};

module.exports.test = function(host, prefix, conn, dest) {
console.log('module.exports.test = function(', { host, prefix, conn, dest });
  pending[host] = prefix;
console.log('test', host, prefix);
  var plugin;
  return doWithTimeout(function() {
    return connect(prefix, `https://${host}/ledger/accounts/connectorland`, passwords[host]).then(setPlugin => {
      plugin = setPlugin;
      return {};
    });
  }, 5000).then(connectTestResult => {
    if (plugin && typeof connectTestResult.error === 'undefined') {
      return doWithTimeout(function() {
        return testMsg(plugin, prefix, conn, dest);
      }, 5000).then(sendTestResult => {
console.log({ sendTestResult });
        plugin.disconnect();
console.log('giving bck result');
        return {
          connectSuccess: true,
          sendSuccess: typeof sendTestResult.error === 'undefined',
          connectTime: connectTestResult.duration,
          sendTime: sendTestResult.duration,
          curve: sendTestResult,
        };
      });
    } else {
      console.log('could not instantiate plugin...');
console.log('giving bck result');
        return {
          connectSuccess: false,
          sendSuccess: false,
          connectTime: connectTestResult.duration,
        };
    }
  }).then(result => {
    console.log('done', host, prefix);
    delete pending[host];
    console.log(pending);
    return result;
  }, err => {
    console.log('fail', host, prefix, error);
    delete pending[host];
    console.log(pending);
    return { connectSuccess: false, sendSuccess: false };
  });
};
