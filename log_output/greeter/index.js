const http = require('http')

const PORT = process.env.PORT || 3000
const VERSION = process.env.VERSION || 'v1'

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`hello from greeter ${VERSION}`)
})

server.listen(PORT, () => {
  console.log(`Greeter ${VERSION} started in port ${PORT}`)
})
