const Koa = require('koa')
const koaStatic = require('koa-static')
const IlpNode = require('ilp-node')
const redis = require("redis")

const publicFolder = process.env.PUBLIC_FOLDER || './public'
const hostname = process.env.HOSTNAME || 'connector.land'
const port = process.env.PORT || 6001 // avoid port 6000 because of https://superuser.com/questions/188058/which-ports-are-considered-unsafe-on-chrome
const probeInterval = process.env.PROBE_INTERVAL || 10000

const redisClient = redis.createClient({ url: process.env.REDIS_URL })
redisClient.on('error', function (err) {
  console.log('Error ' + err)
})

const ilpNode = new IlpNode(redisClient, hostname)

const app = new Koa()
app.use(async function(ctx, next) {
  // console.log(ctx.path)
  switch(ctx.path) {
  case '/.well-known/webfinger': ctx.body = await ilpNode.handleWebFinger(ctx.query.resource, '/spsp')
    break
  case '/rpc':
    let str = ''
    await new Promise(resolve => {
      ctx.req.on('data', chunk => str += chunk)
      ctx.req.on('end', resolve)
    })
    // console.log('calling ilpNode.handleRpc')
    ctx.body = await ilpNode.handleRpc(ctx.query, JSON.parse(str))
    // console.log('returned from ilpNode.handleRpc')
    break
  case '/test':
    console.log('test hit!', ctx.query)
    ctx.body = await ilpNode.handleTest(ctx.query)
    break
  case '/stats':
    await ilpNode.ensureReady()
    await ilpNode.collectLedgerStats(10000)
    if (typeof ctx.query.test === 'string') {
      // console.log('testing!', ctx.query.test)
      await ilpNode.testHost(ctx.query.test)
    }
    ctx.body = ilpNode.stats
    break
  default:
    return next()
  }
  ctx.type = 'json'
  // console.log('rendered', ctx.path, ctx.query, ctx.body)
})
app.use(koaStatic(publicFolder))
app.listen(port)
console.log('listening on ', port)
setInterval(() => {
  ilpNode.testAll()
}, probeInterval)
console.log('interval set!', probeInterval)
  ilpNode.testAll()
console.log('first test done!')
