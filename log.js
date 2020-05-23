const { performance, PerformanceObserver } = require('perf_hooks')

function log (event) {
  process.stdout.write(
    'FAASTERMETRICS' +
      JSON.stringify({
        timestamp: new Date().getTime(),
        now: performance.now(),
        ...event
      }) +
      '\n'
  )
}

new PerformanceObserver(list =>
  list.getEntries().forEach(perf => log({ perf }))
).observe({ entryTypes: ['mark', 'function'] })

log({ coldstart: true })

module.exports = log
