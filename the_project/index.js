const http = require('http')
const fs = require('fs')

const PORT = process.env.PORT || 3000
const IMAGE_PATH = '/usr/src/app/files/image.jpg'
const CACHE_MS = 10 * 60 * 1000

const isImageFresh = () => {
  try {
    const stat = fs.statSync(IMAGE_PATH)
    return Date.now() - stat.mtimeMs < CACHE_MS
  } catch (e) {
    return false
  }
}

const refreshImage = async () => {
  const response = await fetch('https://picsum.photos/1200')
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(IMAGE_PATH, buffer)
}

const ensureImage = async () => {
  if (!isImageFresh()) {
    await refreshImage()
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/image') {
    await ensureImage()
    const image = fs.readFileSync(IMAGE_PATH)
    res.writeHead(200, { 'Content-Type': 'image/jpeg' })
    res.end(image)
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(`<h1>Todo App</h1>
<img src="/image" alt="random" width="300" />
<p>The project is up and running.</p>`)
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
