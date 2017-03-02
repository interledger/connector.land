module.exports.hosts = [
  { "hostname": "red.ilpdemo.org",                        "prefix": "",                                 "owner": ""},
  { "hostname": "blue.ilpdemo.org",                       "prefix": "",                                 "owner": ""},
  { "hostname": "kes-ilp.abdishakur.com",                 "prefix": "ke.kes.kes-ilp.",                  "owner": "abdishakur"},
  { "hostname": "ilp.bigchaindb.com",                     "prefix": "de.eur.bigchaindb.",               "owner": "dimitri"},
  { "hostname": "zar-ilp.hopebailie.com",                 "prefix": "za.zar.hopebailie.",               "owner": "adrian"},
  { "hostname": "milton.ilp.network",                     "prefix": "gb.gbp.milton.",                   "owner": "javi"},
  { "hostname": "pineapplesheep.ilp.rocks",               "prefix": "lu.eur.pineapplesheep.",           "owner": "pineapplesheep"},
  { "hostname": "usd.interledger.network",                "prefix": "us.usd.interledger.",              "owner": "winthan"},
  { "hostname": "mmk.interledger.network",                "prefix": "mm.mmk.interledger.",              "owner": "nyeinminn"},
  { "hostname": "interledger.kr",                         "prefix": "kr.krw.interledgerkorea.",         "owner": "mspark"},
  { "hostname": "nexus.justmoon.com",                     "prefix": "us.usd.nexus.",                    "owner": "stefan"},
  { "hostname": "gordon.mearnag.org",                     "prefix": "us.usd.mearnag.gordon.",           "owner": "connie"},
  { "hostname": "coins.paleorbglow.com",                  "prefix": "us.usd.paleorbglow.",              "owner": "kanaan"},
  { "hostname": "cornelius.sharafian.com",                "prefix": "us.usd.cornelius.",                "owner": "sharafian"},
  { "hostname": "cygnus.vahehovhannisyan.com",            "prefix": "us.usd.cygnus.",                   "owner": "vahe"},
  { "hostname": "grifiti.web-payments.net",               "prefix": "us.usd.grifiti.",                  "owner": "pkrey"},
  { "hostname": "hive.dennisappelt.com",                  "prefix": "lu.eur.hive.",                     "owner": "dennis"},
  { "hostname": "payment.am",                             "prefix": "am.amd.payment.",                  "owner": "mesrop"},
  { "hostname": "ilp-kit.michielbdejong.com",             "prefix": "lu.eur.michiel.",                  "owner": "michiel"},
  { "hostname": "john.jpvbs.com",                         "prefix": "",                                 "owner": ""},
  { "hostname": "best-ilp.herokuapp.com",                 "prefix": "",                                 "owner": ""},
  { "hostname": "someledger.herokuapp.com",               "prefix": "",                                 "owner": ""},
  { "hostname": "michiel-is-not-available.herokuapp.com", "prefix": "us.usd.michiel-is-not-available.", "owner": "admin"},
  { "hostname": "royalcrypto.com",                        "prefix": "ca.usd.royalcrypto.",              "owner": "twarden"},
  { "hostname": "ggizi.herokuapp.com",                                       "prefix": "",                                 "owner": ""},
  { "hostname": "michiel-eur.herokuapp.com",                                       "prefix": "",                                 "owner": ""},
  { "hostname": "ilp.hexdivision.com",                    "prefix": "us.usd.hexdivision.",              "owner": "admin"},
//  { "hostname": "",                                       "prefix": "",                                 "owner": ""},

// ^^^ Add your ILP host by duplicating, uncommenting, and editing the line above ^^^

// # hostname
// This should have the format like 'example.com', so without the 'https://' in front.

// # prefix
// If your node is running ilp-kit as the software, then you can run `grep LEDGER_ILP_PREFIX= env.list` to find
// the line in your `env.list` file which contains your ledger's ILP prefix; fill this in in the 'prefix' field.
// If your node is running on heroku, you can use the `heroku` command-line tool to see its environment variables,
// for instance:
// heroku config --app michiel-is-not-available | grep LEDGER_ILP_PREFIX

// # owner
// The main user account you use on your ledger. People can use this to, for instance, send test payments to your
// node. It's also a sort of indication of what your nickname on other platforms like github or irc might be,
// so in the current situation where most host admins are also ILP enthusiasts, it gives us a hint of who to
// contact if a node is down. If you haven't created any users yet, and the software you run is ilp-kit, then
// you can simply fill in 'admin', which is the ledger user that always exists when you first install the ilp-kit
// software on your server.
];
