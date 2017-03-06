var quoteFromConn = require('./quoteFromConn');

var routes = [];

var ledgers = [
  [ 'lu.eur.michiel.',                  'ilp-kit.michielbdejong.com',             [ 'micmic', 'connector' ], ],
//  [ 'us.usd.hexdivision.',              'ilp.hexdivision.com',                    [ /* 'micmic', 'connector' */], ],
//  [ 'eu.eur.pineapplesheep.',           'pineapplesheep.ilp.rocks',               [ /* 'micmic', 'connector' */], ],
//  [ 'us.usd.michiel-is-not-available.', 'michiel-is-not-available.herokuapp.com', [ /* 'micmic', 'connector' */], ],
  [ 'lu.eur.michiel-eur.',              'michiel-eur.herokuapp.com',              [ /* 'micmic', 'connector' */], ],
//  [ 'us.usd.cygnus.',                   'cygnus.vahehovhannisyan.com',            [ /* 'micmic', 'connector' */], ],
//  [ 'us.usd.nexus.',                    'nexus.justmoon.com',                     [ /* 'micmic', 'connector' */], ],
//  [ 'us.usd.cornelius.',                'cornelius.sharafian.com',                [ /* 'micmic', 'connector' */], ],
//  [ 'us.usd.usd.',                      'usd.interledger.network',                [ /* 'micmic', 'connector' */], ],
//  [ 'us.usd.best-ilp.',                 'best-ilp.herokuapp.com',                 [ /* 'micmic', 'connector' */], ],
//  [ 'us.usd.ggizi.',                    'ggizi.herokuapp.com',                    [ /* 'micmic', 'connector' */], ],
//  [ 'ca.usd.royalcrypto.',              'royalcrypto.com',                        [ /* 'micmic', 'connector' */], ],
//  [ 'de.eur.blue.',                     'blue.ilpdemo.org',                       [ /* 'micmic', 'connector' */], ],
//  [ 'us.usd.red.',                      'red.ilpdemo.org',                        [ /* 'micmic', 'connector' */], ],
//  [ 'mm.mmk.interledger.',              'mmk.interledger.network',                [ /* 'micmic', 'connector' */], ],
//  [ 'kr.krw.interledgerkorea.',         'interledger.kr',                         [ /* 'micmic', 'connector' */], ],
];

ledgers.map(from => {
  from[2].map(conn => {
    ledgers.map(to => {
      routes.push([from[1], from[0], conn, to[0]]);
    });
  });
});


function testRoute(route) {
  return quoteFromConn.test(route[0], route[1], route[2], route[3]).then(curve => {
    return { route, curve };
  });
}

Promise.all(routes.map(testRoute)).then(results => {
  require('fs').writeFileSync('../data/curves.json', JSON.stringify(results, null, 2));
  process.exit(0);
});
