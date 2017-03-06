var http = require('http');
var fs = require('fs');
var stats = fs.readFileSync('../data/stats.json');

http.createServer(function(req, res) {
console.log(req.url);
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*'
  });
  res.end(stats);
}).listen(6000);
