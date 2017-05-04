var fs = require('fs');
var request = require('request-promise-native');

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

var stats = JSON.parse(fs.readFileSync(RAW_FILE));

var rateCache;
var connectorLedger = {};

function getCurrencyRates() {
  if (typeof rateCache === 'object') {
    return Promise.resolve(rateCache);
  }
  return request({
    method: 'get',
    uri: 'https://api.fixer.io/latest',
    timeout: 10000,
    json: true,
  }).then(body => {
    if (typeof body === 'object' && typeof body.rates === 'object') {
      body.rates.EUR = 1.0000;
      return body.rates;
    } else {
      return {
        EUR: 1.0000,
        AUD: 1.3968,
        BGN: 1.9558,
        BRL: 3.3151,
        CAD: 1.4193,
        CHF: 1.0702,
        CNY: 7.2953,
        CZK: 27.021,
        DKK: 7.4335,
        GBP: 0.86753,
        HKD: 8.1982,
        HRK: 7.4213,
        HUF: 310.7,
        IDR: 14145,
        ILS: 3.8879,
        INR: 70.496,
        JPY: 120.65,
        KRW: 1216.4,
        MXN: 20.713,
        MYR: 4.7082,
        NOK: 8.9513,
        NZD: 1.5219,
        PHP: 53.198,
        PLN: 4.313,
        RON: 4.5503,
        RUB: 61.757,
        SEK: 9.5223,
        SGD: 1.4947,
        THB: 37.236,
        TRY: 3.9434,
        USD: 1.0556,
        ZAR: 13.791,
      };
    }
  }).then(rates => {
console.log('exchange rates', rates);
    rateCache = rates;
    return rates;
  });
}

function prefixToCurrency(prefix) {
  var parts = prefix.split('.');
  var str = '';
  for (var i=0; i<parts.length; i++) {
    str += parts[i] + '.';
    if (typeof stats.ledgers[str] === 'object') {
      return stats.ledgers[str].maxBalance.substr(-3);
    }
  }
  console.warn('WARNING! Currency not found for prefix', prefix);
  return 'EUR';
}

function exchangeRate(fromConn, toLedger) {
  if (typeof rateCache !== 'object') {
    console.warn('WARNING! Rate cache empty');
    return 'EUR';
  }
  var from = prefixToCurrency(fromConn);
  var to = prefixToCurrency(toLedger);
  // if from === EUR and to === USD, this returns:
  //              1.0000 / 1.0556
  // so it's the expected source amount if fee is zero.
  console.log('exchangeRate', fromConn, toLedger, from, to, rateCache[from], rateCache[to], rateCache[from] / rateCache[to]);
  return rateCache[from] / rateCache[to];
}

function integer(num) {
  return Math.floor(num + .5);
}

function percentage(num) {
  const DIGITS_FACTOR = 1000;
  var numDigits = integer(num * 100 * DIGITS_FACTOR);
  return `${numDigits / DIGITS_FACTOR}%`;
}

function fee(price, baseValue) {
  if (typeof price !== 'number') {
    return price;
  }
  var paidExtra = price - baseValue;
console.log('fee', price, baseValue, percentage(paidExtra / baseValue));
  return percentage(paidExtra / baseValue);
}

var hostRows = Object.keys(stats.hosts).sort(function(keyA, keyB) {
  var a = stats.hosts[keyA];
  var b = stats.hosts[keyB];

  var judgeVersion = {
    'Compatible: ilp-kit v2.3.1': 13,
    'Compatible: ilp-kit v2.3.0': 12,
    'Compatible: ilp-kit v2.2.1': 11,
    'Compatible: ilp-kit v2.2.0': 10,
    'Compatible: ilp-kit v2.1.1': 9,
    'Compatible: ilp-kit v2.1.0': 8,
    'Compatible: ilp-kit v2.0.1': 7,
    'Compatible: ilp-kit v2.0.0': 6,       //  3 May 2017
    'Compatible: ilp-kit v2.0.0-alpha': 5, // 19 Apr 2017 (dev-team internal release)
    'Compatible: ilp-kit v1.2.1': 4,       //  5 Apr 2017
    'Compatible: ilp-kit v1.2.0': 3,       // 22 Mar 2017
    'Compatible: ilp-kit v1.1.0': 2,       //  4 Feb 2017
    'Compatible: ilp-kit v1.0.0': 1,       // 19 Nov 2016
  };

  var versionA = judgeVersion[a.protocolVersion]
  var versionB = judgeVersion[a.protocolVersion]
  if (typeof versionA === 'undefined') return 1; // B is better
  if (typeof versionB === 'undefined') return -1;// A is better
  if (versionA < versionB) return 1; // B is better
  if (versionA > versionB) return -1;// A is better

  var delayA = (typeof a.messaging === 'number' ? a.messaging : 1000000);
  var delayB = (typeof b.messaging === 'number' ? b.messaging : 1000000);
  if (delayA < delayB) { return -1; }
  if (delayA > delayB) { return 1; }
  if ((typeof a.messaging === 'number') && (typeof b.messaging !== 'number')) { return -1; }
  if ((typeof a.messaging !== 'number') && (typeof b.messaging === 'number')) { return 1; }
  if ((('' + a.settlements).indexOf('<span style="color:red">') !== -1) && (('' + b.settlements).indexOf('<span style="color:red">') === -1)) { return 1; }
  if ((('' + a.settlements).indexOf('<span style="color:red">') === -1) && (('' + b.settlements).indexOf('<span style="color:red">') !== -1)) { return -1; }
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

return getCurrencyRates().then(() => {   
  var str = JSON.stringify({
    hosts: {
      headers: [
      '<th>ILP Kit URL</th>',
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
            (typeof line.protocolVersion === 'string' ? `<td style=\"color:green\">${line.protocolVersion}</td>` : `<td style=\"color:red\">WebFinger error</td>`) +
            `<td>${line.prefix}</td>` +
            `<td>${(typeof stats.ledgers[line.prefix] === 'object' ? stats.ledgers[line.prefix].maxBalance : '?')}</td>` +
            `<td>${(typeof stats.ledgers[line.prefix] === 'object' ? stats.ledgers[line.prefix].messaging : '?')}</td>` +
            `<td>${line.owner}</td>` +
            `<td>${line.settlements.slice(0, 50)}</td>` +
            `<td>${percentage(line.health)}</td>` +
            `<td>${percentage(line.ping)}</td>` +
            `</tr>`
      ),
    },
 
    ledgers: {
      headers: [
        '<th>Ledger Prefix</th>',
        '<th>Max Balance</th>',
        '<th>Message Delay</th>',
        '<th>Uptime</th>',
        '<th>Web Interface</th>',
        '<th>Settlement Methods</th>',
        '<th>Real Money?</th>',
      ],
      rows: Object.keys(stats.ledgers).map(prefix => {
        var line = stats.ledgers[prefix];
        var hostLine;
        for (var i=0; i<hostRows.length; i++) {
          if (hostRows[i].hostname === line.hostname) {
            hostLine = hostRows[i];
            break;
          }
        }
        if (typeof hostLine === 'undefined') {
          console.error('host not found!', prefix, line, hostRows);
          throw new Error('host not found!', prefix, hostRows);
        }
        return (typeof line.messaging === 'number' ?
          `<tr><td>${line.prefix}</td>` +
          `<td>${line.maxBalance}</td>` +
          `<td>${integer(line.messaging)}</td>` +
          `<td>${percentage(hostLine.health)}</td>` +
          `<td><a href="https://${line.hostname}">${line.hostname}</a></td>` +
          `<td>${hostLine.settlements.slice(0, 50)}</td>` +
          `<td>${(typeof line.prefix === 'string' && line.prefix.substring(0,2) === 'g.' ? 'YES' : 'NO')}</td>` +
          `</tr>`
        : '');
      }),
    },
    connectors: {
      headers: [ `<th>ILP address</th><th>Quote Delay (ms)</th>`,
          //`<th colspan="${destinations.length}">Micropayment fee to:</th>`,
          //`</tr><tr>`, // cheating, to get a second headers row
          //`<th></th><th></th>` //leave two columns empty on second headers row
        ].concat(destinations.map(dest => `<th style="white-space:pre">${dest}\n(fee for sending one cent)</th>`)),
      rows: Object.keys(stats.connectors).sort((a, b) => {
        return stats.connectors[a].delay - stats.connectors[b].delay;
      }).map(addr => {
        return `<tr><td>${addr}</td><td>${integer(stats.connectors[addr].delay)}</td>` +
          (typeof stats.connectors[addr].quoteResults === 'undefined' ?
            '' :
            destinations.map(dest => `<td>${fee(stats.connectors[addr].quoteResults[dest], 0.01 * exchangeRate(addr, dest))}</td>`)
          ) +
          '</tr>';
      }),
    },
  }, null, 2);
  
  fs.writeFileSync(OUTPUT_FILE, str);
});
