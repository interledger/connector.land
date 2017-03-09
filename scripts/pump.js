var Plugin = require('ilp-plugin-bells');  // TODO: allow other ledger types
var ILP = require('ilp-79');
const uuidV4 = require('uuid/v4');
var crypto = require('crypto');
var rawStats = require('../data/stats-raw.json');
var passwords = require('../passwords.js');
var routes = {};
var plugins = {};


// TODO: wrap this into ilp-plugin-bells, see https://github.com/interledgerjs/ilp-plugin-bells/issues/107
function getPlugin(host, prefix, user, pass) {
  var ret = new Plugin({
    prefix,
    account: `https://${host}/ledger/accounts/${user}`,
    password: pass,
  });
  // TODO: fix this in ilp-plugin-bells
  ret.sendTransferFixed = (function(transfer) {
    transfer.account = transfer.to;
    console.log('Fixed Transfer', JSON.stringify(transfer, null, 2));
    return this.sendTransfer(transfer);
  }).bind(ret);
  return ret;
}

function gatherRoutes() {
  for (var i in rawStats.connectors) {
    var parts = i.split('.');  
    for (var j in rawStats.connectors[i].quoteResults) {
      if (typeof rawStats.connectors[i].quoteResults[j] === 'number') {
        var from = rawStats.connectors[i].ledger;
        var to = j;
        var key = `${from} ${to}`;
        [from, to].map(ledger => {
          plugins[ledger] = true;
        });
        if (typeof routes[key] == 'object' && routes[key].price <= rawStats.connectors[i].quoteResults[j]) {
          //console.log('Already have a (cheaper) route', key);
          continue;
        }
        routes[key] = {
          connector: i,
          price: rawStats.connectors[i].quoteResults[j],
        };
      }
    }
  }
  console.log(`Will test ${Object.keys(routes).length} routes`);
  return Promise.resolve();
}

function setupPlugins() {
  return Promise.all(Object.keys(plugins).map(ledger => {
    var host = rawStats.ledgers[ledger].hostname;
    if (typeof host !== 'string') {
      throw new Error(`Cannot find host for ${ledger}`);
    }
    var password = passwords[host];
    if (typeof password !== 'string') {
      throw new Error(`Cannot find password for ${host}`);
    }
    plugins[ledger] = getPlugin(host, ledger, 'connectorland', password);
    console.log(`Connecting to ${host}...`);
    return plugins[ledger].connect();
  }));
}

function genCondition(key) {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(64, (err, buf) => { // much more than 32 bytes is not really useful here, I guess?
      if (err) {
        reject(err);
      } else {
        resolve(buf);
      }
    });
  }).then(secret => {
    routes[key].testPaymentId = uuidV4();
    var obj = ILP.IPR.createPacketAndCondition({
      id: routes[key].testPaymentId,
      destinationAmount: '0.01',
      destinationAccount: key.split(' ')[1]+ 'connectorland',
      secret,
    });
    routes[key].secret = secret;
    routes[key].packet = obj.packet;
    routes[key].condition = obj.condition;
  });
}

function makeDate(secondsInTheFuture) {
  return JSON.parse(JSON.stringify(new Date(new Date().getTime()+1000*secondsInTheFuture)));
}

function firstHop(key) {
  var parts = key.split(' ');
  var fromLedger = parts[0];
  var toLedger = parts[1];
  console.log(key, routes[key]);
  //   "transfer": {
  //     "id": "57aad850-4ff9-43e4-8966-9335ce98ea2a",
  //     "account": "lu.eur.michiel-eur.micmic",
  //     "ledger": "lu.eur.michiel-eur.",
  //     "amount": "0.02",
  //     "data": {
  //       "ilp_header": {
  //         "account": "us.usd.cornelius.connectorland.~psk.ke-ITDdsqck.rB9F8q4EBsJtOLC5uaYerQ.65f43234-5a2b-49c4-a6a3-371737efa023",
  //         "amount": "0.01",
  //         "data": {
  //           "expires_at": "2017-03-09T18:05:57.600Z"
  //         }
  //       }
  //     },
  //     "executionCondition": "cc:0:3:2ga6A_EOk_j6MnMVfF_asCcRfcyyD7C_essN6rVR8V4:32",
  //     "expiresAt": "2017-03-09T18:05:38.393Z"
  //   }

  var transfer = {
    id: routes[key].testPaymentId,
    to: routes[key].connector,
    from: fromLedger + 'connectorland',
    ledger: fromLedger,
    noteToSelf: { key },
    amount: '' + routes[key].price,
    data: routes[key].packet,
    executionCondition: `cc:0:3:${routes[key].condition}:32`,
    expiresAt: makeDate(30),
  };
  console.log('trying to sendTransfer', JSON.stringify(transfer, null, 2));
  return plugins[fromLedger].sendTransfer(transfer);
}

function launchPayments() {
  console.log(`Gathering routes...`);
  return gatherRoutes().then(() => {
    console.log(`Connecting to ${Object.keys(plugins).length} plugins..`);
    return setupPlugins();
  }).then(() => {
    console.log(`Generating conditions...`);
    return Promise.all(Object.keys(routes).map(key => {
      return genCondition(key);
    }));
  }).then(() => {
    console.log(`Sending source payments...`);
    // return Promise.all(Object.keys(routes).map(key => {
    //   return firstHop(key);
    // }));
    return firstHop(Object.keys(routes)[0]);
  }).then(() => {
    console.log(`Waiting for incoming_prepare and outgoing_fulfill messages...`);
  });
}

//...
launchPayments();
