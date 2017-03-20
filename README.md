# Current status of the Interledger

* No. of ilp-kit hosts: 28, of which:
  * run a recent version: 14
  * run an older version: 5 -> https://github.com/interledgerjs/ilp-kit/issues/175
  * seem to be down: 11 -> I will try to contact their admins

* No. of five-bells ledgers: 23, of which:
  * connect + message to self in <1000ms: 7
  * connect + message to self in <2500ms: 6
  * connect + message to self in <5000ms: 5
  * timeout: 5 -> I will try to contact their admins

* No. of peer ledgers: unknown

* No. of connectors: 32, of which:
  * serving at least one route: 7
  * respond 'no' to all quote requests: 8 -> I will investigate route expiry
  * are down: 17 -> https://github.com/interledgerjs/ilp-kit/pull/249

* No. of end-to-end routes: 115, of which:
  * payments successful: 69
  * connector lets source payment timeout: <=46
  * connector rejects source payment: <=46
  * outgoing_prepare event not received: <=46
