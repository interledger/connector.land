const ConnectorRoutes = require('./lib/routeGetter')
const Ping = require('./lib/ping')
const fs = require('fs-extra')

class mainController {
  constructor (deps) {
    this.ping = deps(Ping)
  }

  async init (router) {
    console.log('initializing ping')
    await this.ping.init()
    console.log('ping initialized')

    router.get('/', async ctx => {
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
      let { routes } = ctx.request.body
      routes = routes.filter(e => !e.includes('g.feraltc.'))
      let result = []
      for (let destination in routes) {
        try {
          await this.ping.ping(routes[destination])
          result.push({route: routes[destination], live: 'Yes'})
          console.log('updated result: ', result)
        } catch (err) {
          console.log(err)
          result.push({route: routes[destination], live: 'No', error: err})
          console.log('updated result: ', result)
        }
      }

      ctx.body = result
    })

    router.post('/pingroute', async ctx => {
      let destination = ctx.request.body.destination
      try {
        await this.ping.ping(destination)
        ctx.body = {route: destination, live: 'Yes'}
      } catch (err) {
        console.error(err)
        ctx.body = {route: destination, live: 'No', error: err}
      }
    })

    router.get('/actions/graph', async ctx => {
      const { localRoutingTable } = await ConnectorRoutes.getRoutingTable()

      const mapTree = {
        name: 'connector.land',
        contents: {}
      }

      for (const dest of Object.keys(localRoutingTable)) {
        if (dest.includes('g.feraltc.')) continue
        const pathStr =  localRoutingTable[dest].path
        const path = pathStr ? pathStr.split(' ') : [ dest ]

        let root = mapTree
        for (const hop of path) {
          if (!root.contents[hop]) {
            root.contents[hop] = { name: hop, contents: {} }
          }

          root = root.contents[hop]
        }
      }

      function mapTreeToListTree (root) {
        return {
          name: root.name,
          contents: Object.values(root.contents).map(mapTreeToListTree)
        }
      }

      ctx.body = mapTreeToListTree(mapTree)
    })

    router.get('/graph.js', async ctx => {
      ctx.set('content-type', 'text/javascript')
      ctx.body = await fs.readFile(path.resolve(__dirname, '../public/graph.js'))
    })

    router.get('/graphStyle.css', async ctx => {
      ctx.set('content-type', 'text/css')
      ctx.body = await fs.readFile(path.resolve(__dirname, '../public/graphStyle.css'))
    })
  }
}

module.exports = mainController