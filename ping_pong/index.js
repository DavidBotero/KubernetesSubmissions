const http = require('http')
const fs = require('fs')

const PORT = process.env.PORT || 3000
const FILE_PATH = '/usr/src/app/files/pongs.txt'

let counter = 0

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`pong ${counter}`)
  counter++
  fs.writeFileSync(FILE_PATH, String(counter))
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
