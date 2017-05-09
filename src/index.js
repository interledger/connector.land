const Koa = require('koa')
const koaStatic = require('koa-static')
const IlpNode = require('ilp-node')

const statsFile = process.env.STATS_FILE
const credsFile = process.env.CREDS_FILE
const publicFolder = process.env.PUBLIC_FOLDER
const hostname = process.env.HOSTNAME
const port = process.env.PORT
const probeInterval = process.env.PROBE_INTERVAL

const ilpNode = new IlpNode(statsFile, credsFile, hostname)

const app = new Koa()
app.use(async function(ctx, next) {
  console.log(ctx.path)
  switch(ctx.path) {
  case '/.well-known/webfinger': ctx.body = await ilpNode.handleWebFinger(ctx.query.resource, '/spsp')
    break
  case '/rpc': ctx.body = await ilpNode.handleRpc(ctx.query, ctx.body)
    break
  case '/spsp': ctx.body = await ilpNode.handleSpsp()
    break
  case '/stats':
    if (typeof ctx.query.test === 'string') {
      await ilpNode.testHost(ctx.query.test)
    }
    ctx.body = ilpNode.stats
    break
  default:
    return next()
  }
  ctx.type = 'json'
  console.log('rendered', ctx.path, ctx.query, ctx.body)
})
app.use(koaStatic(publicFolder))
app.listen(port)

setInterval(() => {
  ilpNode.testAll()
}, probeInterval)
