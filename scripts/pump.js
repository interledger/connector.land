var Plugin = require('ilp-plugin-bells');  // TODO: allow other ledger types
var rawStats = require('../data/stats-raw.json');
var passwords = require('../passwords.js');
var routes = {};
var plugins = {};


// TODO: wrap this into ilp-plugin-bells, see https://github.com/interledgerjs/ilp-plugin-bells/issues/107
function getPlugin(host, user, pass) {
  return new Promise(resolve => {
    require('request')({
      method: 'get',
      uri: `https://${host}/ledger`,
      json: true,
    }, (err, sendRes, body) => {
      console.log('prefix', host, body.ilp_prefix);
      resolve(new Plugin({
        prefix: body.ilp_prefix,
        account: `https://${host}/ledger/accounts/${user}`,
        password: pass,
      }));
    });
  });
}

function setupPayments() {
  var promises = {};
  for (var i in rawStats.connectors) {
    var parts = i.split('.');  
    for (var j in rawStats.connectors[i].quoteResults) {
      if (typeof rawStats.connectors[i].quoteResults[j] === 'number') {
        var from = rawStats.connectors[i].ledger;
        var to = j;
        var key = `${from} ${to}`;
        [from, to].map(ledger => {
          if (typeof plugins[ledger] === 'undefined') {
            plugins[ledger] = 'pending';
            promises.push(getPlugin(
        if (typeof routes[key] == 'object' && routes[key].price <= rawStats.connectors[i].quoteResults[j]) {
          console.log('Already have a (cheaper) route', key);
          continue;
        }
        routes[key] = {
          connector: i,
          price: rawStats.connectors[i].quoteResults[j],
        };
      }
    }
  }
  console.log(routes);
  return Promise.all(promises);
}
