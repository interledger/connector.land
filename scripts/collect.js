var fs = require('fs');
var Client = require('ilp-client');
var credentials = require('../credentials');

const RAW_STATS_FILE = '../data/stats-raw.json';
var client = new Client(credentials);

function testRoute(obj) {
  console.log('testRoute START', obj);
  return client.sendMoney(obj.sender.ledger, obj.sender.account, obj.recipient.ledger, obj.recipient.account, 0.01).then(res => {
    console.log('testRoute SUCCESS', obj, res);
  }, err => {
    console.log('testRoute FAILURE', obj, err);
  });
}

function oneByOne(func, args, interval) {
  var interval;
  var promises = [];
  return new Promise(resolve => {
    var theseArgs;
    interval = setInterval(() => {
      if (args.length === 0) {
        clearInterval(interval);
        resolve();
      } else {
        theseArgs = args.shift();
        promises.push(func.call(null, theseArgs));
      }
    }, interval);
  }).then(() => {
    console.log('all launched! ...');
    return Promise.all(promises);
  });
}

// ...
var stats = JSON.parse(fs.readFileSync(RAW_STATS_FILE));
client.setStats(stats);
client.init().then(() => {
  var routes = [];
  client.getAccounts().map(sender => {
    return client.getReachableAccounts(sender).map(recipient => {
      routes.push({
        sender,
        recipient,
      });
    });
  });
  // deal with https://github.com/interledgerjs/five-bells-ledger/issues/402
  return oneByOne(testRoute, routes, 1500);
}).then(() => {
  updatedStats = client.getStats();
  fs.writeFileSync(RAW_STATS_FILE, JSON.stringify(updatedStats, null, 2));
  console.log(`Updated ${RAW_STATS_FILE}`);
  process.exit(0);
});


// things to test per ledger:
// * connect delay/success/timestamp (for msg mtbf)
// * msg delay/mtbf (and reconnect)
// * ledgerInfo
// * host WebFinger
