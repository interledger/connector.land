var Client = require('ilp-client');
var credentials = require('../credentials');

var client = new Client(credentials);
client.init().then(() => {
  console.log(client.getStats());
});


// things to test per ledger:
// * connect delay/success/timestamp (for msg mtbf)
// * msg delay/mtbf (and reconnect)
// * ledgerInfo
// * host WebFinger
