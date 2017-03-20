module.exports.hosts = [
   { hostname: 'red.ilpdemo.org',                        owner: ''},
   { hostname: 'blue.ilpdemo.org',                       owner: ''},
   { hostname: 'kes-ilp.abdishakur.com',                 owner: 'abdishakur'},
   { hostname: 'ilp.bigchaindb.com',                     owner: 'dimitri'},
   { hostname: 'za.zar.ilp.hopebailie.com',                 owner: 'admin'},
   { hostname: 'elmurci.ilp.network',                     owner: 'javi'},
   { hostname: 'pineapplesheep.ilp.rocks',               owner: 'pineapplesheep'},
   { hostname: 'usd.interledger.network',                owner: 'winthan'},
   { hostname: 'mmk.interledger.network',                owner: 'nyeinminn'},
   { hostname: 'interledger.kr',                         owner: 'mspark'},
   { hostname: 'nexus.justmoon.com',                     owner: 'stefan'},
   { hostname: 'gordon.mearnag.org',                     owner: 'connie'},
   { hostname: 'coins.paleorbglow.com',                  owner: 'kanaan'},
   { hostname: 'cornelius.sharafian.com',                owner: 'sharafian'},
   { hostname: 'cygnus.vahehovhannisyan.com',            owner: 'vahe'},
   { hostname: 'grifiti.web-payments.net',               owner: 'pkrey'},
   { hostname: 'hive.dennisappelt.com',                  owner: 'dennis'},
   { hostname: 'payment.am',                             owner: 'mesrop'},
   { hostname: 'ilp-kit.michielbdejong.com',             owner: 'michiel'},
   { hostname: 'john.jpvbs.com',                         owner: ''},
   { hostname: 'best-ilp.herokuapp.com',                 owner: ''},
   { hostname: 'someledger.herokuapp.com',               owner: ''},
   { hostname: 'michiel-is-not-available.herokuapp.com', owner: 'admin'},
   { hostname: 'royalcrypto.com',                        owner: 'twarden'},
   { hostname: 'ggizi.herokuapp.com',                    owner: ''},
   { hostname: 'michiel-eur.herokuapp.com',              owner: ''},
   { hostname: 'ilp.hexdivision.com',                    owner: 'admin'},
   { hostname: 'ilpkit-gce.fluid.money',                 owner: 'dfuelling'},
//  { hostname: '',                                       owner: ''},

// ^^^ Add your ILP host by duplicating, uncommenting, and editing the line above ^^^

// # hostname
// This should have the format like 'example.com', so without the 'https://' in front, and the connectorland script
// will do a WebFinger query for this host to find out which ledger(s) and which connector(s) are announced on there.
// (if your connector is not represented by a DNS (sub)domain, you can add it in the list of "named connectors" below)
//
// # owner
// The main user account you use on your ledger. People can use this to, for instance, send test payments to your
// node. It's also a sort of indication of what your nickname on other platforms like github or irc might be,
// so in the current situation where most host admins are also ILP enthusiasts, it gives us a hint of who to
// contact if a node is down. If you haven't created any users yet, and the software you run is ilp-kit, then
// you can simply fill in 'admin', which is the ledger user that always exists when you first install the ilp-kit
// software on your server.
];

module.exports.named = [
  { nick: 'micmic', addresses: [ 'micmic@red.ilpdemo.org', 'micmic@blue.ilpdemo.org', 'micmic@ilp-kit.michielbdejong.com', 'micmic@michiel-eur.herokuapp.com', 'micmic@michiel-is-not-available.herokuapp.com', 'micmic@cornelius.sharafian.com', 'micmic@hive.dennisappelt.com', 'micmic@cygnus.vahehovhannisyan.com', 'micmic@john.jpvbs.com', 'micmic@nexus.justmoon.com', 'micmic@royalcrypto.com', 'micmic@best-ilp.herokuapp.com', 'micmic@someledger.herokuapp.com', 'micmic@ggizi.herokuapp.com', ] },
//  { nick: '', addresses: [] },

// ^^^ Add your named connector by duplicating, uncommenting, and editing the line above ^^^

// If you created your connector as part of ilp-kit, it will automatically be set as a recommended connector for the
// ledger on that host, and you can add it to the `hosts` list above. However, if you created your connector in a
// different way, it's possible that it doesn't have a DNS (sub)domain associated with it. In this case, you can add
// it in this list of named connectors, by specifying the connector's SPSP addresses on two or more ledgers, instead.
];
