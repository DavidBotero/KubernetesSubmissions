const http = require('http')

const PORT = process.env.PORT || 3000

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end('<h1>Todo App</h1><p>The project is up and running.</p>')
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
