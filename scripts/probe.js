var fs = require('fs');
var ping = require('ping');
var https = require('https');
var WebFinger = require('webfinger.js').WebFinger;
var wf = new WebFinger();
var msgToSelf = require('./msgToSelf');
var hostsArr = require('../data/hosts.js').hosts;

//TODO: get this from list of ledgers on which msgToSelf works:
var destinations = [
  'lu.eur.michiel.',
  'us.usd.hexdivision.',
  'eu.eur.pineapplesheep.',
  'us.usd.michiel-is-not-available.',
  'lu.eur.michiel-eur.',
  'us.usd.cygnus.',
  'us.usd.nexus.',
  'us.usd.cornelius.',
//  'us.usd.usd.', only connected to mmk?
  'us.usd.best-ilp.',
  'us.usd.ggizi.',
//  'ca.usd.royalcrypto.', old ilp-kit version?
  'de.eur.blue.',
  'us.usd.red.',
//  'mm.mmk.interledger.', only connected to us.usd.usd?
//  'kr.krw.interledgerkorea.', old ilp-kit version?
];

const RAW_FILE = '../data/stats-raw.json';
const OUTPUT_FILE = '../data/stats.json';

function checkUrl(i, path) {
  return new Promise((resolve) => {
    var request = https.request({
      hostname: hostsArr[i].hostname,
      port:443,
      path: path,
      method: 'GET'
    }, function(response) {
      var str = '';
      response.on('data', function (chunk) {
        str += chunk;
      });

      response.on('end', function () {
        resolve({ status: response.statusCode, body: str });
      });
    });
    request.setTimeout(5000, function(err) {
      resolve({ error: 'Timed out' });
    });
    request.on('error', function(err) {
      resolve({ error: 'Connection error' });
    });
    request.end();
  });
}

function checkApiCall(i, field, path, print) {
  return checkUrl(i, path).then((result) => {
    if (result.error) {
        return `<span style="color:red">${result.error}</span>`;
    } else if (result.status === 200) {
      return print(result.body);
    } else {
      return `HTTP <span style="color:red">${result.status}</span> response`;
    }
  }).then(text => {
    hostsArr[i][field] = text;
  });
}

function checkHealth(i) {
  return checkApiCall(i, 'health', '/api/health', function(body) {
    return body;
  });
}

function getApiVersion(i) {
  return new Promise((resolve) => {
    wf.lookup('https://'+hostsArr[i].hostname, function(err, result) {
      if (err) {
        resolve(`<span style="color:red">WebFinger error</span>`);
        return;
      }
      var version
      try {
        version = result.object.properties['https://interledger.org/rel/protocolVersion'];
      } catch(e) {
        resolve(`<span style="color:red">WebFinger properties missing</span>`);
        return;
      }
      if (typeof version === 'string') {
        resolve(`<span style="color:green">${version}</span>`);
      } else {
        resolve(JSON.stringify(version));
      }
    });
  }).then(text => {
    hostsArr[i].version = text;
  });
}

function checkSettlements(i) {
  return checkApiCall(i, 'settlements', '/api/settlement_methods', function(body) {
    var methods
    try {
      methods = JSON.parse(body);
      if (methods.length === 0) {
        return 'None';
      }
      return '<span style="color:green">' +
        methods.map(obj => obj.name).join(', ') +
        '</span>';
    } catch(e) {
      return '<span style="color:red">Unparseable JSON</span>';
    }
  });
}

function printScale(s) {
  const scales = {
    1: 'deci',
    2: 'centi',
    3: 'milli',
    6: 'micro',
    9: 'nano',
  };
  if (scales[s]) {
    return scales[s];
  }
  return `(10^-${s})`;
}

var extraConnectors = {}; // per DNS host, list accounts, only the extra ones
var connectors = {}; // per ILP address, list messaging delay, extra ones as well as defaults
var quotes = {};
var named = require('../data/hosts.js').named;
for (var i=0; i<named.length; i++) {
  for (var j=0; j<named[i].addresses.length; j++) {
    var parts = named[i].addresses[j].split('@');
    if (typeof extraConnectors[parts[1]] === 'undefined') {
      extraConnectors[parts[1]] = [];
    } 
    extraConnectors[parts[1]].push(parts[0]);
  }
}

function checkLedger(i) {
  return checkUrl(i, '/ledger').then(result => {
    if (result.error) {
        hostsArr[i].maxBalance = `<span style="color:red">?</span>`;
        hostsArr[i].prefix = `<span style="color:red">?</span>`;
        return;
    }
    if (result.status === 200) {
      var data;
      try {
        data = JSON.parse(result.body);
      } catch(e) {
        hostsArr[i].maxBalance = `<span style="color:red">?</span>`;
        hostsArr[i].prefix = `<span style="color:red">?</span>`;
        return;
      }
      hostsArr[i].prefix = data.ilp_prefix;
      hostsArr[i].maxBalance = `10^${data.precision} ${printScale(data.scale)}-${data.currency_code}`;
      var recipients = (extraConnectors[hostsArr[i].hostname] || []).concat(data.connectors.map(obj => obj.name));
      recipients.push('connectorland');

      return msgToSelf.test(hostsArr[i].hostname, hostsArr[i].prefix, recipients, destinations).then(result => {
        // {
        //   connectSuccess: true,
        //   connectTime: 4255,
        //   sendResults: {
        //     'kr.krw.interledgerkorea.connector': 'could not send',
        //     'kr.krw.interledgerkorea.connectorland': 987,
        //   },
        //   quoteResults: {
        //     'kr.krw.interledgerkorea.': 'no data',
        //   ,}
        // }
console.log('results are in:', hostsArr[i].hostname, hostsArr[i].prefix, recipients, destinations, result); 
        hostsArr[i].messaging = (result.connectSuccess ? result.connectTime : 'fail');
        hostsArr[i].messageToSelf = result.sendResults[hostsArr[i].prefix + 'connectorland'];
        for (var addr in result.sendResults) {
          if (addr !== hostsArr[i].prefix + 'connectorland') {
            connectors[addr] = result.sendResults[addr];
            if (result.quoteResults) {
              quotes[addr] = result.quoteResults[addr];
            }
          }
        }
      });
    }
  }).then(() => {
  });
}

function pingHost(i) {
  return new Promise((resolve) => {
    ping.sys.probe(hostsArr[i].hostname, function(isAlive){
      hostsArr[i].ping = isAlive;
      resolve();
    });
  });
}

function mergeHost(existingData, newData) {
  return newData;
}

function mergeLedger(existingData, newData) {
  return newData;
}

function mergeConnector(existingData, newData) {
  return newData;
}

// ...
var promises = [];
//for (var i=16; i<17; i++) {
for (var i=0; i<hostsArr.length; i++) {
  promises.push(getApiVersion(i));
  promises.push(pingHost(i));
  promises.push(checkHealth(i));
  promises.push(checkSettlements(i));
  promises.push(checkLedger(i));
//  if (typeof perfStats[hostsArr[i].hostname] !== 'undefined') {
//    hostsArr[i].speed = perfStats[hostsArr[i].hostname].speed;
//    hostsArr[i].price = perfStats[hostsArr[i].hostname].price;
//    hostsArr[i].reliability = perfStats[hostsArr[i].hostname].reliability;
//  } else {
//    hostsArr[i].speed = 0;
//    hostsArr[i].price = 0;
//    hostsArr[i].reliability = 0;
//  } 
}
Promise.all(promises).then(() => {
  var stats = {
    hosts: {},
    ledgers: {},
    connectors: {},
  };
  try {
   stats = JSON.parse(fs.readFileSync(RAW_FILE));
  } catch(e) {
  }
  for (var i=0; i < hostsArr.length; i++) {
    stats.hosts[hostsArr[i].hostname] = mergeHost(stats.hosts[hostsArr[i].hostname], hostsArr[i]);
  }
  for (var i=0; i < hostsArr.length; i++) {
    stats.ledgers[hostsArr[i].hostname] = mergeLedger(stats.ledgers[hostsArr[i].hostname], hostsArr[i]);
  }
  for (var i in connectors) { 
    stats.connectors[i] = mergeConnector(stats.connectors[i], connectors[i]);
  }
  fs.writeFileSync(RAW_FILE, JSON.stringify(stats, null, 2));
  var hostRows = Object.keys(stats.hosts).sort(function(keyA, keyB) {
    var a = stats.hosts[keyA];
    var b = stats.hosts[keyB];
    var delayA = (typeof a.messaging === 'number' ? a.messaging : 1000000);
    var delayB = (typeof b.messaging === 'number' ? b.messaging : 1000000);
    if (delayA < delayB) { return -1; }
    if (delayA > delayB) { return 1; }
    if ((typeof a.messaging === 'number') && (typeof b.messaging !== 'number')) { return -1; }
    if ((typeof a.messaging !== 'number') && (typeof b.messaging === 'number')) { return 1; }
    if ((('' + a.settlements).indexOf('<span style="color:red">') !== -1) && (('' + b.settlements).indexOf('<span style="color:red">') === -1)) { return 1; }
    if ((('' + a.settlements).indexOf('<span style="color:red">') === -1) && (('' + b.settlements).indexOf('<span style="color:red">') !== -1)) { return -1; }
//    if (a.reliability < b.reliability) { return 1; }
//    if (a.reliability > b.reliability) { return -1; }
//    if (a.speed < b.speed) { return -1; }
//    if (a.speed > b.speed) { return 1; }
//    if (a.price < b.price) { return -1; }
//    if (a.price > b.price) { return 1; }
    if ((a.health === 'OK') && (b.health !== 'OK')) { return -1; }
    if ((a.health !== 'OK') && (b.health === 'OK')) { return 1; }
    if ((a.ping) && (!b.ping)) { return -1; }
    if ((!a.ping) && (b.ping)) { return 1; }
    if ((a.settlements === 'None') && (b.settlements !== 'None')) { return 1; }
    if ((a.settlements !== 'None') && (b.settlements === 'None')) { return -1; }
    if (a.hostname < b.hostname) { return -1; }
    if (a.hostname > b.hostname) { return 1; }
    return 0;
  }).map(key => stats.hosts[key]);
  var str = JSON.stringify({
    headers: [
    '<th>ILP Kit URL</th>',
//     '<th>Reliability (success rate)</th>',
//     '<th>Speed (one transaction)</th>',
//     '<th>Price (commission fee on a 0.01 EUR/USD transaction)</th>',
    '<th>ILP Kit Version</th>',
    '<th>Ledger Prefix</th>',
    '<th>Max Balance</th>',
    '<th>Message Delay</th>',
    '<th>Owner\'s Connector Account</th>',
    '<th>Settlement Methods</th>',
    '<th>Health</th>',
    '<th>Ping</th>',
  ],
    rows: hostRows.map(line =>
    `<tr><td><a href="https://${line.hostname}">${line.hostname}</a></td>` +
//        `<td>${Math.floor(1000*line.reliability)/10}%</td>` +
//        `<td>${Math.floor(line.speed)/1000} seconds</td>` +
//        `<td>${Math.floor(100*line.price)}%</td>` +
        `<td>${line.version}</td>` +
        `<td>${line.prefix}</td>` +
        `<td>${line.maxBalance}</td>` +
        `<td>${line.messaging}</td>` +
        `<td>${line.owner}</td>` +
        `<td>${line.settlements.slice(0, 50)}</td>` +
        `<td>${line.health.slice(0, 50)}</td>` +
        (line.ping?`<td style="color:green">&#x2713;</td>` : `<td style="color:red">&#x2716;</td>`) +
        `</tr>`
  ),

    hosts: {
      headers: [
        '<th>ILP Kit URL</th>',
        '<th>ILP Kit Version</th>',
        '<th>Owner\'s Connector Account</th>',
        '<th>Settlement Methods</th>',
        '<th>Health</th>',
        '<th>Ping</th>',
        '<th>Ledger</th>',
      ],
      rows: hostRows.map(line =>
        `<tr><td><a href="https://${line.hostname}">${line.hostname}</a></td>` +
        `<td>${line.version}</td>` +
        `<td>${line.owner}</td>` +
        `<td>${line.settlements.slice(0, 50)}</td>` +
        `<td>${line.health.slice(0, 50)}</td>` +
        (line.ping?`<td style="color:green">&#x2713;</td>` : `<td style="color:red">&#x2716;</td>`) +
        (typeof line.messaging === 'number' ? `<td>${line.prefix}</td>` : `<td><strike style="color:red">${line.prefix}</strike></td>`) +
        `</tr>`
      ),
    },
    ledgers: {
      headers: [
        '<th>Ledger Prefix</th>',
        '<th>Max Balance</th>',
        '<th>Message Delay</th>',
        '<th>Host</th>',
      ],
      rows: Object.keys(stats.ledgers).map(hostname => {
        var line = stats.ledgers[hostname];
        return (typeof line.messaging === 'number' ?
          `<tr><td>${line.prefix}</td>` +
          `<td>${line.maxBalance}</td>` +
          `<td>${line.messaging}</td>` +
          `<td><a href="https://${line.hostname}">${line.hostname}</a></td>` +
          `</tr>`
        : '');
      }),
    },
    connectors: {
      headers: [ `<th>ILP address</th><th>Quote Delay (ms)</th>`,
          //`<th colspan="${destinations.length}">Micropayment fee to:</th>`,
          //`</tr><tr>`, // cheating, to get a second headers row
          //`<th></th><th></th>` //leave two columns empty on second headers row
        ].concat(destinations.map(dest => `<th>${dest} fee</th>`)),
      rows: Object.keys(stats.connectors).sort((a, b) => {
        if (typeof stats.connectors[a] === 'number') {
          if (typeof stats.connectors[b] === 'number') {
            return stats.connectors[a] - stats.connectors[b];
          } else {
            return -1;
          }
        } else {
          if (typeof stats.connectors[b] === 'number') {
            return 1;
          } else {
            return 0;
          }
        }
      }).map(addr => {
        return `<tr><td>${addr}</td><td>${stats.connectors[addr]}</td>` +
          (typeof quotes[addr] === 'undefined' ?
            '' :
            destinations.map(dest => `<td>${quotes[addr][dest]}</td>`)
          ) +
          '</tr>';
      }),
    },
  }, null, 2);
  fs.writeFileSync(OUTPUT_FILE, str);
  process.exit(0);
}, err => {
  console.log(err);
});
