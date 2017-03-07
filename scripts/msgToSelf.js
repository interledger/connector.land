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

function send(plugin, prefix, fromAddress, toAddress, destLedger, onerror) {
  var req = {
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
          source_address: prefix + 'connectorland',
          destination_address: destLedger + 'connectorland',
          destination_amount: '0.01',
        },
        id: destLedger
      },
    },
    json: true
  };
console.log('sending', JSON.stringify(req, null, 2));
  request(req, (err, sendRes, body) => {
    if (err || sendRes.statusCode >= 400) {
      onerror();
      return;
    }
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
      if (typeof pending[res.from] === 'undefined') {
console.log('incoming quote', JSON.stringify(res, null, 2));
        handleQuote(res);
        return;
      }
console.log('incoming test', JSON.stringify(res, null, 2));
      delete pending[res.from];
      results[res.from] = new Date().getTime() - startTime;
      if ((Object.keys(pending).length === 0) && !failed) {
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
      send(plugin, prefix, fromAddress, toAddress, prefix, () => {
        delete pending[prefix + recipient];
        results[prefix + recipient] = 'could not send';
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
      clearTimeout(timeout);
      resolve(result);
    }, err => {
      clearTimeout(timeout);
      resolve({ 'error': err });
    });
  }).then(result => {
    result.duration = new Date().getTime()-startTime;
    return result;
  });
}

var quoteResults = {};
function handleQuote(res) {
  var microPrice = Infinity;
  if (Array.isArray(res.data.data.liquidity_curve)) {
    res.data.data.liquidity_curve.map(point => {
      if (point[0] < microPrice) {
        microPrice = point[0];
      }
    });
  }
  if (microPrice < Infinity) {
  quoteResults[res.ledger][res.from][res.data.id] = microPrice;
  } else {
    quoteResults[res.ledger][res.from][res.data.id] = '<span style="color:red">fail</span>';
  }
  console.log(res, quoteResults);
}

function requestQuote(plugin, prefix, connector, dest) {
  const fromAddress = plugin.ledgerContext.urls.account.replace(':name', encodeURIComponent(plugin.username));
  const toAddress = plugin.ledgerContext.urls.account.replace(':name', encodeURIComponent(connector.split('.').pop()));
  send(plugin, prefix, fromAddress, toAddress, dest, () => {
               //fail lu.eur.michiel. lu.eur.michiel.connector lu.eur.michiel.
    quoteResults[connector][dest] = 'fail';
  });
}

function testQuote(plugin, prefix, sendTestResults, destinations) {
  quoteResults[prefix] = {};
  for (var connector in sendTestResults) {
    if (connector !== prefix + 'connectorland' && typeof sendTestResults[connector] === 'number') {
      quoteResults[prefix][connector] = {};
      destinations.map(dest => {
        if (dest === prefix) {
          quoteResults[prefix][connector][dest] = 'n/a';
          return;
        }
        quoteResults[prefix][connector][dest] = 'no data';
        requestQuote(plugin, prefix, connector, dest);
      });
    }
  }
  return new Promise(resolve => {
    var timeout = setTimeout(() => {
      resolve(quoteResults[prefix]);
    }, 2500);
  });
}

module.exports.test = function(host, prefix, recipients, destinations) {
  var pendingHosts = {};
  pendingHosts[host] = prefix;
  var plugin;
  return doWithTimeout(function() {
    return connect(prefix, `https://${host}/ledger/accounts/connectorland`, passwords[host]).then(setPlugin => {
      plugin = setPlugin;
      return {};
    });
  }, 5000).then(connectTestResult => {
    if (plugin && typeof connectTestResult.error === 'undefined') {
      return testMsg(plugin, prefix, recipients, 5000).then(sendTestResult => {
        return testQuote(plugin, prefix, sendTestResult, destinations).then(thisPrefixQuoteResults => {
          plugin.disconnect();
          return {
            connectSuccess: true,
            connectTime: connectTestResult.duration,
            sendResults: sendTestResult,
            quoteResults: thisPrefixQuoteResults,
          };
        });
      });
    } else {
      return {
        connectSuccess: false,
        connectTime: connectTestResult.duration,
        sendResults: {},
      };
    }
  }).then(result => {
    delete pendingHosts[host];
    return result;
  }, err => {
    delete pendingHosts[host];
    return { connectSuccess: false, sendResults: {} };
  });
};
