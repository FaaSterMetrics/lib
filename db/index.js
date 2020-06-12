const _ = require('lodash')

const backends = {
  redis: require('./redis'),
  memory: require('./memory')
}

module.exports = {
  connect: backend => {
    if (!backend) backend = 'memory'
    if (!backends[backend])
      throw new Error(`the backend '${backend}' does not exist`)
    const db = backends[backend]()
    return function bindToMeasure (measure) {
      if (!_.isFunction(measure)) throw new Error('measure is not a function')
      return _.mapValues(db, (f, action) => {
        return async (...args) => {
          const end = measure(`dbOut:${action}`)
          const ret = await f(...args)
          end()
          return ret
        }
      })
    }
  }
}
