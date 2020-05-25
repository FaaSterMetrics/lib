const _ = require('lodash')
const fetch = require('node-fetch')

const helper = require('./helper')

const experiment = helper.loadExperiment()

const endpoints = {
  aws: process.env.AWS_LAMBDA_ENDPOINT,
  google: process.env.GOOGLE_CLOUDFUNCTION_ENDPOINT
}

module.exports = async (fn, contextId, payload) => {
  const provider = _.get(experiment, `program.functions.${fn}.provider`)
  if (!endpoints[provider]) throw new Error('unknown provider')
  const res = await fetch(`${endpoints[provider]}/${fn}/call`, {
    method: 'post',
    body: JSON.stringify(payload || {}),
    headers: {
      'Content-Type': 'application/json',
      'X-Context': contextId,
      'X-Pair': `${contextId}-${helper.generateRandomID()}`
    }
  })
  return res.json()
}
