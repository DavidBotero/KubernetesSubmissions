const http = require('http')
const { Client } = require('pg')

const PORT = process.env.PORT
const DATABASE_URL = process.env.DATABASE_URL

let client

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
  console.log(`${req.method} ${req.url}`)

  if (req.method === 'GET' && req.url === '/todos') {
    const result = await client.query('SELECT content, done FROM todos ORDER BY id')
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
      'INSERT INTO todos (content) VALUES ($1) RETURNING content, done',
      [content]
    )
    sendJson(res, 201, result.rows[0])
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
