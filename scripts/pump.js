var fs = require('fs');
var Plugin = require('ilp-plugin-bells');  // TODO: allow other ledger types
var Packet       = require('ilp-79/src/lib/packet');
var cryptoHelper = require('ilp-79/src/utils/crypto');
var base64url    = require('ilp-79/src/utils/base64url');
var cc           = require('ilp-79/src/utils/condition');
var uuidV4 = require('uuid/v4');
var crypto = require('crypto');
var rawStats = require('../data/stats-raw.json');
var passwords = require('../passwords.js');
var routes = {};
var plugins = {};
var fulfillments = {};
var balances = {};
var numPending = 0;
var numSuccess = 0;
var numFail = 0;

// TODO: wrap this into ilp-plugin-bells, see https://github.com/interledgerjs/ilp-plugin-bells/issues/107
function getPlugin(host, prefix, user, pass) {
  return new Plugin({
    prefix,
    account: `https://${host}/ledger/accounts/${user}`,
    password: pass,
  });
}

function saveResults() {
  fs.writeFileSync('results.json', JSON.stringify(routes, null, 2));
  console.log('results saved', { numPending, numSuccess, numFail });
  if (numPending === 0) {
    Object.keys(plugins).map(ledger => plugins[ledger].disconnect());
    console.log('Over and out');
    process.exit(0); //TODO: find out why this is necessary
  }
}

function gatherRoutes() {
  for (var i in rawStats.connectors) {
    if (i !== 'us.usd.red.micmic') {
      console.log('skipping', i);
      continue;
    }
    console.log('not skipping', i);
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
// //only test one route:
// break;
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
    return plugins[ledger].connect({ timeout: 10000 }).then(() => {
      console.log(`... connected to ${ledger} (hosted on ${host})`);
      plugins[ledger].on('outgoing_fulfill', res => {
        console.log('outgoing_fulfill', ledger, res);
        for (var key in routes) {
          if (routes[key].testPaymentId === res.id) {
            routes[key].result = { success: true, delay: new Date().getTime() - routes[key].startTime };
            console.log('ROUNDTRIP SUCCESS', routes[key]);
            numPending--;
            numSuccess++;
            console.log({ numPending, numSuccess, numFail });
            if (numPending === 0) {
              console.log(JSON.stringify(routes, null, 2));
            }
            break;
          }
        }
      });
      plugins[ledger].on('outgoing_reject', res => {
        console.log('outgoing_reject', ledger, res);
        for (var key in routes) {
          if (routes[key].testPaymentId === res.id) {
            routes[key].result = {
              success: false,
              reason: 'rejected by connector',
              delay: new Date().getTime() - routes[key].startTime
            };
            console.log('outgoing reject :(', routes[key]);
            numPending--;
            numFail++;
            console.log({ numPending, numSuccess, numFail });
            if (numPending === 0) {
              console.log(JSON.stringify(routes, null, 2));
            }
            break;
          }
        }
      });
      plugins[ledger].on('outgoing_cancel', res => {
        console.log('outgoing_cancel', ledger, res);
        for (var key in routes) {
          if (routes[key].testPaymentId === res.id) {
            routes[key].result = {
              success: false,
              reason: 'cancelled by ledger',
              delay: new Date().getTime() - routes[key].startTime
            };
            console.log('outgoing cancel :(', routes[key]);
            numPending--;
            numFail++;
            console.log({ numPending, numSuccess, numFail });
            if (numPending === 0) {
              console.log(JSON.stringify(routes, null, 2));
            }
            break;
          }
        }
      });
      plugins[ledger].on('incoming_prepare', res => {
        console.log('incoming_prepare!', ledger, res);
        // incoming_prepare! de.eur.blue. { id: '7de75a3e-2f02-49ed-8907-5a4f8a243ee1',
        //   direction: 'incoming',
        //   account: 'de.eur.blue.micmic',
        //   from: 'de.eur.blue.micmic',
        //   to: 'de.eur.blue.connectorland',
        //   ledger: 'de.eur.blue.',
        //   amount: '0.01',
        //   data: 
        //    { ilp_header: 
        //       { amount: '0.01',
        //         account: 'de.eur.blue.connectorland',
        //         data: [Object] } },
        //   executionCondition: 'cc:0:3:NM4LgYQos5lXIlT63OzD6zmBAlUroykzrQQCTVxtL14:32',
        //   expiresAt: '2017-03-10T13:19:50.085Z' }
        plugins[ledger].fulfillCondition(res.id, 'cf:0:' + fulfillments[res.id]).then(() => {
          console.log('fulfillCondition success');
        } , err => {
          console.log('fulfillCondition fail', ledger, res, res.id, fulfillments[res.id], err);
        });
      });
      plugins[ledger].on('outgoing_prepare', transfer => {
        var timeLeft = (new Date(transfer.expiresAt)).getTime() - (new Date().getTime());
        console.log('outgoing_prepare', { ledger, transfer }, transfer.data, transfer.noteToSelf.key, timeLeft, routes[transfer.noteToSelf.key]);
        routes[transfer.noteToSelf.key].result = 'outgoing_prepare, time left' + timeLeft;
      });
      [
        'incoming_transfer',
        'incoming_fulfill',
        'incoming_reject',
        'incoming_cancel',
        'incoming_message',
        'outgoing_transfer',
        'outgoing_reject',
        'info_change',
      ].map(eventName => {
        plugins[ledger].on(eventName, res => {
          console.log('Noting event', ledger, eventName, res);
        });
      });
    }, err => {
      console.log('could not connect to', host, ledger, err);
      cancelRoutesFor(ledger);
    });
  }));
}

function genCondition(key) {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(64, (err, secret) => { // much more than 32 bytes is not really useful here, I guess?
      if (err) {
        reject(err);
        return;
      }
      routes[key].testPaymentId = uuidV4();
      routes[key].expiresAt = makeDate(20);
      routes[key].packet = Packet.serialize({
        destinationAccount: key.split(' ')[1]+ 'connectorland',
        destinationAmount: '0.01',
        data: {
          blob: base64url(cryptoHelper.aesEncryptObject({ expiresAt: routes[key].expiresAt, data: undefined }, secret)),
        }
      });
      routes[key].condition = base64url(cc.toCondition(cryptoHelper.hmacJsonForPskCondition(routes[key].packet, secret)));
      var preimage = cryptoHelper.hmacJsonForPskCondition(routes[key].packet, secret)
      fulfillments[routes[key].testPaymentId] = cc.toFulfillment(preimage);
      resolve();
    });
  });
}

function makeDate(secondsInTheFuture) {
  return JSON.parse(JSON.stringify(new Date(new Date().getTime()+1000*secondsInTheFuture)));
}

function firstHop(key) {
  console.log('firstHop', key);
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
    expiresAt: routes[key].expiresAt,
  };
  console.log('trying to sendTransfer', JSON.stringify(transfer, null, 2));
  routes[key].startTime = new Date().getTime();
  return plugins[fromLedger].sendTransfer(transfer).then(() => {
    console.log('source payment success', key, transfer, routes[key], balances[fromLedger]);
  }, err => {
    console.log('payment failed', key, err, transfer, routes[key], balances[fromLedger]);
    if (err.name === 'NotAcceptedError') {
      routes[key].result = 'NotAcceptedError';
    } else {
      routes[key].result = 'could not send';
      process.exit(0);
    }
    numPending--;
    numFail++;
    console.log({ numPending, numSuccess, numFail });
  });
}

function cancelRoutesFor(ledger) {
  for (var key in routes) {
    var parts = key.split(' ');
    if (parts[0] === ledger) {
      console.log(`Cancelling test ${key}`);
      delete routes[key];
    }
  }
}

function checkFunds(ledger) {
  return plugins[ledger].getBalance().then(balance => {
    balances[ledger] = balance;
    console.log(`Balance for ${ledger} is ${balance}`);
    if (balance <= 0.05) {
      cancelRoutesFor(ledger);
    }
  }, err => {
    console.log('unable to check balance', ledger, err);
    cancelRoutesFor(ledger);
  });
}

function launchPayments() {
  console.log(`Gathering routes...`);
  return gatherRoutes().then(() => {
    console.log(`Connecting to ${Object.keys(plugins).length} plugins..`);
    return setupPlugins();
  }).then(() => {
    console.log(`Checking funds...`);
    return Promise.all(Object.keys(plugins).map(checkFunds));
  }).then(() => {
  //  console.log(`Generating ${Object.keys(routes).length} conditions...`);
  //  return Promise.all(Object.keys(routes).map(genCondition));
  //}).then(() => {
    console.log(`Sending ${Object.keys(routes).length} source payments...`);
    var delay = 0;
    return Promise.all(Object.keys(routes).map(key => {
      // if (key !== 'lu.eur.michiel. lu.eur.michiel-eur.') {
      //   return Promise.resolve();
      // }
      return new Promise((resolve, reject) => {
        setTimeout(() => {
         routes[key].result = 'generating condition';
          genCondition(key).then(() => {
            routes[key].result = 'sending first hop';
            resolve(firstHop(key));
          }, reject);
          numPending++;
        }, delay);
       delay += 1000;
       routes[key].result = 'queued to start';
     }).catch(err => {
       console.log('Source payment failed', key, err);
       numPending--;
       numFail++;
       routes[key].result = err.message;
     }).then(() => {
       routes[key].result = 'first hop sent';
     });
   }));
  }).then(() => {
    console.log(`Waiting for incoming_prepare and outgoing_fulfill messages...`);
    console.log(`For ${numPending} source payments...`);
  });
}

//...
setInterval(saveResults, 5000);
launchPayments();
