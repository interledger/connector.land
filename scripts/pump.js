var rawStats = require('../data/stats-raw.json');
var routes = {};
for (var i in rawStats.connectors) {
  var parts = i.split('.');
  
  for (var j in rawStats.connectors[i].quoteResults) {
    if (typeof rawStats.connectors[i].quoteResults[j] === 'number') {
      var key = `${rawStats.connectors[i].ledger} ${j}`;
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
