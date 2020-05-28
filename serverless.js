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

function createContext (fn, contextId) {
  const measurement = m => {
    performance.mark(`${fn}:${contextId}:start:${m}`)
    return () => {
      performance.mark(`${fn}:${contextId}:end:${m}`)
      performance.measure(
        `${fn}:${contextId}:${m}`,
        `${fn}:${contextId}:start:${m}`,
        `${fn}:${contextId}:end:${m}`
      )
    }
  }
  return {
    log: e => log(Object.assign({ fn, contextId }, e || {})),
    call: (f, payload) => {
      const end = measurement(`rpcOut:${f}`)
      const res = call(
        f,
        contextId,
        Object.assign({ caller: fn }, payload || {})
      )
      end()
      return res
    },
    mark: m => performance.mark(`${fn}:${contextId}:${m}`),
    measure: measurement,
    contextId
  }
}

function logRequestAndAttachContext (ctx) {
  const fn = helper.getFnName(ctx)
  const contextId = ctx.request.get('x-context') || helper.generateRandomID()
  log({
    fn,
    contextId,
    request: _.pick(ctx, ['method', 'originalUrl', 'headers'])
  })
  ctx.params.fn = fn
  ctx.contextId = contextId
  ctx.lib = createContext(fn, contextId)
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

  router.use(handleErrors, hybridBodyParser())

  const wrapHandler = (m, r, h) =>
    router[m](r, async (ctx, next) => {
      logRequestAndAttachContext(ctx)
      const end = ctx.lib.measure(`${m}:${r}`)
      await h(ctx, next)
      end()
    })

  routerFn({
    get: (r, h) => wrapHandler('get', r, h),
    post: (r, h) => wrapHandler('post', r, h),
    put: (r, h) => wrapHandler('put', r, h),
    patch: (r, h) => wrapHandler('patch', r, h),
    del: (r, h) => wrapHandler('del', r, h),
    all: (r, h) => wrapHandler('all', r, h),
    addRpcHandler: handler =>
      router.post('/call', async (ctx, next) => {
        logRequestAndAttachContext(ctx)
        const end = ctx.lib.measure(
          `rpcIn:${ctx.request.get('x-pair') || 'undefined-x-pair'}`
        )
        ctx.body = await handler(ctx.request.body, ctx.lib)
        end()
      })
  })

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
