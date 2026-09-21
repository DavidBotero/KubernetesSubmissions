const http = require('http')
const { Client } = require('pg')
const { connect, StringCodec } = require('nats')

const PORT = process.env.PORT
const DATABASE_URL = process.env.DATABASE_URL
const NATS_URL = process.env.NATS_URL
const NAMESPACE = process.env.NAMESPACE || 'default'

let client
let nats
const codec = StringCodec()

if (NATS_URL) {
  connect({ servers: NATS_URL, waitOnFirstConnect: true, maxReconnectAttempts: -1 })
    .then((connection) => {
      nats = connection
      console.log('connected to NATS')
    })
    .catch((e) => console.log(`could not connect to NATS: ${e.message}`))
}

const publish = (message, todo) => {
  if (!nats) return
  nats.publish(`todos.${NAMESPACE}`, codec.encode(JSON.stringify({ user: 'bot', message, todo })))
}

const connectWithRetry = async () => {
  while (true) {
    const candidate = new Client({ connectionString: DATABASE_URL })
    try {
      await candidate.connect()
      client = candidate
      return
    } catch (e) {
      console.log('waiting for database...')
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
}

const init = async () => {
  await connectWithRetry()
  await client.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT false
    )
  `)
}

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
  if (req.url === '/healthz') {
    try {
      await client.query('SELECT 1')
      sendJson(res, 200, { status: 'ok' })
    } catch (e) {
      sendJson(res, 500, { status: 'database unavailable' })
    }
    return
  }

  console.log(`${req.method} ${req.url}`)

  if (req.method === 'GET' && req.url === '/todos') {
    const result = await client.query('SELECT id, content, done FROM todos ORDER BY id')
    sendJson(res, 200, result.rows)
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
      console.log(`todo rejected, content too long or missing (length ${content ? content.length : 0})`)
      sendJson(res, 400, { error: 'content missing or too long' })
      return
    }

    console.log(`todo created: ${content}`)
    const result = await client.query(
      'INSERT INTO todos (content) VALUES ($1) RETURNING id, content, done',
      [content]
    )
    publish('A todo was created', result.rows[0])
    sendJson(res, 201, result.rows[0])
    return
  }

  const todoPath = req.url.match(/^\/todos\/(\d+)$/)
  if (req.method === 'PUT' && todoPath) {
    const body = await readBody(req)
    let done = true
    try {
      if (body) done = JSON.parse(body).done !== false
    } catch (e) {
      done = true
    }

    const result = await client.query(
      'UPDATE todos SET done = $2 WHERE id = $1 RETURNING id, content, done',
      [todoPath[1], done]
    )
    if (result.rows.length === 0) {
      sendJson(res, 404, { error: 'todo not found' })
      return
    }

    console.log(`todo ${todoPath[1]} marked as ${done ? 'done' : 'not done'}`)
    publish('A todo was updated', result.rows[0])
    sendJson(res, 200, result.rows[0])
    return
  }

  res.writeHead(404)
  res.end()
})

init().then(() => {
  server.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`)
  })
})
