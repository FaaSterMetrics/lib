const fs = require('fs')
const path = require('path')

const helper = {
  isLambda: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
  isGoogle: !!process.env.K_SERVICE && !!process.env.K_REVISION,
  isAzure: !!process.env.IS_AZURE_FUNCTION_APP
}

module.exports = {
  prefix: () => {
    if (helper.isLambda) return '/:fn'
    if (helper.isAzure) return '/api/:fn'
    return null
  },
  generateRandomID: () => {
    return Math.random()
      .toString(36)
      .slice(2, 10)
  },
  loadExperiment: () => {
    try {
      return JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'experiment.json'), 'UTF-8')
      )
    } catch (e) {
      return {}
    }
  },
  getFnName: ctx => {
    if (helper.isLambda || helper.isAzure) return ctx.params.fn
    return (
      process.env.K_SERVICE ||
      process.env.FAASTERMETRICS_FN_NAME ||
      'unknownFnName'
    )
  },
  ...helper
}
