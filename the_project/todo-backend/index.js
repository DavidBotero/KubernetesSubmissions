const http = require('http')

const PORT = process.env.PORT

let todos = []

const sendJson = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

const readBody = (req) => new Promise((resolve) => {
  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', () => resolve(body))
})

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/todos') {
    sendJson(res, 200, todos)
    return
  }

  if (req.method === 'POST' && req.url === '/todos') {
    const body = await readBody(req)
    let content
    try {
      content = JSON.parse(body).content
    } catch (e) {
      content = undefined
    }

    if (!content || content.length > 140) {
      sendJson(res, 400, { error: 'content missing or too long' })
      return
    }

    const todo = { content, done: false }
    todos.push(todo)
    sendJson(res, 201, todo)
    return
  }

  res.writeHead(404)
  res.end()
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
