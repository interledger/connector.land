# https://connector.land

To run the koa server:

```sh
npm install
node src/index.js data/stats.json data/creds.json public/ 8600
```

And then proxy port 8600 to https port 443 using for instance nginx + lestencrypt.
This will serve the https://connector.land website, as well as a partially functional ILP node with which nodes in the open ILP network can peer.
