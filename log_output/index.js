const { randomUUID } = require('crypto')

const id = randomUUID()

const logWithTimestamp = () => {
  console.log(`${new Date().toISOString()}: ${id}`)
}

logWithTimestamp()
setInterval(logWithTimestamp, 5000)
