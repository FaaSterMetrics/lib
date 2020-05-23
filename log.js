const { performance, PerformanceObserver } = require('perf_hooks')
const LIB_VERSION = require('./package.json').version

function log (event) {
  process.stdout.write(
    'FAASTERMETRICS' +
      JSON.stringify({
        timestamp: new Date().getTime(),
        now: performance.now(),
        version: LIB_VERSION,
        event
      }) +
      '\n'
  )
}

new PerformanceObserver(list =>
  list.getEntries().forEach(perf => {
    const perfName = perf.name.split(':')
    log({
      fn: perfName.shift(),
      perf: { mark: perfName.join(':'), ...perf }
    })
  })
).observe({ entryTypes: ['mark', 'measure', 'function'] })

log({ coldstart: true })

module.exports = log
