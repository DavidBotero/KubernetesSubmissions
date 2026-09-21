const http = require('http')
const fs = require('fs')

const PORT = process.env.PORT
const IMAGE_PATH = '/usr/src/app/files/image.jpg'
const CACHE_MS = 10 * 60 * 1000
const TODO_BACKEND_URL = process.env.TODO_BACKEND_URL
const PICSUM_URL = process.env.PICSUM_URL

const isImageFresh = () => {
  try {
    const stat = fs.statSync(IMAGE_PATH)
    return Date.now() - stat.mtimeMs < CACHE_MS
  } catch (e) {
    return false
  }
}

const refreshImage = async () => {
  const response = await fetch(PICSUM_URL)
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(IMAGE_PATH, buffer)
}

const ensureImage = async () => {
  if (!isImageFresh()) {
    await refreshImage()
  }
}

const fetchTodos = async () => {
  const response = await fetch(`${TODO_BACKEND_URL}/todos`)
  return response.json()
}

const createTodo = async (content) => {
  await fetch(`${TODO_BACKEND_URL}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

const renderPage = (todos) => `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Todo App</title>
</head>
<body>
  <main>
    <div>
      <h1>The project App</h1>
      <img src="/image" alt="Kubeapp" width="300" />
      <form action="/todos" method="post">
        <input type="text" id="content" name="content" maxlength="140" required>
        <button type="submit">Create todo</button>
      </form>
      <form action="/break" method="post">
        <button type="submit">Break the app</button>
      </form>
      <ul>
${todos.map((todo) => `        <li>${todo.content}</li>`).join('\n')}
      </ul>
      <p>DevOps with Kubernetes 2026</p>
    </div>
  </main>
</body>
</html>`

const readBody = (req) => new Promise((resolve) => {
  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', () => resolve(body))
})

let isHealthy = true

const server = http.createServer(async (req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(isHealthy ? 200 : 500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: isHealthy ? 'ok' : 'unhealthy' }))
    return
  }

  if (req.method === 'POST' && req.url === '/break') {
    isHealthy = false
    res.writeHead(303, { Location: '/' })
    res.end()
    return
  }

  if (!isHealthy) {
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('The app is broken. Kubernetes will restart it soon.')
    return
  }

  if (req.url === '/image') {
    await ensureImage()
    const image = fs.readFileSync(IMAGE_PATH)
    res.writeHead(200, { 'Content-Type': 'image/jpeg' })
    res.end(image)
    return
  }

  if (req.method === 'POST' && req.url === '/todos') {
    const body = await readBody(req)
    const content = new URLSearchParams(body).get('content')
    await createTodo(content)
    res.writeHead(303, { Location: '/' })
    res.end()
    return
  }

  const todos = await fetchTodos()
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(renderPage(todos))
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
