'use strict'

var quote = require('./testQuoteCommon');

console.log(process.argv);
var promises = []
for (var i=0; i<1; i++) {
  promises.push(quote.test(process.argv[2], process.argv[3], process.argv[4]));
}
Promise.all(promises).then(results => {
  console.log(results);
    process.exit(0); // this is an upstream bug
});
