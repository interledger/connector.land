const fetch = require('node-fetch')

// class RouteGetter {
//   constructor (deps) {
//   }

//   async getRoutingTable () {
//     const res = await fetch('http://localhost:7769/routing', {
//       method: 'GET'
//     })
//     return res.json()
//   }
// }

// module.exports = RouteGetter

exports.getRoutingTable = async () => {
  const res = await fetch('http://localhost:7769/routing', {
    method: 'GET',
  })
  return res.json()
}