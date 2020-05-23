const _ = require('lodash')
const serverless = require('serverless-http')
const azure = require('azure-function-express')

const Koa = require('koa')
const Router = require('@koa/router')
const bodyParser = require('koa-bodyparser')
const qs = require('qs')

const log = require('./log')
const helper = require('./helper')
const performance = require('./performance')
const call = require('./call')

function createContext (fn) {
  return {
    log: e => log(Object.assign({ fn }, e || {})),
    call: (f, payload) => call(f, Object.assign({ caller: fn }, payload || {})),
    mark: m => performance.mark(`${fn}:${m}`)
  }
}

function logger (ctx, next) {
  const fn = helper.getFnName(ctx)
  log(Object.assign({ fn }, _.pick(ctx, ['method', 'originalUrl', 'headers'])))
  ctx.params.fn = fn
  ctx.lib = createContext(fn)
  return next()
}

async function handleErrors (ctx, next) {
  try {
    await next()
  } catch (e) {
    ctx.body = { error: e.toString() }
    ctx.status = 502
  }
}

function hybridBodyParser () {
  const bp = bodyParser()
  return async (ctx, next) => {
    if (
      helper.isAzure &&
      ctx.request.is('application/x-www-form-urlencoded') &&
      ctx.req.body
    ) {
      ctx.req.body = qs.parse(ctx.req.body, { allowDots: true })
    }
    ctx.request.body =
      helper.isGoogle || helper.isAzure ? ctx.req.body : ctx.request.body
    return bp(ctx, next)
  }
}

function serverlessRouter (routerFn) {
  const app = new Koa()
  const router = new Router({
    prefix: helper.prefix()
  })

  router.use(logger, handleErrors, hybridBodyParser())
  router.addRpcHandler = handler =>
    router.post('/call', async (ctx, next) => {
      ctx.lib.mark('startRpcHandler')
      ctx.body = await handler(ctx.request.body, ctx.lib)
      ctx.lib.mark('endRpcHandler')
    })

  routerFn(router)

  app.use(router.routes())
  app.use(router.allowedMethods())

  return {
    lambdaHandler: serverless(app),
    googleHandler: app.callback(),
    azureHandler: azure.createHandler(app.callback())
  }
}

module.exports.router = serverlessRouter
module.exports.rpcHandler = handler =>
  serverlessRouter(r => r.addRpcHandler(handler))
