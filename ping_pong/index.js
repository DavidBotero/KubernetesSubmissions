const http = require('http')
const { Client } = require('pg')

const PORT = process.env.PORT || 3000
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
    CREATE TABLE IF NOT EXISTS counter (
      id INTEGER PRIMARY KEY,
      count INTEGER NOT NULL
    )
  `)
  await client.query(`
    INSERT INTO counter (id, count) VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING
  `)
}

const bumpAndGetCount = async () => {
  const result = await client.query(
    'UPDATE counter SET count = count + 1 WHERE id = 1 RETURNING count'
  )
  return result.rows[0].count
}

const getCount = async () => {
  const result = await client.query('SELECT count FROM counter WHERE id = 1')
  return result.rows[0].count
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/healthz') {
    try {
      await client.query('SELECT 1')
      res.writeHead(200)
      res.end('ok')
    } catch (e) {
      res.writeHead(500)
      res.end('database unavailable')
    }
    return
  }

  if (req.url === '/pongs') {
    const count = await getCount()
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(String(count))
    return
  }

  const count = await bumpAndGetCount()
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end(`pong ${count - 1}`)
})

init().then(() => {
  server.listen(PORT, () => {
    console.log(`Server started in port ${PORT}`)
  })
})
