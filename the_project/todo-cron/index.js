const https = require('https')

const TODO_BACKEND_URL = process.env.TODO_BACKEND_URL
const WIKIPEDIA_BASE = 'https://en.wikipedia.org'

const getRandomArticleUrl = () => new Promise((resolve, reject) => {
  const options = {
    headers: { 'User-Agent': 'KubernetesSubmissions-todo-cron/1.0 (davids.boteron@gmail.com)' },
  }
  https.get(`${WIKIPEDIA_BASE}/wiki/Special:Random`, options, (res) => {
    const location = res.headers.location
    res.resume()
    if (!location) {
      reject(new Error('no location header in response'))
      return
    }
    if (location.startsWith('http')) {
      resolve(location)
    } else if (location.startsWith('//')) {
      resolve(`https:${location}`)
    } else {
      resolve(`${WIKIPEDIA_BASE}${location}`)
    }
  }).on('error', reject)
})

const createTodo = async (content) => {
  const response = await fetch(`${TODO_BACKEND_URL}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!response.ok) {
    throw new Error(`todo-backend responded with ${response.status}`)
  }
}

const run = async () => {
  const url = await getRandomArticleUrl()
  const content = `Read ${url}`
  await createTodo(content)
  console.log(`Created todo: ${content}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
