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

function testMsg(plugin, prefix, recipients, maxTime = 5000) {
  var results = {};
  var startTime = new Date().getTime();

  return new Promise((resolve, reject) => {
    var failed = false;
    var pending = {};
    var timeout = setTimeout(function() {
      failed = true;
      for (var i in pending) {
        results[i] = 'no reply';
      }
      resolve(results);
    }, maxTime);
    plugin.on('incoming_message', res => {
      delete pending[res.from];
      results[res.from] = new Date().getTime() - startTime;
console.log('received msg', res, pending, Object.keys(pending).length, failed, prefix, recipients);
      if ((Object.keys(pending).length === 0) && !failed) {
console.log('resolving!');
        clearTimeout(timeout);
        resolve(results);
      }
    });
    if (!plugin.ready) {
      throw new Error('Must be connected before sendMessage can be called');
    }

    const fromAddress = plugin.ledgerContext.urls.account.replace(':name', encodeURIComponent(plugin.username));
    recipients.map(recipient => {
      const toAddress = plugin.ledgerContext.urls.account.replace(':name', encodeURIComponent(recipient));
      pending[prefix + recipient] = true;
      request({
        auth:  {
          user: plugin.credentials.username,
          pass: plugin.credentials.password,
        },
        method: 'post',
        uri: plugin.ledgerContext.urls.message,
        body: {
          ledger: plugin.ledgerContext.host,
          from: fromAddress,
          to: toAddress,
          data: {
            method: 'quote_request',
            data: {
              source_address: fromAddress,
              destination_address: fromAddress,
              destination_amount: '0.01',
            },
            id: `${plugin.prefix}-${recipient}`
          },
        },
        json: true
      }, (err, sendRes, body) => {
        if (err || sendRes.statusCode >= 400) {
          delete pending[prefix + recipient];
          results[prefix + recipient] = 'could not send';
          return; 
        }
      });
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


module.exports.test = function(host, prefix, recipients) {
  var pendingHosts = {};
  pendingHosts[host] = prefix;
console.log('test', host, prefix);
  var plugin;
  return doWithTimeout(function() {
    return connect(prefix, `https://${host}/ledger/accounts/connectorland`, passwords[host]).then(setPlugin => {
      plugin = setPlugin;
      return {};
    });
  }, 5000).then(connectTestResult => {
    if (plugin && typeof connectTestResult.error === 'undefined') {
      return testMsg(plugin, prefix, recipients, 5000).then(sendTestResult => {
console.log({ sendTestResult });
        plugin.disconnect();
console.log('giving bck result');
        return {
          connectSuccess: true,
          connectTime: connectTestResult.duration,
          sendResults: sendTestResult,
        };
      });
    } else {
      console.log('could not instantiate plugin...');
console.log('giving bck result');
        return {
          connectSuccess: false,
          connectTime: connectTestResult.duration,
          sendResults: {},
        };
    }
  }).then(result => {
    console.log('done', host, prefix);
    delete pendingHosts[host];
    console.log(pendingHosts);
    return result;
  }, err => {
    console.log('fail', host, prefix, error);
    delete pendingHosts[host];
    console.log(pendingHosts);
    return { connectSuccess: false, sendResults: {} };
  });
};
