var http = require('http');
var fs = require('fs');
var stats = fs.readFileSync('../data/stats.json');

http.createServer(function(req, res) {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*'
  });
  res.end(stats);
}).listen(6000);
