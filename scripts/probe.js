var fs = require('fs');
var ping = require('ping');
var https = require('https');
var WebFinger = require('webfinger.js').WebFinger;
var wf = new WebFinger();
var msgToSelf = require('./msgToSelf');
var hosts = require('../data/hosts.js').hosts;
const OUTPUT_FILE = '../data/stats.json';

function checkUrl(i, path) {
  return new Promise((resolve) => {
    var request = https.request({
      hostname: hosts[i].hostname,
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
    console.log(`${field} for ${hosts[i].hostname}: ${text}`);
    hosts[i][field] = text;
  });
}

function checkHealth(i) {
  return checkApiCall(i, 'health', '/api/health', function(body) {
    return body;
  });
}

function getApiVersion(i) {
  return new Promise((resolve) => {
    wf.lookup('https://'+hosts[i].hostname, function(err, result) {
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
    console.log(`api version for ${hosts[i].hostname}: ${text}`);
    hosts[i].version = text;
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

function checkLedger(i) {
  return checkUrl(i, '/ledger').then(result => {
console.log('result', i, result);
    if (result.error) {
        hosts[i].maxBalance = `<span style="color:red">?</span>`;
        hosts[i].prefix = `<span style="color:red">?</span>`;
        return;
    }
    if (result.status === 200) {
      var data;
      try {
        data = JSON.parse(result.body);
      } catch(e) {
        hosts[i].maxBalance = `<span style="color:red">?</span>`;
        hosts[i].prefix = `<span style="color:red">?</span>`;
        return;
      }
      hosts[i].prefix = data.ilp_prefix;
      hosts[i].maxBalance = `10^${data.precision} ${printScale(data.scale)}-${data.currency_code}`;
      return msgToSelf.test(hosts[i].hostname, hosts[i].prefix).then(result => {
        console.log('msg to self', hosts[i].hostname, hosts[i].prefix, result);
        // { connectSuccess: true,
        //   sendSuccess: false,
        //   connectTime: 277,
        //   sendTime: 0 }

        hosts[i].messaging = ( result.connectSuccess ?
          (result.sendSuccess ? result.connectTime + result.sendTime : 'cannot send')
          : 'cannot connect');
      });
    }
  }).then(() => {
    console.log('done checkLedger', promises.length);
  });
}

function pingHost(i) {
  return new Promise((resolve) => {
    ping.sys.probe(hosts[i].hostname, function(isAlive){
      hosts[i].ping = isAlive;
      resolve();
    });
  });
}

// ...
var promises = [];
//for (var i=16; i<17; i++) {
for (var i=0; i<hosts.length; i++) {
  promises.push(getApiVersion(i));
  promises.push(pingHost(i));
  promises.push(checkHealth(i));
  promises.push(checkSettlements(i));
  promises.push(checkLedger(i));
//  if (typeof perfStats[hosts[i].hostname] !== 'undefined') {
//    hosts[i].speed = perfStats[hosts[i].hostname].speed;
//    hosts[i].price = perfStats[hosts[i].hostname].price;
//    hosts[i].reliability = perfStats[hosts[i].hostname].reliability;
//  } else {
//    hosts[i].speed = 0;
//    hosts[i].price = 0;
//    hosts[i].reliability = 0;
//  } 
}
Promise.all(promises).then(() => {
console.log('ALL PROMISES DONE! :)');
  var rows = hosts.sort(function(a, b) {
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
  }).map(line =>
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
  );
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
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
    rows: rows
  }, null, 2));
  process.exit(0);
}, err => {
  console.log(err);
});
