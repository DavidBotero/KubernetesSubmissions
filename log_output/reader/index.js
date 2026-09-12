const http = require('http')
const fs = require('fs')

const PORT = process.env.PORT || 3000
const STATUS_FILE = '/usr/src/app/files/status.txt'
const PINGPONG_URL = process.env.PINGPONG_URL || 'http://ping-pong-svc:3000/pongs'

const readFileOrDefault = (path, fallback) => {
  try {
    return fs.readFileSync(path, 'utf-8')
  } catch (e) {
    return fallback
  }
}

const fetchPongs = async () => {
  try {
    const response = await fetch(PINGPONG_URL)
    return await response.text()
  } catch (e) {
    return '0'
  }
}

const server = http.createServer(async (req, res) => {
  const status = readFileOrDefault(STATUS_FILE, 'waiting for data...')
  const pongs = await fetchPongs()
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`${status}.\nPing / Pongs: ${pongs}`)
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
