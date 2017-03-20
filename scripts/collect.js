var fs = require('fs');
var Client = require('ilp-client');
var credentials = require('../credentials');

const RAW_STATS_FILE = '../data/stats-raw.json';
var client = new Client(credentials);

var stats = JSON.parse(fs.readFileSync(RAW_STATS_FILE));
client.setStats(stats);
client.init().then(() => {
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
