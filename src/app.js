const mainController = require('./mainController')
const Koa = require('koa')
const Router = require('koa-router')
const Parser = require('koa-bodyparser')
const Views = require('koa-views')
const Serve = require('koa-static')
const path = require('path')

class App {
  constructor (deps) {
    this.index = deps(mainController)
    this.router = Router()
    this.parser = Parser()
    this.serve = Serve(path.resolve(__dirname, '../public'))
    this.views = Views(path.resolve(__dirname, '../public'), {
      map: {
        html: 'underscore'
      }
    })

    this.app = new Koa()
  }

  async listen () {
    // await this.errors.init(this.app)

    const server = this.app
      .use(this.parser)
      .use(this.views)
      .use(this.serve)
      .use(this.router.routes())
      .listen(6001)

    console.log('listening on 6001')
    await this.index.init(this.router)
    console.log('initializing router')
    console.log(this.index.init)
    console.log(this.router)
  }
}

module.exports = App
