'use strict'

var test = require('./msgToSelf');

console.log(process.argv);
test.test(process.argv[2], process.argv[3]).then(res => {
  console.log(res);
});
