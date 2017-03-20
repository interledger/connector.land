var fs = require('fs');
var stats = require('../data/stats-raw.json');

var numHosts = {
  recent: 0,
  old: 0,
  down: 0,
  total: 0,
};
for (var i in stats.hosts) {
  numHosts.total++;
  if (stats.hosts[i].version === '<span style=\"color:green\">Compatible: ilp-kit v1.1.0</span>') {
    numHosts.recent++;
  } else if (typeof stats.hosts[i].version === 'undefined') {
    numHosts.old++;
  } else {
    numHosts.down++;
  }
}

var numLedgers = {
  fast: 0,
  medium: 0,
  slow: 0,
  down: 0,
  total: 0,
};
for (var i in stats.ledgers) {
  numLedgers.total++;
  if (stats.ledgers[i].connectSuccess > .9 && stats.ledgers[i].msgSuccess > .9) {
    if (stats.ledgers[i].connectDelay + stats.ledgers[i].msgDelay < 1000) {
      numLedgers.fast++;
    } else if (stats.ledgers[i].connectDelay + stats.ledgers[i].msgDelay < 2500) {
      numLedgers.medium++;
    } else {
      numLedgers.slow++;
    }
  } else {
    numLedgers.down++;
  }
}

var numConnectors = {
  quoting: 0,
  routeless: 0,
  down: 0,
  total: 0,
};
for (var i in stats.connectors) {
  numConnectors.total++;
  if (stats.connectors[i].gotReply > .9) {
    var quoting = false;
    for (var j in stats.connectors[i].quoteResults) {
      if (typeof stats.connectors[i].quoteResults[j] === 'number') {
        quoting = true;
        break;
      }
    }
    if (quoting) {
      numConnectors.quoting++;
    } else {
      numConnectors.routeless++;
    }
  } else {
    numConnectors.down++;
  }
}
fs.writeFileSync('../data/report.json', JSON.stringify({ numHosts, numLedgers, numConnectors }, null, 2));
