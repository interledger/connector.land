const fetch = require('node-fetch')

exports.getRoutingTable = async () => {
  const res = await fetch('http://localhost:7769/routing', {
    method: 'GET',
  })
  return res.json()
}