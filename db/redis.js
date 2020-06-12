const Redis = require('ioredis')

module.exports = function redis () {
  const db = new Redis(process.env.REDIS_ENDPOINT)
  return {
    set: async (key, value) => {
      return db.set(key, JSON.stringify(value))
    },
    get: async key => {
      const res = await db.get(key)
      if (!res) return res
      return JSON.parse(res)
    },
    keys: async () => {
      return db.keys()
    }
  }
}
