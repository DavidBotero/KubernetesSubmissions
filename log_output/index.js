const http = require('http')
const { randomUUID } = require('crypto')

const PORT = process.env.PORT || 3000

const id = randomUUID()

const status = () => `${new Date().toISOString()}: ${id}`

const logStatus = () => console.log(status())

logStatus()
setInterval(logStatus, 5000)

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(status())
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
