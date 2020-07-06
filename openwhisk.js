const _ = require('lodash')
const openwhiskHandler = require('expressjs-openwhisk')

function handlerSingelton (appFactory) {
  let app = null
  return () => {
    if (!app) app = appFactory()
    return app.openwhiskHandler
  }
}

function extractEnv (args) {
  return _.mapKeys(
    _.pickBy(args, (v, k) => k.startsWith('__env_')),
    (v, k) => k.replace(/^__env_/, '')
  )
}

function stripPrivateArgs (args) {
  return _.pickBy(args, (v, k) => !k.startsWith('__'))
}

module.exports = appFactory => {
  const getHandler = handlerSingelton(appFactory)

  return args => {
    process.env = {
      ...process.env,
      ...extractEnv(args)
    }

    if (
      !args.__ow_body &&
      ['post', 'put', 'patch'].includes(args.__ow_method)
    ) {
      args.__ow_body = stripPrivateArgs(args)
      args.__ow_headers = _.omit(args.__ow_headers, ['content-type'])
    }

    return openwhiskHandler(getHandler())(args)
  }
}
