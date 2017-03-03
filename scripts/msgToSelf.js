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

function testMsg(plugin) {
  return new Promise((resolve, reject) => {
    plugin.on('incoming_message', res => {
console.log('received msg', res);
      resolve({});
    });
    if (!plugin.ready) {
      throw new Error('Must be connected before sendMessage can be called');
    }

    const accountAddress = plugin.ledgerContext.urls.account.replace(':name', encodeURIComponent(plugin.username));

    request({
      auth:  {
        user: plugin.credentials.username,
        pass: plugin.credentials.password,
      },
      method: 'post',
      uri: plugin.ledgerContext.urls.message,
      body: {
        ledger: plugin.ledgerContext.host,
        from: accountAddress,
        to: accountAddress,
        data: {
          whatThisIs: 'just some message from me to me...', 
        },
      },
      json: true
    }, (err, sendRes, body) => {
      if (err) {
        reject(err);
      }
      if (sendRes.statusCode >= 400) {
        reject(new Error(body.message));
      }
    });
  });
}

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

module.exports.test = function(host, prefix) {
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
        return testMsg(plugin);
      }, 5000).then(sendTestResult => {
console.log({ sendTestResult });
        plugin.disconnect();
        return {
          connectSuccess: true,
          sendSuccess: typeof sendTestResult.error === 'undefined',
          connectTime: connectTestResult.duration,
          sendTime: sendTestResult.duration,
        };
      });
    } else {
      console.log('could not instantiate plugin...');
        return {
          connectSuccess: false,
          sendSuccess: false,
          connectTime: connectTestResult.duration,
        };
    }
  });
};
