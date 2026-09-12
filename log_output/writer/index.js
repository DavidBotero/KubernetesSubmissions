const fs = require('fs')
const { randomUUID } = require('crypto')

const FILE_PATH = '/usr/src/app/files/status.txt'

const id = randomUUID()

const writeStatus = () => {
  const line = `${new Date().toISOString()}: ${id}`
  fs.writeFileSync(FILE_PATH, line)
}

writeStatus()
setInterval(writeStatus, 5000)
