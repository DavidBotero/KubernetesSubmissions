const http = require('http')
const fs = require('fs')

const PORT = process.env.PORT || 3000
const FILE_PATH = '/usr/src/app/files/status.txt'

const server = http.createServer((req, res) => {
  let content
  try {
    content = fs.readFileSync(FILE_PATH, 'utf-8')
  } catch (e) {
    content = 'waiting for data...'
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(content)
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
