const Redis = require('ioredis')

module.exports = {
  connect: () => new Redis(process.env.REDIS_ENDPOINT)
}
