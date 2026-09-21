const http = require('http')
const fs = require('fs')

const PORT = process.env.PORT || 3000
const STATUS_FILE = '/usr/src/app/files/status.txt'
const CONFIG_FILE = '/usr/src/app/config/information.txt'
const MESSAGE = process.env.MESSAGE || ''
const PINGPONG_URL = process.env.PINGPONG_URL || 'http://ping-pong-svc:3000/pongs'
const GREETER_URL = process.env.GREETER_URL || 'http://greeter-svc:3000'

const readFileOrDefault = (path, fallback) => {
  try {
    return fs.readFileSync(path, 'utf-8').trim()
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

const fetchGreeting = async () => {
  try {
    const response = await fetch(GREETER_URL, { signal: AbortSignal.timeout(2000) })
    return await response.text()
  } catch (e) {
    return 'no greeting available'
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/healthz') {
    try {
      const response = await fetch(PINGPONG_URL, { signal: AbortSignal.timeout(2000) })
      res.writeHead(response.ok ? 200 : 500)
    } catch (e) {
      res.writeHead(500)
    }
    res.end()
    return
  }

  const status = readFileOrDefault(STATUS_FILE, 'waiting for data...')
  const fileContent = readFileOrDefault(CONFIG_FILE, '')
  const pongs = await fetchPongs()
  const greeting = await fetchGreeting()

  const lines = [
    `file content: ${fileContent}`,
    `env variable: MESSAGE=${MESSAGE}`,
    `${status}.`,
    `Ping / Pongs: ${pongs}`,
    `Greeting: ${greeting}`,
  ]

  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(lines.join('\n'))
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
