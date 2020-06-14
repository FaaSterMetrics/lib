/* eslint-env jest */
process.env.FAASTERMETRICS_FN_NAME = 'testFn'

const serverless = require('../serverless')
const request = require('supertest')

test('serverless.event', async () => {
  const { googleHandler } = serverless.rpcHandler(async event => ({
    ok: true,
    event
  }))
  const response = await request(googleHandler)
    .post('/call')
    .set('X-Pair', '123456')
    .send({ test: 'event' })
  expect(response.status).toBe(200)
  expect(response.body).toMatchSnapshot()
})

test('serverless.router', async () => {
  const { googleHandler } = serverless.router(router => {
    router.get('/', (ctx, next) => {
      ctx.body = { ok: true }
    })
    router.addRpcHandler(async event => ({ ok: true, event }))
  })
  const responseGET = await request(googleHandler).get('/')
  expect(responseGET.status).toBe(200)
  expect(responseGET.body).toMatchSnapshot()

  const responsePOST = await request(googleHandler)
    .post('/call')
    .send({ test: 'event2' })
  expect(responsePOST.status).toBe(200)
  expect(responsePOST.body).toMatchSnapshot()
})

test('serverless.event lambda', async () => {
  jest.resetModules()
  process.env.AWS_LAMBDA_FUNCTION_NAME = 'test'
  const serverless2 = require('../serverless')
  const { googleHandler } = serverless2.rpcHandler(async event => ({
    ok: true,
    event
  }))
  const response = await request(googleHandler)
    .post('/test/call')
    .send({ test: 'event3' })
  expect(response.status).toBe(200)
  expect(response.body).toMatchSnapshot()
})

test('serverless.event db context', async () => {
  const { googleHandler } = serverless.rpcHandler(
    { db: 'memory' },
    async (event, ctx) => {
      expect(ctx.db).toBeDefined()
      return { test: 'db' }
    }
  )
  const response = await request(googleHandler).post('/call')
  expect(response.status).toBe(200)
  expect(response.body).toMatchSnapshot()
})
