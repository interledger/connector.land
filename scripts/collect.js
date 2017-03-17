var Client = require('ilp-client');
var credentials = require('../credentials');

var client = new Client(credentials);
client.init().then(() => {
  console.log(client.getStats());
});
