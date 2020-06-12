module.exports = function redis () {
  const db = {}
  return {
    set: async (key, value) => {
      db[key] = JSON.stringify(value)
    },
    get: async key => {
      const res = db[key]
      if (!res) return res
      return JSON.parse(res)
    },
    keys: async () => {
      return Object.keys(db)
    }
  }
}
