const ConnectorRoutes = require('./lib/routeGetter')
const stats = require('../data/stats')
const Ping = require('./lib/ping')

class mainController {
  constructor (deps) {
    this.ping = deps(Ping)
  }

  async init (router) {
    await this.ping.init()

    router.get('/', async ctx => {
      console.log('getting index')
      await ctx.render('../public/index')
    })
    router.get('/routing', async ctx => {
      const { localRoutingTable } = await ConnectorRoutes.getRoutingTable()
      let routes = []
      for (let route in localRoutingTable) {
        routes = [...routes, route]
      }

      ctx.body = routes
    })
    router.get('/stats', async ctx => {
      ctx.body = stats
    })
    router.post('/pingroutes', async ctx => {
      const { routes } = ctx.request.body

      let result = []
      for (let destination in routes) {
        try {
          await this.ping.ping(routes[destination])
          result.push({route: routes[destination], live: 'Yes'})
        } catch (err) {
          console.log(err)
          result.push({route: routes[destination], live: 'No', error: err})
        }
      }

      ctx.body = result
    })
  }
}

module.exports = mainController