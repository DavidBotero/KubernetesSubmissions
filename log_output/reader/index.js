const http = require('http')
const fs = require('fs')

const PORT = process.env.PORT || 3000
const STATUS_FILE = '/usr/src/app/files/status.txt'
const PONGS_FILE = '/usr/src/app/pongfiles/pongs.txt'

const readFileOrDefault = (path, fallback) => {
  try {
    return fs.readFileSync(path, 'utf-8')
  } catch (e) {
    return fallback
  }
}

const server = http.createServer((req, res) => {
  const status = readFileOrDefault(STATUS_FILE, 'waiting for data...')
  const pongs = readFileOrDefault(PONGS_FILE, '0')
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`${status}.\nPing / Pongs: ${pongs}`)
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
