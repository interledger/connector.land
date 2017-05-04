const Koa = require('koa')
const koaStatic = require('koa-static')
const IlpNode = require('ilp-node')

const statsFile = process.env.STATS_FILE
const credsFile = process.env.CREDS_FILE
const publicFolder = process.env.PUBLIC_FOLDER
const port = process.env.PORT
const probeInterval = process.env.PROBE_INTERVAL

const ilpNode = new IlpNode(statsFile, credsFile)

const app = new Koa()
app.use(async function(ctx, next) {
  switch(ctx.path) {
  case '/stats':
    if (typeof ctx.query.test === 'string') {
      await ilpNode.testHost(ctx.query.test)
    }
    ctx.type = 'json'
    ctx.body = ilpNode.stats
    console.log('rendered', ctx.body)
    break
  default:
    return next()
  }
})
app.use(koaStatic(publicFolder))
app.listen(port)

setInterval(() => {
  ilpNode.testAll()
}, probeInterval)
