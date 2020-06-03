const { performance, PerformanceObserver } = require('perf_hooks')
const LIB_VERSION = require('./package.json').version

const uniqueFnId = require('crypto')
  .randomBytes(32)
  .toString('hex')

const fnName = process.env.FAASTERMETRICS_FN_NAME || 'unknownFn'

function log (event) {
  process.stdout.write(
    'FAASTERMETRICS' +
      JSON.stringify({
        timestamp: new Date().getTime(),
        now: performance.now(),
        version: LIB_VERSION,
        fn: {
          id: uniqueFnId,
          name: fnName
        },
        event
      }) +
      '\n'
  )
}

new PerformanceObserver(list =>
  list.getEntries().forEach(perf => {
    const perfName = perf.name.split(':')
    if (perfName.shift() !== fnName) return
    log({
      contextId: perfName.shift(),
      xPair: perfName.shift(),
      perf: { mark: perfName.join(':'), ...perf }
    })
  })
).observe({ entryTypes: ['mark', 'measure', 'function'] })

log({
  coldstart: true
})

module.exports = log
module.exports.fnName = fnName
