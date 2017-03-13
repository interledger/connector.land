# Current status of the Interledger

* No. of ilp-kit hosts: 28, of which:
  * run a recent version: 14
  * run an older version: 6 -> https://github.com/interledgerjs/ilp-kit/issues/175
  * seem to be down: 8 -> I will try to contact their admins

* No. of five-bells ledgers: 19, of which:
  * connect + message to self in <1000ms: 8
  * connect + message to self in <2500ms: 8
  * connect + message to self in <5000ms: 3 -> I will try to contact their admins

* No. of peer ledgers: unknown

* No. of connectors: 32, of which:
  * serving at least one route: 10
  * respond 'no' to all quote requests: 5 -> I will investigate route expiry
  * are down: 17 -> https://github.com/interledgerjs/ilp-kit/pull/249

* No. of end-to-end routes: 73, of which:
  * payments successful: 0
  * connector lets source payment timeout: 44
  * connector rejects source payment: 12
  * outgoing_prepare event not received: 17
